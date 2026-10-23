const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, publicConfig } = require('../../backend/config');

test('defaults reproduce the original game', () => {
    const config = loadConfig({});
    assert.equal(config.match.seconds, 35);
    assert.equal(config.match.maxPlayers, 8);
    assert.equal(config.difficulty.name, 'normal');
    assert.equal(config.security.clientIpHeader, null);
    assert.equal(config.site.publicUrl, null);
});

test('overrides apply and presets can be tuned', () => {
    const config = loadConfig({
        MAX_PLAYERS: '4',
        DIFFICULTY: 'hard',
        DIFFICULTY_MIN_STEP: '1',
        CLIENT_IP_HEADER: 'X-Real-IP',
        PUBLIC_URL: 'https://example.com/',
    });
    assert.equal(config.match.maxPlayers, 4);
    assert.equal(config.difficulty.startStep, 12);
    assert.equal(config.difficulty.minStep, 1);
    assert.equal(config.security.clientIpHeader, 'x-real-ip');
    assert.equal(config.site.publicUrl, 'https://example.com');
});

test('reports every problem at once', () => {
    assert.throws(
        () => loadConfig({ MIN_PLAYERS: '9', MAX_PLAYERS: '3', MATCH_SECONDS: 'abc', DIFFICULTY: 'insane' }),
        err => /MIN_PLAYERS/.test(err.message) && /MATCH_SECONDS/.test(err.message) && /DIFFICULTY/.test(err.message),
    );
    const allOff = { FEATURE_SOLO: 'false', FEATURE_QUICK_MATCH: 'false', FEATURE_INVITES: 'false' };
    assert.throws(() => loadConfig(allOff), /cannot all be off/);
    assert.throws(() => loadConfig({ PUBLIC_URL: 'example.com/path' }), /PUBLIC_URL/);
});

test('public config leaks no security or limit settings', () => {
    const shown = publicConfig(loadConfig({ CLIENT_IP_HEADER: 'x-real-ip' }));
    assert.deepEqual(Object.keys(shown).sort(), ['difficulty', 'features', 'match', 'nicknameMaxLength']);
    assert.equal(JSON.stringify(shown).includes('x-real-ip'), false);
    assert.equal('minReactionMs' in shown.match, false);
});
