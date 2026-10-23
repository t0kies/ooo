const test = require('node:test');
const assert = require('node:assert/strict');
const { hsbToHex } = require('../../backend/game/color');
const {
    DIFFICULTY_PRESETS,
    OPTION_COUNT,
    makeQuestion,
    publicQuestion,
    stepFor,
} = require('../../backend/game/puzzles');

test('converts HSB to hex', () => {
    assert.equal(hsbToHex(0, 100, 100), '#FF0000');
    assert.equal(hsbToHex(120, 100, 100), '#00FF00');
    assert.equal(hsbToHex(240, 100, 50), '#000080');
    assert.equal(hsbToHex(0, 0, 100), '#FFFFFF');
    assert.equal(hsbToHex(-120, 100, 100), '#0000FF');
});

test('generates six public options without exposing the answer', () => {
    const question = makeQuestion(0, () => 0);
    assert.equal(question.options.length, OPTION_COUNT);
    assert.equal(question.correctOption, 0);
    assert.ok(question.options.every(option => /^#[0-9A-F]{6}$/.test(option.hex_code)));
    assert.equal(Object.hasOwn(publicQuestion(question), 'correctOption'), false);
});

test('exactly one option differs from the rest', () => {
    const question = makeQuestion(3);
    const colors = question.options.map(option => option.hex_code);
    const odd = colors.filter(color => colors.indexOf(color) === colors.lastIndexOf(color));
    assert.deepEqual(odd, [colors[question.correctOption]]);
});

test('normal difficulty follows the original 16 to 3 curve', () => {
    const original = i => Math.max(3, Math.round(16 - (13 * Math.min(i, 9)) / 9));
    for (let i = 0; i < 15; i++) assert.equal(stepFor(i, DIFFICULTY_PRESETS.normal), original(i));
});
