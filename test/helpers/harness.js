const assert = require('node:assert/strict');
const { MatchCoordinator } = require('../../backend/match/coordinator');

// A coordinator on a fake clock with captured events and manual timers.
function createHarness(options = {}) {
    const events = [];
    const timers = [];
    let now = 0;
    const coordinator = new MatchCoordinator({
        emit: (socketId, event, payload) => events.push({ socketId, event, payload }),
        now: () => now,
        minReactionMs: 0,
        wallNow: () => 10_000 + now,
        setTimeoutFn: (callback, delay) => {
            const timer = { callback, delay, unref() {} };
            timers.push(timer);
            return timer;
        },
        clearTimeoutFn: () => {},
        random: () => 0,
        ...options,
    });
    return {
        coordinator,
        events,
        timers,
        setNow(value) {
            now = value;
        },
        latest(socketId, event) {
            return events.filter(item => item.socketId === socketId && item.event === event).at(-1)?.payload;
        },
    };
}

// Two players quick-match and ready up; returns the match id.
function startQuickMatch(harness, first = 'a', second = 'b') {
    const { coordinator } = harness;
    coordinator.quickJoin(first, `Player ${first}`);
    const joined = coordinator.quickJoin(second, `Player ${second}`);
    assert.equal(joined.ok, true);
    coordinator.setReady(first, true);
    coordinator.setReady(second, true);
    return joined.matchId;
}

module.exports = { createHarness, startQuickMatch };
