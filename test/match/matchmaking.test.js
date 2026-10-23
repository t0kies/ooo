const test = require('node:test');
const assert = require('node:assert/strict');
const { MatchCoordinator } = require('../../backend/match/coordinator');
const { createHarness } = require('../helpers/harness');

test('pairs quick-match players and waits for both to be ready', () => {
    const h = createHarness();
    const first = h.coordinator.quickJoin('a', 'Ada');
    assert.equal(first.queued, true);

    const second = h.coordinator.quickJoin('b', 'Bob');
    assert.equal(second.phase, 'lobby');
    assert.equal(h.latest('a', 'match:state').phase, 'lobby');

    h.coordinator.setReady('a', true);
    assert.equal(h.latest('a', 'match:state').phase, 'lobby');
    h.coordinator.setReady('b', true);
    assert.equal(h.latest('a', 'match:state').phase, 'active');
    assert.equal(h.latest('b', 'match:state').endsAt, 45_000);
});

test('disconnect removes an unmatched player from quick queue', () => {
    const h = createHarness();
    h.coordinator.quickJoin('a', 'Ada');
    h.coordinator.disconnect('a');
    h.coordinator.quickJoin('b', 'Bob');
    assert.equal(h.latest('b', 'match:queue').status, 'searching');
    assert.equal(h.coordinator.matches.size, 0);
});

test('one socket can only be one player', () => {
    const h = createHarness();
    h.coordinator.quickJoin('a', 'Ada');
    assert.equal(h.coordinator.quickJoin('a', 'Ada again').error, 'invalid_nickname');
});

test('honours maxPlayers', () => {
    const coordinator = new MatchCoordinator({ emit() {}, maxPlayers: 2, minPlayers: 2 });
    const first = coordinator.createInvite('a', 'one');
    coordinator.joinInvite('b', first.code, 'two');
    assert.equal(coordinator.joinInvite('c', first.code, 'three').error, 'match_full');
});

test('drain cancels lobbies, refuses joins, and waits for running matches', () => {
    const events = [];
    const timers = [];
    const coordinator = new MatchCoordinator({
        emit: (id, event, payload) => events.push([id, event, payload?.reason]),
        setTimeoutFn: fn => timers.push(fn) && timers.length,
        clearTimeoutFn() {},
    });
    const lobby = coordinator.createInvite('a', 'one');
    coordinator.joinInvite('b', lobby.code, 'two');
    coordinator.setReady('a', true);
    coordinator.setReady('b', true); // starts: now running
    coordinator.createInvite('c', 'solo-lobby');
    coordinator.quickJoin('q', 'queued');

    let idle = false;
    coordinator.drain(() => {
        idle = true;
    });
    const cancelled = id =>
        events.some(([to, e, r]) => to === id && e === 'match:cancelled' && r === 'server_restarting');
    assert.ok(cancelled('c') && cancelled('q'));
    assert.equal(coordinator.quickJoin('z', 'late').error, 'server_restarting');
    assert.equal(idle, false);
    assert.equal(coordinator.matches.size, 1);

    for (const fn of timers) fn();
    assert.equal(idle, true);
});
