const { createHash, randomBytes, randomUUID } = require('node:crypto');

const hashToken = token => createHash('sha256').update(token).digest('hex');

// The plain reconnect token goes to the client once; the server keeps only its hash.
function createPlayer({ socketId, nickname, health }) {
    const reconnectToken = randomBytes(32).toString('base64url');
    return {
        id: randomUUID(),
        socketId,
        nickname,
        reconnectToken,
        tokenHash: hashToken(reconnectToken),
        ready: false,
        connected: true,
        status: 'waiting',
        health,
        score: 0,
        questionIndex: 0,
        matchId: null,
    };
}

const everyoneOut = match => [...match.players.values()].every(player => player.status !== 'active');

module.exports = { createPlayer, everyoneOut, hashToken };
