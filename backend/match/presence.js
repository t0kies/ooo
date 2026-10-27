const { broadcastState } = require('./broadcast');
const { closeMatch, finishMatch } = require('./lifecycle');
const { removeFromLobby, startIfReady } = require('./lobby');
const { everyoneOut, hashToken } = require('./players');
const { fail, joined } = require('./replies');

function setReady(ctx, socketId, ready) {
    const player = ctx.players.bySocket.get(socketId);
    if (!player || typeof ready !== 'boolean') return fail('invalid_state');
    const match = ctx.matches.get(player.matchId);
    if (match?.phase !== 'lobby') return fail('match_not_waiting');
    player.ready = ready;
    broadcastState(ctx, match);
    startIfReady(ctx, match);
    return { ok: true };
}

// Only the owner of an invite room can kick, and only from the lobby.
function kick(ctx, socketId, playerId) {
    const host = ctx.players.bySocket.get(socketId);
    const match = host && ctx.matches.get(host.matchId);
    if (match?.phase !== 'lobby') return fail('match_not_waiting');
    if (match.hostId !== host.id) return fail('not_host');
    const target = match.players.get(playerId);
    if (!target || target === host) return fail('invalid_state');

    removeFromLobby(ctx, match, target);
    ctx.emit(target.socketId, 'match:cancelled', { reason: 'kicked' });
    broadcastState(ctx, match);
    startIfReady(ctx, match);
    return { ok: true };
}

// Moves a disconnected player onto a new socket, if their match is still on.
function reconnect(ctx, socketId, token) {
    if (typeof token !== 'string' || token.length > 100) return fail('invalid_reconnect_token');
    if (ctx.players.bySocket.has(socketId)) return fail('invalid_state');
    const player = ctx.players.byToken.get(hashToken(token));
    if (!player || player.connected) return fail('reconnect_unavailable');
    const match = ctx.matches.get(player.matchId);
    if (!match || match.phase === 'finished') return fail('reconnect_unavailable');

    player.socketId = socketId;
    player.connected = true;
    if (player.status === 'disconnected') player.status = 'active';
    ctx.players.bySocket.set(socketId, player);
    broadcastState(ctx, match);
    return joined(player, match);
}

// Queued and lobby players are dropped; in a running match the player stays
// in the results and can reconnect.
function disconnect(ctx, socketId) {
    const player = ctx.players.bySocket.get(socketId);
    if (!player || player.socketId !== socketId) return;
    ctx.players.bySocket.delete(socketId);
    player.connected = false;

    const match = ctx.matches.get(player.matchId);
    if (!match) {
        ctx.quickQueue = ctx.quickQueue.filter(queued => queued !== player);
        ctx.players.forget(player);
        return;
    }
    if (match.phase === 'lobby') {
        removeFromLobby(ctx, match, player);
        if (match.players.size === 0) return closeMatch(ctx, match);
        broadcastState(ctx, match);
        return startIfReady(ctx, match);
    }
    if (match.phase === 'active' && player.status === 'active') {
        player.status = 'disconnected';
        if (everyoneOut(match)) return finishMatch(ctx, match, 'no_active_players');
    }
    broadcastState(ctx, match);
}

module.exports = { disconnect, kick, reconnect, setReady };
