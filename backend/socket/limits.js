const freshWindow = now => ({ startedAt: now, count: 0 });

// Per-IP connection and event limits. Counters outlive sockets, so
// reconnecting doesn't reset them; idle entries are swept every window.
// The event budget is eventsPerWindow per open connection on the IP, so
// players behind one NAT don't share a single budget.
function createLimits({
    maxConnections = 500,
    maxConnectionsPerIp = 20,
    eventsPerWindow = 30,
    connectsPerWindow = 30,
    windowSeconds = 10,
} = {}) {
    const windowMs = windowSeconds * 1000;
    const byIp = new Map();
    let total = 0;

    const sweep = setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of byIp) {
            const idle = [entry.events, entry.connects].every(w => now - w.startedAt >= windowMs);
            if (entry.connections === 0 && idle) byIp.delete(ip);
        }
    }, windowMs);
    sweep.unref();

    function entryFor(ip) {
        let entry = byIp.get(ip);
        if (!entry) {
            const now = Date.now();
            entry = { connections: 0, events: freshWindow(now), connects: freshWindow(now) };
            byIp.set(ip, entry);
        }
        return entry;
    }

    function tick(window) {
        const now = Date.now();
        if (now - window.startedAt >= windowMs) Object.assign(window, freshWindow(now));
        return ++window.count;
    }

    return {
        // A handle for the new connection, or null to refuse it.
        admit(ip) {
            const entry = entryFor(ip);
            const attempts = tick(entry.connects);
            if (total >= maxConnections || entry.connections >= maxConnectionsPerIp || attempts > connectsPerWindow) {
                return null;
            }
            total++;
            entry.connections++;
            return {
                allowEvent: () => tick(entry.events) <= eventsPerWindow * Math.max(1, entry.connections),
                release() {
                    total--;
                    entry.connections--;
                },
            };
        },
        close: () => clearInterval(sweep),
    };
}

module.exports = { createLimits };
