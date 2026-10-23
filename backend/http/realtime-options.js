// The socket layer's options, from the loaded config.
function realtimeOptions({ features, match, difficulty, nicknameMaxLength, security, limits }) {
    return {
        requireOrigin: security.requireOrigin,
        clientIpHeader: security.clientIpHeader,
        limits,
        features,
        coordinatorOptions: {
            matchDurationMs: match.seconds * 1000,
            lobbyTimeoutMs: match.lobbyTimeoutSeconds * 1000,
            startingHealth: match.startingHealth,
            minReactionMs: match.minReactionMs,
            minPlayers: match.minPlayers,
            maxPlayers: match.maxPlayers,
            difficulty,
            nicknameMaxLength,
        },
    };
}

module.exports = { realtimeOptions };
