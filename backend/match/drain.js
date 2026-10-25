const { broadcast } = require('./broadcast');
const { closeMatch, notifyIfIdle } = require('./lifecycle');

// Stops new joins and cancels lobbies and the queue. Running matches play
// out; onIdle is called once none are left.
function drain(ctx, onIdle) {
    Object.assign(ctx, { draining: true, onIdle });
    for (const match of [...ctx.matches.values()]) {
        if (match.phase !== 'lobby') continue;
        broadcast(ctx, match, 'match:cancelled', { reason: 'server_restarting' });
        closeMatch(ctx, match);
    }
    for (const player of ctx.quickQueue.splice(0)) {
        ctx.emit(player.socketId, 'match:cancelled', { reason: 'server_restarting' });
        ctx.players.forget(player);
    }
    ctx.invites.clearHeld();
    notifyIfIdle(ctx);
}

// Drops everything at once, timers included.
function shutdown(ctx) {
    for (const match of ctx.matches.values()) {
        ctx.cancel(match.timer);
        ctx.cancel(match.lobbyTimer);
    }
    ctx.matches.clear();
    ctx.players.clear();
    ctx.invites.clear();
    ctx.quickQueue.length = 0;
}

module.exports = { drain, shutdown };
