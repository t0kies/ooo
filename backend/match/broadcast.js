const { makeQuestion, publicQuestion } = require('../game/puzzles');
const { stateFor } = require('./snapshots');

// Questions are generated on demand and shared by everyone in the match.
function questionAt(ctx, match, index) {
    while (match.questions.length <= index) {
        match.questions.push(makeQuestion(match.questions.length, ctx.random, ctx.settings.difficulty));
    }
    return match.questions[index];
}

function broadcast(ctx, match, event, payload) {
    for (const player of match.players.values()) {
        if (player.connected) ctx.emit(player.socketId, event, payload);
    }
}

// Each connected player gets their own view: their question and the time left.
function broadcastState(ctx, match) {
    const active = match.phase === 'active';
    for (const player of match.players.values()) {
        if (!player.connected) continue;
        const playing = active && player.status === 'active';
        ctx.emit(
            player.socketId,
            'match:state',
            stateFor(match, player, {
                question: playing ? publicQuestion(questionAt(ctx, match, player.questionIndex)) : null,
                remainingMs: active ? Math.max(0, match.deadlineMonotonic - ctx.now()) : null,
            }),
        );
    }
}

module.exports = { broadcast, broadcastState, questionAt };
