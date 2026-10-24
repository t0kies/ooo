// Reads --name value from the command line, else BOTS_NAME from the env.
function option(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    const value = index >= 0 ? process.argv[index + 1] : process.env[`BOTS_${name.toUpperCase().replace(/-/g, '_')}`];
    return value === undefined ? fallback : value;
}

const url = option('url', 'http://127.0.0.1:3000');
const minDelay = Math.max(500, Number(option('min-delay', 900)));

const options = {
    url,
    count: Math.max(1, Math.min(7, Number(option('count', 5)))),
    accuracy: Math.max(0, Math.min(1, Number(option('accuracy', 0.2)))),
    minDelay,
    maxDelay: Math.max(minDelay, Number(option('max-delay', 2200))),
    rejoin: option('rejoin', 'true') !== 'false',
    prefix: 'Bot ',
};

const usage = `Usage: pnpm dev:bots [--count 3] [--accuracy 0.7] [--min-delay 900] [--max-delay 2200] [--rejoin true] [--url ${url}]
Env equivalents: BOTS_COUNT, BOTS_ACCURACY, BOTS_MIN_DELAY, BOTS_MAX_DELAY, BOTS_REJOIN, BOTS_URL
Delays are in ms (minimum 500, to stay under the server's event limit).`;

module.exports = { options, usage };
