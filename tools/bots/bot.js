const { io } = require('socket.io-client');
const { emit, pickFor, rand, sleep } = require('./helpers');

// One bot: joins quick match, readies only while a human is in the lobby,
// guesses with the given accuracy, and re-queues after each match.
// Returns a function that stops it.
function startBot(number, { url, accuracy, minDelay, maxDelay, rejoin, prefix }) {
    const name = `${prefix}${number}`;
    const log = (...args) => console.log(`[${name}]`, ...args);
    const socket = io(url, { transports: ['websocket'], reconnectionDelay: 1000 });
    let state = null;
    let scheduled = -1;
    let joining = false;
    let stopped = false;

    async function join() {
        if (joining || stopped || !socket.connected) return;
        joining = true;
        state = null;
        scheduled = -1;
        const response = await emit(socket, 'match:quick-join', { nickname: name });
        joining = false;
        if (response?.ok) return;
        log('join failed:', response?.error);
        await sleep(2000);
        join();
    }

    // after a match ends or is cancelled
    function ended(...message) {
        log(...message);
        state = null;
        if (rejoin && !stopped) setTimeout(join, 2000 + number * 400);
    }

    // a rejected ready is retried: the lobby only sends state on changes
    async function syncReady(match) {
        const human = match.players.some(player => !player.nickname.startsWith(prefix));
        if (human === match.me.ready || match.players.length < 2) return;
        const response = await emit(socket, 'match:ready', { ready: human });
        if (response?.ok) {
            if (human) log('ready');
        } else if (!stopped && state?.phase === 'lobby') {
            log('ready rejected:', response?.error);
            await sleep(1000);
            syncReady(state);
        }
    }

    async function play({ question, me }) {
        if (!question || me.status !== 'active' || scheduled === question.index) return;
        scheduled = question.index;
        await sleep(rand(minDelay, maxDelay));
        if (stopped || state?.phase !== 'active' || state.me.questionIndex !== question.index) return;
        const optionId = pickFor(question, accuracy);
        const response = await emit(socket, 'match:guess', { questionIndex: question.index, optionId });
        if (!response?.ok) log('guess rejected:', response?.error);
    }

    socket.on('connect', () => {
        log('connected');
        join();
    });
    socket.on('connect_error', err => log('connect error:', err.message));
    socket.on('disconnect', reason => log('disconnected:', reason));
    socket.on('match:queue', () => log('waiting for another player'));
    socket.on('match:state', match => {
        if (state?.phase !== match.phase) log(`${match.phase} · ${match.players.length} players`);
        state = match;
        if (match.phase === 'lobby') syncReady(match);
        else if (match.phase === 'active') play(match);
    });
    socket.on('match:finished', result => {
        const mine = result.results.find(player => player.nickname === name);
        ended(`finished: ${mine?.score ?? 0} correct, ${mine?.health ?? 0} hp`);
    });
    socket.on('match:cancelled', ({ reason }) => ended('match cancelled:', reason));

    return () => {
        stopped = true;
        socket.disconnect();
    };
}

module.exports = { startBot };
