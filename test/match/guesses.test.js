const test = require('node:test');
const assert = require('node:assert/strict');
const { OPTION_COUNT } = require('../../backend/game/puzzles');
const { createHarness, startQuickMatch } = require('../helpers/harness');

test('players progress independently through the same question sequence', () => {
    const h = createHarness();
    startQuickMatch(h);
    assert.deepEqual(h.latest('a', 'match:state').question, h.latest('b', 'match:state').question);

    assert.equal(h.coordinator.submitGuess('a', 0, 0).correct, true);
    assert.equal(h.latest('a', 'match:state').question.index, 1);
    assert.equal(h.latest('b', 'match:state').question.index, 0);
    assert.equal(h.latest('a', 'match:state').question.options.length, OPTION_COUNT);
    h.coordinator.submitGuess('b', 0, 0);
    assert.deepEqual(h.latest('a', 'match:state').question, h.latest('b', 'match:state').question);
});

test('eliminates a player after five wrong guesses and finalizes if all are eliminated', () => {
    const h = createHarness();
    startQuickMatch(h);
    for (let index = 0; index < 4; index++) {
        const result = h.coordinator.submitGuess('a', index, 1);
        assert.equal(result.correct, false);
        assert.equal(result.health, 4 - index);
        assert.equal(result.eliminated, false);
    }
    const last = h.coordinator.submitGuess('a', 4, 1);
    assert.equal(last.health, 0);
    assert.equal(last.eliminated, true);
    for (let index = 0; index < 5; index++) h.coordinator.submitGuess('b', index, 1);
    assert.equal(h.latest('a', 'match:finished').reason, 'all_eliminated');
    assert.equal(h.latest('b', 'match:finished').winnerId, null);
});

test('rejects stale, invalid, and post-deadline guesses', () => {
    const h = createHarness();
    startQuickMatch(h);
    assert.equal(h.coordinator.submitGuess('a', 2, 0).error, 'stale_question');
    assert.equal(h.coordinator.submitGuess('a', 0, 9).error, 'invalid_guess');
    h.setNow(35_000);
    assert.equal(h.coordinator.submitGuess('a', 0, 0).error, 'match_ended');
    assert.equal(h.latest('a', 'match:finished').reason, 'time');
});

test('rejects guesses faster than the minimum reaction time', () => {
    const h = createHarness({ minReactionMs: 250 });
    startQuickMatch(h);
    assert.equal(h.coordinator.submitGuess('a', 0, 0).error, 'too_fast');
    h.setNow(300);
    assert.equal(h.coordinator.submitGuess('a', 0, 0).ok, true);
    assert.equal(h.coordinator.submitGuess('a', 1, 0).error, 'too_fast');
    h.setNow(600);
    assert.equal(h.coordinator.submitGuess('a', 1, 0).ok, true);
});

test('an eliminated player can leave a running match and still appears in the results', () => {
    const h = createHarness();
    startQuickMatch(h);
    for (let index = 0; index < 5; index++) h.coordinator.submitGuess('a', index, 1);
    h.coordinator.disconnect('a');
    assert.equal(h.coordinator.quickJoin('a', 'Ada').queued, true);

    h.timers.at(-1).callback();
    const finished = h.latest('b', 'match:finished');
    assert.equal(finished.results.find(player => player.nickname === 'Player a').status, 'eliminated');
});
