const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('../helpers/harness');

test('reconnect restores a disconnected active player', () => {
    const h = createHarness();
    const first = h.coordinator.quickJoin('a', 'Ada');
    h.coordinator.quickJoin('b', 'Bob');
    h.coordinator.setReady('a', true);
    h.coordinator.setReady('b', true);
    h.coordinator.disconnect('a');

    assert.equal(h.coordinator.reconnect('a2', first.reconnectToken).ok, true);
    assert.equal(h.latest('a2', 'match:state').me.status, 'active');
    assert.equal(h.coordinator.submitGuess('a2', 0, 0).ok, true);
    assert.equal(h.coordinator.reconnect('a3', first.reconnectToken).error, 'reconnect_unavailable');
});

test('rejects malformed reconnect tokens', () => {
    const h = createHarness();
    assert.equal(h.coordinator.reconnect('a', 42).error, 'invalid_reconnect_token');
    assert.equal(h.coordinator.reconnect('a', 'x'.repeat(101)).error, 'invalid_reconnect_token');
    assert.equal(h.coordinator.reconnect('a', 'unknown').error, 'reconnect_unavailable');
});
