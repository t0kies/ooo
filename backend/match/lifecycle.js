const { broadcast, broadcastState } = require('./broadcast');
const { finalResults } = require('./snapshots');

function startMatch(ctx, match) {
    const { matchDurationMs, minPlayers } = ctx.settings;
    if (match.phase !== 'lobby' || match.players.size < minPlayers) return;
    match.phase = 'active';
    ctx.cancel(match.lobbyTimer);
    match.startedAt = ctx.now();
    match.deadlineMonotonic = match.startedAt + matchDurationMs;
    match.endsAt = ctx.wallNow() + matchDurationMs;
    for (const player of match.players.values()) {
        player.status = 'active';
        player.questionShownAt = match.startedAt;
    }
    match.timer = ctx.later(() => finishMatch(ctx, match, 'time'), matchDurationMs);
    broadcastState(ctx, match);
    broadcast(ctx, match, 'match:started', { endsAt: match.endsAt, durationMs: matchDurationMs });
}

// Sends the results and closes the match. An invite code is held so the
// group can reopen the room.
function finishMatch(ctx, match, reason) {
    if (match?.phase !== 'active') return;
    match.phase = 'finished';
    const { results, winnerId } = finalResults(match);
    broadcast(ctx, match, 'match:finished', { reason, results, winnerId, code: match.code });
    closeMatch(ctx, match);
    if (match.code) ctx.invites.hold(match.code);
}

function closeMatch(ctx, match) {
    ctx.cancel(match.timer);
    ctx.cancel(match.lobbyTimer);
    ctx.matches.delete(match.id);
    if (match.code) ctx.invites.open.delete(match.code);
    for (const player of match.players.values()) ctx.players.forget(player);
    notifyIfIdle(ctx);
}

// While draining, calls onIdle once the last match has closed.
function notifyIfIdle(ctx) {
    if (!ctx.draining || ctx.matches.size > 0 || !ctx.onIdle) return;
    const done = ctx.onIdle;
    ctx.onIdle = null;
    done();
}

module.exports = { closeMatch, finishMatch, notifyIfIdle, startMatch };
