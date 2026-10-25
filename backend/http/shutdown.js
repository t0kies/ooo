// On SIGTERM/SIGINT: stop taking players, let running matches finish (up to
// drainSeconds), then exit. A second signal exits immediately.
function handleShutdown({ label, server, realtime, drainSeconds }) {
    let stopping = false;
    const exit = () => (realtime ?? server).close(() => process.exit(0));
    const shutdown = () => {
        if (stopping || !realtime) return exit();
        stopping = true;
        console.log(`${label} draining (up to ${drainSeconds}s)`);
        setTimeout(exit, drainSeconds * 1000).unref();
        realtime.drain(exit);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

module.exports = { handleShutdown };
