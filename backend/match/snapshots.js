// What clients receive. Never includes tokens, socket ids or the answer key.

function publicPlayer(player) {
    return {
        id: player.id,
        nickname: player.nickname,
        ready: player.ready,
        connected: player.connected,
        status: player.status,
        health: player.health,
        score: player.score,
        questionIndex: player.questionIndex,
    };
}

function stateFor(match, player, { question, remainingMs }) {
    return {
        id: match.id,
        type: match.type,
        code: match.code,
        hostId: match.hostId,
        phase: match.phase,
        maxPlayers: match.maxPlayers,
        durationMs: match.durationMs,
        endsAt: match.endsAt,
        remainingMs,
        players: [...match.players.values()].map(publicPlayer),
        me: {
            id: player.id,
            health: player.health,
            score: player.score,
            questionIndex: player.questionIndex,
            status: player.status,
            ready: player.ready,
        },
        question,
    };
}

const sameStanding = (a, b) => a.score === b.score && a.health === b.health && a.questionIndex === b.questionIndex;

// Ranked by score, then health, then questions answered. An exact tie at the top has no winner.
function finalResults(match) {
    const results = [...match.players.values()]
        .map(({ id, nickname, score, health, questionIndex, status, connected }) => ({
            id,
            nickname,
            score,
            health,
            questionIndex,
            status,
            connected,
        }))
        .sort((a, b) => b.score - a.score || b.health - a.health || b.questionIndex - a.questionIndex);
    const [top] = results;
    const tied = top && results.filter(player => sameStanding(player, top)).length > 1;
    return { results, winnerId: top && !tied ? top.id : null };
}

module.exports = { finalResults, stateFor };
