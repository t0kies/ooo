// Client event → coordinator call. Each returns the ack payload.
const EVENTS = {
    'match:quick-join': (c, id, p) => c.quickJoin(id, p?.nickname),
    'match:invite-create': (c, id, p) => c.createInvite(id, p?.nickname),
    'match:invite-join': (c, id, p) => c.joinInvite(id, p?.code, p?.nickname),
    'match:ready': (c, id, p) => c.setReady(id, p?.ready),
    'match:kick': (c, id, p) => c.kick(id, p?.playerId),
    'match:guess': (c, id, p) => c.submitGuess(id, p?.questionIndex, p?.optionId),
    'match:reconnect': (c, id, p) => c.reconnect(id, p?.token),
    'match:leave': (c, id) => {
        c.disconnect(id);
        return { ok: true };
    },
};

module.exports = { EVENTS };
