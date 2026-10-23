// Ack payloads returned to the socket layer.
const fail = error => ({ ok: false, error });

function joined(player, match) {
    return {
        ok: true,
        queued: false,
        reconnectToken: player.reconnectToken,
        matchId: match.id,
        code: match.code,
        phase: match.phase,
        maxPlayers: match.maxPlayers,
        durationMs: match.durationMs,
    };
}

module.exports = { fail, joined };
