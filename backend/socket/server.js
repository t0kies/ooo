const { Server } = require('socket.io');
const { MatchCoordinator } = require('../match/coordinator');
const { EVENTS } = require('./events');
const { createLimits } = require('./limits');
const { clientIp, sameOrigin } = require('./origin');

const MAX_MESSAGE_BYTES = 8 * 1024;

function attachSocketServer(
    httpServer,
    {
        coordinatorOptions = {},
        requireOrigin = process.env.NODE_ENV === 'production',
        clientIpHeader = null,
        limits: limitOptions = {},
        features = {},
    } = {},
) {
    const { quickMatch = true, invites = true } = features;
    const disabled = {
        'match:quick-join': !quickMatch,
        'match:invite-create': !invites,
        'match:invite-join': !invites,
    };
    const io = new Server(httpServer, {
        maxHttpBufferSize: MAX_MESSAGE_BYTES,
        allowRequest: (request, callback) => callback(null, sameOrigin(request, { requireOrigin })),
    });
    const coordinator = new MatchCoordinator({
        emit: (socketId, event, payload) => io.to(socketId).emit(event, payload),
        ...coordinatorOptions,
    });
    const limits = createLimits(limitOptions);

    io.on('connection', socket => {
        const connection = limits.admit(clientIp(socket, clientIpHeader));
        if (!connection) return socket.disconnect(true);

        // without an ack callback, only errors are sent back (as match:error)
        const reply = (ack, result) => {
            if (typeof ack === 'function') ack(result);
            else if (!result.ok) socket.emit('match:error', result);
        };
        // every event is rate-limited, and a throwing handler can't crash the process
        const handle = (event, run) => (payload, ack) => {
            if (!connection.allowEvent()) return reply(ack, { ok: false, error: 'rate_limited' });
            if (disabled[event]) return reply(ack, { ok: false, error: 'feature_disabled' });
            try {
                reply(ack, run(coordinator, socket.id, payload));
            } catch (err) {
                console.error(`Socket event ${event} failed:`, err);
                reply(ack, { ok: false, error: 'internal_error' });
            }
        };
        for (const [event, run] of Object.entries(EVENTS)) socket.on(event, handle(event, run));
        socket.on('disconnect', () => {
            connection.release();
            coordinator.disconnect(socket.id);
        });
    });

    return {
        coordinator,
        drain: onIdle => coordinator.drain(onIdle),
        close(callback) {
            limits.close();
            coordinator.shutdown();
            io.close(callback);
        },
    };
}

module.exports = { attachSocketServer };
