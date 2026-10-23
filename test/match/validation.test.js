const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeInviteCode, normalizeNickname } = require('../../backend/match/validation');

test('validates nicknames', () => {
    assert.equal(normalizeNickname('  Ada  '), 'Ada');
    assert.equal(normalizeNickname(''), null);
    assert.equal(normalizeNickname('x'.repeat(21)), null);
    assert.equal(normalizeNickname('x'.repeat(5), 4), null);
    assert.equal(normalizeNickname('bad\nname'), null);
    assert.equal(normalizeNickname(42), null);
});

test('validates invite codes', () => {
    assert.equal(normalizeInviteCode(' ab12cd34 '), 'AB12CD34');
    assert.equal(normalizeInviteCode('bad-code'), null);
    assert.equal(normalizeInviteCode('AB12CD3'), null);
});
