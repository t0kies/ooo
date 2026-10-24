const net = require('node:net');
const { setTimeout: delay } = require('node:timers/promises');

function assertPortAvailable(port, host) {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once('error', err => {
            reject(err.code === 'EADDRINUSE' ? new Error(`Port ${port} on ${host} is already in use`) : err);
        });
        probe.listen(port, host, () => probe.close(resolve));
    });
}

// Polls `url` until it answers 2xx, for up to 20 s. stopped() aborts early.
async function waitForReady(url, label, stopped) {
    const deadline = Date.now() + 20_000;
    let lastError = 'no successful response';
    while (!stopped() && Date.now() < deadline) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(750) });
            if (response.ok) return;
            lastError = `HTTP ${response.status}`;
        } catch (err) {
            lastError = err.message;
        }
        await delay(250);
    }
    throw new Error(`${label} did not become ready (${lastError})`);
}

module.exports = { assertPortAvailable, waitForReady };
