const { broadcastState } = require('./broadcast');
const { addPlayer, createMatch } = require('./lobby');
const { createPlayer } = require('./players');
const { fail, joined } = require('./replies');
const { normalizeInviteCode, normalizeNickname } = require('./validation');

// Registers a new player for this socket, or null if the socket already has
// one or the nickname is invalid.
function newPlayer(ctx, socketId, rawNickname) {
    if (ctx.players.bySocket.has(socketId)) return null;
    const nickname = normalizeNickname(rawNickname, ctx.settings.nicknameMaxLength);
    if (!nickname) return null;
    const player = createPlayer({ socketId, nickname, health: ctx.settings.startingHealth });
    ctx.players.add(player);
    return player;
}

function enter(ctx, player, match) {
    broadcastState(ctx, match);
    return joined(player, match);
}

// Joins an open quick lobby, or queues until minPlayers are waiting.
function quickJoin(ctx, socketId, rawNickname) {
    if (ctx.draining) return fail('server_restarting');
    const player = newPlayer(ctx, socketId, rawNickname);
    if (!player) return fail('invalid_nickname');

    const { minPlayers, maxPlayers } = ctx.settings;
    const open = [...ctx.matches.values()].find(
        match => match.type === 'quick' && match.phase === 'lobby' && match.players.size < maxPlayers,
    );
    if (open) {
        addPlayer(open, player);
        return enter(ctx, player, open);
    }

    ctx.quickQueue.push(player);
    if (ctx.quickQueue.length < minPlayers) {
        ctx.emit(socketId, 'match:queue', { status: 'searching' });
        return { ok: true, queued: true, reconnectToken: player.reconnectToken };
    }
    return enter(ctx, player, createMatch(ctx, 'quick', ctx.quickQueue.splice(0, maxPlayers)));
}

function createInvite(ctx, socketId, rawNickname) {
    if (ctx.draining) return fail('server_restarting');
    const player = newPlayer(ctx, socketId, rawNickname);
    if (!player) return fail('invalid_nickname');
    return enter(ctx, player, createMatch(ctx, 'invite', [player], ctx.invites.newCode()));
}

// A held code (its match just ended) reopens as a new room owned by this player.
function joinInvite(ctx, socketId, rawCode, rawNickname) {
    if (ctx.draining) return fail('server_restarting');
    const code = normalizeInviteCode(rawCode);
    if (!code) return fail('invalid_code');

    if (ctx.invites.held.has(code)) {
        const player = newPlayer(ctx, socketId, rawNickname);
        if (!player) return fail('invalid_nickname');
        ctx.invites.reclaim(code);
        return enter(ctx, player, createMatch(ctx, 'invite', [player], code));
    }

    const match = ctx.matches.get(ctx.invites.open.get(code));
    if (match?.phase !== 'lobby') return fail('match_not_found');
    if (match.players.size >= ctx.settings.maxPlayers) return fail('match_full');
    const player = newPlayer(ctx, socketId, rawNickname);
    if (!player) return fail('invalid_nickname');
    addPlayer(match, player);
    return enter(ctx, player, match);
}

module.exports = { createInvite, joinInvite, quickJoin };
