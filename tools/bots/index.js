// Fills a quick-match lobby with bots that wait for a human to ready up.
// Options and their defaults are in options.js (--help prints them).
const { startBot } = require('./bot');
const { options, usage } = require('./options');

if (process.argv.includes('--help')) {
    console.log(usage);
    process.exit(0);
}

const { url, count, accuracy, minDelay, maxDelay } = options;
console.log(`Starting ${count} bot(s) against ${url} (accuracy ${accuracy}, ${minDelay}-${maxDelay}ms per guess)`);
console.log('Open the game, enter a nickname, and press quick match; ready up to start.');

const stops = [];
for (let number = 1; number <= count; number++) {
    setTimeout(() => stops.push(startBot(number, options)), (number - 1) * 300);
}

function shutdown() {
    for (const stop of stops) stop();
    setTimeout(() => process.exit(0), 200);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
