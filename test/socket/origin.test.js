const test = require('node:test');
const assert = require('node:assert/strict');
const { clientIp, sameOrigin } = require('../../backend/socket/origin');

test('allows same-origin requests and rejects a foreign origin', () => {
    assert.equal(sameOrigin({ headers: { origin: 'http://example.test', host: 'example.test' } }), true);
    assert.equal(sameOrigin({ headers: { origin: 'http://evil.test', host: 'example.test' } }), false);
    assert.equal(sameOrigin({ headers: { origin: 'not a url', host: 'example.test' } }), false);
});

test('a missing origin is refused only on WebSocket upgrades when required', () => {
    assert.equal(sameOrigin({ headers: { host: 'example.test' } }), true);
    assert.equal(sameOrigin({ headers: { host: 'example.test' } }, { requireOrigin: true }), true);
    const upgrade = { headers: { host: 'example.test', upgrade: 'websocket' } };
    assert.equal(sameOrigin(upgrade, { requireOrigin: true }), false);
});

test('reads the client IP from the proxy header when configured', () => {
    const socket = { handshake: { address: '10.0.0.1', headers: { 'x-real-ip': '1.1.1.1, 2.2.2.2' } } };
    assert.equal(clientIp(socket, null), '10.0.0.1');
    assert.equal(clientIp(socket, 'x-real-ip'), '2.2.2.2');
    assert.equal(clientIp(socket, 'x-other'), '10.0.0.1');
});
