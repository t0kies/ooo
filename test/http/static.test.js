const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStaticHandler } = require('../../backend/http/static');
const { originOf } = require('../../backend/http/site');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ooo-static-'));
fs.writeFileSync(path.join(root, 'index.html'), '<title>%SITE_NAME%</title><meta content="%ORIGIN%/x"> %OTHER%');
fs.writeFileSync(path.join(root, 'manifest.webmanifest'), '{"name": "%SITE_NAME%"}');
fs.writeFileSync(path.join(root, 'app.css'), 'body { content: "%SITE_NAME%"; }');

// Runs one request through the handler and returns { status, type, body }.
async function get(url, site = { name: 'A <"b">' }, headers = { host: 'game.test' }) {
    const res = { status: 0, headers: {}, body: '' };
    res.writeHead = (status, headers = {}) => Object.assign(res, { status, headers });
    res.end = body => {
        res.body = String(body ?? '');
    };
    await createStaticHandler(root, site)({ url, headers }, res);
    return { status: res.status, type: res.headers['Content-Type'], body: res.body };
}

test('fills placeholders in the page, escaped for HTML', async () => {
    const page = await get('/');
    assert.equal(page.type, 'text/html');
    assert.equal(page.body, '<title>A &#60;&#34;b&#34;&#62;</title><meta content="http://game.test/x"> %OTHER%');
});

test('fills the manifest as JSON and leaves other files alone', async () => {
    assert.equal((await get('/manifest.webmanifest')).body, '{"name": "A <\\"b\\">"}');
    assert.equal((await get('/app.css')).body, 'body { content: "%SITE_NAME%"; }');
});

test('PUBLIC_URL wins over the request host', async () => {
    const page = await get('/', { name: 'x', publicUrl: 'https://ooo.example' });
    assert.match(page.body, /content="https:\/\/ooo\.example\/x"/);
});

test('unknown paths fall back to the page; bad paths are refused', async () => {
    assert.equal((await get('/no/such/file')).type, 'text/html');
    assert.equal((await get('/%E0%A4%A')).status, 400);
});

test('derives the origin only from a plain host', () => {
    assert.equal(
        originOf({ headers: { host: 'a.test:3000', 'x-forwarded-proto': 'https, http' } }),
        'https://a.test:3000',
    );
    assert.equal(originOf({ headers: { host: 'evil.test/"><script>' } }), '');
});
