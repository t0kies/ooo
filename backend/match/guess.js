const { OPTION_COUNT } = require('../game/puzzles');
const { broadcastState, questionAt } = require('./broadcast');
const { finishMatch } = require('./lifecycle');
const { everyoneOut } = require('./players');
const { fail } = require('./replies');

// Why a guess can't count, or null if it can.
function rejection(ctx, player, questionIndex, optionId) {
    if (!player.connected || player.status !== 'active') return 'player_inactive';
    if (!Number.isSafeInteger(questionIndex) || questionIndex !== player.questionIndex) return 'stale_question';
    if (!Number.isSafeInteger(optionId) || optionId < 0 || optionId >= OPTION_COUNT) return 'invalid_guess';
    // slows auto-pick bots: no human answers this fast
    if (ctx.now() - player.questionShownAt < ctx.settings.minReactionMs) return 'too_fast';
    return null;
}

function submitGuess(ctx, socketId, questionIndex, optionId) {
    const player = ctx.players.bySocket.get(socketId);
    if (!player) return fail('not_in_match');
    const match = ctx.matches.get(player.matchId);
    if (match?.phase !== 'active') return fail('match_not_active');
    if (ctx.now() >= match.deadlineMonotonic) {
        finishMatch(ctx, match, 'time');
        return fail('match_ended');
    }
    const rejected = rejection(ctx, player, questionIndex, optionId);
    if (rejected) return fail(rejected);

    const correct = optionId === questionAt(ctx, match, questionIndex).correctOption;
    if (correct) player.score++;
    else player.health--;
    if (player.health <= 0) {
        player.health = 0;
        player.status = 'eliminated';
    }
    player.questionIndex++;
    player.questionShownAt = ctx.now();

    const eliminated = player.status === 'eliminated';
    if (eliminated && everyoneOut(match)) finishMatch(ctx, match, 'all_eliminated');
    else broadcastState(ctx, match);
    return { ok: true, correct, health: player.health, score: player.score, eliminated };
}

module.exports = { submitGuess };
