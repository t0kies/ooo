const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../helpers/harness');

// An invite room with Ada (owner) and the given guests; returns the create ack.
function room(h, ...guests) {
    const created = h.coordinator.createInvite('a', 'Ada');
    for (const [socketId, nickname] of guests) h.coordinator.joinInvite(socketId, created.code, nickname);
    return created;
}

test('invite codes create and join a match, then expire when match starts', () => {
    const h = createHarness();
    const created = h.coordinator.createInvite('a', 'Ada');
    assert.match(created.code, /^[A-F0-9]{8}$/);
    assert.equal(h.coordinator.joinInvite('b', created.code.toLowerCase(), 'Bob').matchId, created.matchId);
    h.coordinator.setReady('a', true);
    h.coordinator.setReady('b', true);
    assert.equal(h.coordinator.joinInvite('c', created.code, 'Cam').error, 'match_not_found');
});

test('expires an abandoned invite lobby and invalidates its code', () => {
    const h = createHarness();
    const created = h.coordinator.createInvite('a', 'Ada');
    assert.equal(h.timers[0].delay, 300_000);
    h.timers[0].callback();
    assert.equal(h.latest('a', 'match:cancelled').reason, 'lobby_expired');
    assert.equal(h.coordinator.joinInvite('b', created.code, 'Bob').error, 'match_not_found');
});

test('invite code remains usable when its creator leaves a populated lobby', () => {
    const h = createHarness();
    const created = room(h, ['b', 'Bob'], ['c', 'Cam']);
    h.coordinator.disconnect('a');
    const joined = h.coordinator.joinInvite('d', created.code, 'Dee');
    assert.equal(joined.ok, true);
    assert.equal(joined.matchId, created.matchId);
});

test('the room owner can kick, and the owner passes on when they leave', () => {
    const h = createHarness();
    room(h, ['b', 'Bob'], ['c', 'Cam']);
    const state = h.latest('a', 'match:state');
    assert.equal(state.hostId, state.me.id);

    const bobId = state.players.find(player => player.nickname === 'Bob').id;
    assert.equal(h.coordinator.kick('b', bobId).error, 'not_host');
    assert.equal(h.coordinator.kick('a', state.me.id).ok, false);
    assert.equal(h.coordinator.kick('a', bobId).ok, true);
    assert.equal(h.latest('b', 'match:cancelled').reason, 'kicked');
    assert.equal(h.latest('a', 'match:state').players.length, 2);

    h.coordinator.disconnect('a');
    const camState = h.latest('c', 'match:state');
    assert.equal(camState.hostId, camState.me.id);
});

test('a lobby survives players leaving and starts once the rest are ready', () => {
    const h = createHarness();
    room(h, ['b', 'Bob'], ['c', 'Cam']);
    h.coordinator.setReady('a', true);
    h.coordinator.setReady('b', true);
    h.coordinator.disconnect('c');
    assert.equal(h.latest('a', 'match:state').phase, 'active');
});

test('an invite code reopens as a fresh lobby after the match, owned by whoever returns first', () => {
    const h = createHarness();
    const created = room(h, ['b', 'Bob']);
    h.coordinator.setReady('a', true);
    h.coordinator.setReady('b', true);
    h.timers.at(-1).callback();
    assert.equal(h.latest('a', 'match:finished').code, created.code);

    const back = h.coordinator.joinInvite('b2', created.code, 'Bob');
    assert.equal(back.ok, true);
    assert.equal(back.phase, 'lobby');
    const state = h.latest('b2', 'match:state');
    assert.equal(state.hostId, state.me.id);
    assert.equal(h.coordinator.joinInvite('a2', created.code, 'Ada').matchId, back.matchId);
});
