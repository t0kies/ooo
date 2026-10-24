import { cancelText, errorText } from '../messages.js';
import { savedMatch } from '../saved.js';
import { ACK_TIMEOUT_MS, send, showNotice } from './actions.js';
import { goHome, stopPractice } from './session.js';

// On (re)connect: send the action that was waiting for the connection, or
// try to resume the saved match.
function onConnect(ctx) {
    if (ctx.pendingAction) {
        const { event, payload } = ctx.pendingAction;
        ctx.pendingAction = null;
        return send(ctx, event, payload);
    }
    const token = savedMatch.get();
    if (!token || ctx.reconnecting) return;
    ctx.reconnecting = true;
    ctx.socket.timeout(ACK_TIMEOUT_MS).emit('match:reconnect', { token }, (error, response) => {
        ctx.reconnecting = false;
        if (!error && response?.ok) return;
        savedMatch.clear();
        if (!ctx.state) goHome(ctx, errorText(response?.error));
    });
}

function onState(ctx, next) {
    const { state, damage, clock } = ctx;
    stopPractice(ctx);
    ctx.queued = false;
    if (state && next.me.health < state.me.health) damage.hit();
    const newRound = state?.id !== next.id || state?.phase !== 'active';
    if (newRound) clock.setRemaining(next.phase === 'active' ? Math.max(0, next.remainingMs || 0) : null);
    if (state?.me.questionIndex !== next.me.questionIndex) ctx.guess.feedback = '';
    Object.assign(ctx, { selfId: next.me.id, state: next, notice: '' });
    ctx.render();
}

// Socket.IO event name → handler(payload).
export function serverEvents(ctx) {
    return {
        connect: () => onConnect(ctx),
        'match:state': next => onState(ctx, next),
        'match:queue'() {
            if (ctx.state) return;
            ctx.queued = true;
            ctx.render();
        },
        'match:cancelled'(payload) {
            savedMatch.clear();
            goHome(ctx, cancelText(payload?.reason));
        },
        'match:error': payload => showNotice(ctx, errorText(payload?.error)),
        'match:finished'(payload) {
            Object.assign(ctx, { state: null, result: payload });
            ctx.clock.stop();
            savedMatch.clear();
            ctx.render();
        },
        connect_error() {
            if (!ctx.state) goHome(ctx, "couldn't connect · check your connection and try again");
        },
    };
}
