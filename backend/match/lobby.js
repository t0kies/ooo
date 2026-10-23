const { randomUUID } = require('node:crypto');
const { broadcast } = require('./broadcast');
const { closeMatch, startMatch } = require('./lifecycle');

function createMatch(ctx, type, players, code = null) {
    const { maxPlayers, matchDurationMs, lobbyTimeoutMs } = ctx.settings;
    const match = {
        id: randomUUID(),
        type,
        code,
        hostId: type === 'invite' ? players[0].id : null,
        phase: 'lobby',
        maxPlayers,
        durationMs: matchDurationMs,
        players: new Map(),
        questions: [],
        startedAt: null,
        deadlineMonotonic: null,
        endsAt: null,
        timer: null,
        lobbyTimer: null,
    };
    ctx.matches.set(match.id, match);
    if (code) ctx.invites.open.set(code, match.id);
    for (const player of players) addPlayer(match, player);
    match.lobbyTimer = ctx.later(() => expireLobby(ctx, match), lobbyTimeoutMs);
    return match;
}

function addPlayer(match, player) {
    player.matchId = match.id;
    player.status = 'waiting';
    match.players.set(player.id, player);
}

// In an invite room the next player in line becomes owner.
function removeFromLobby(ctx, match, player) {
    match.players.delete(player.id);
    ctx.players.forget(player);
    if (match.hostId !== player.id) return;
    match.hostId = match.type === 'invite' ? ([...match.players.keys()][0] ?? null) : null;
}

function startIfReady(ctx, match) {
    const players = [...match.players.values()];
    const ready = players.every(player => player.ready && player.connected);
    if (players.length >= ctx.settings.minPlayers && ready) startMatch(ctx, match);
}

function expireLobby(ctx, match) {
    if (match.phase !== 'lobby') return;
    broadcast(ctx, match, 'match:cancelled', { reason: 'lobby_expired' });
    closeMatch(ctx, match);
}

module.exports = { addPlayer, createMatch, removeFromLobby, startIfReady };
