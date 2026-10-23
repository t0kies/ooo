const test = require('node:test');
const assert = require('node:assert/strict');
const { createLimits } = require('../../backend/socket/limits');

test('players sharing one IP each get a full event budget', () => {
    const limits = createLimits({ eventsPerWindow: 5 });
    const players = Array.from({ length: 4 }, () => limits.admit('10.0.0.1'));
    for (let round = 0; round < 5; round++) {
        for (const player of players) assert.equal(player.allowEvent(), true);
    }
    assert.equal(players[0].allowEvent(), false);
    limits.close();
});

test('the budget shrinks again when connections leave, so reconnecting resets nothing', () => {
    const limits = createLimits({ eventsPerWindow: 5 });
    const first = limits.admit('10.0.0.1');
    for (let i = 0; i < 5; i++) assert.equal(first.allowEvent(), true);
    first.release();
    const again = limits.admit('10.0.0.1');
    assert.equal(again.allowEvent(), false);
    limits.close();
});
