// Placeholder match data the screens are drawn from. Health goes up to 10,
// the most hearts the layout has to fit (capture.mjs sets STARTING_HEALTH 10).

const COLORS = ['#7a5c8f', '#6b4f80', '#7a5c8f'];
const options = COLORS.map((hex_code, id) => ({ id, hex_code }));

export const players = [
    { id: 'me', nickname: 'mob', health: 7, score: 12, status: 'active', connected: true, ready: true },
    { id: 'p2', nickname: 'saltywalrus', health: 10, score: 14, status: 'active', connected: true, ready: true },
    { id: 'p3', nickname: 'dill', health: 3, score: 6, status: 'active', connected: false, ready: false },
    {
        id: 'p4',
        nickname: 'brine_queen_9000',
        health: 0,
        score: 4,
        status: 'eliminated',
        connected: true,
        ready: false,
    },
];

export const lobbyPlayers = players.map(p => ({ ...p, health: 10, score: 0, status: 'active', connected: true }));

export const matchState = (over = {}) => ({
    id: 'm1',
    phase: 'active',
    type: 'quick',
    code: null,
    hostId: 'p2',
    maxPlayers: 8,
    durationMs: 15000,
    remainingMs: 9000,
    me: { id: 'me', health: 7, score: 12, questionIndex: 15, status: 'active' },
    players,
    question: { index: 15, options },
    ...over,
});

const results = [
    { id: 'p2', nickname: 'saltywalrus', score: 14, health: 10, status: 'active', questionIndex: 16 },
    { id: 'me', nickname: 'mob', score: 12, health: 7, status: 'active', questionIndex: 15 },
    { id: 'p3', nickname: 'dill', score: 6, health: 3, status: 'active', questionIndex: 11 },
    { id: 'p4', nickname: 'brine_queen_9000', score: 4, health: 0, status: 'eliminated', questionIndex: 14 },
];

export const resultData = (over = {}) => ({ reason: 'time', code: null, winnerId: 'p2', results, ...over });

// me first, as the winner
const wonResults = [results[1], results[0], ...results.slice(2)];

const WRONG = [4, 9, 11, 13, 16, 18, 19, 20, 21, 22];
const STRIP = ['#b04a3c', '#3c7ab0', '#6aa84f', '#c79a2e', '#8e5bb5', '#2fa39a'];
export const soloHistory = Array.from({ length: 23 }, (_, i) => ({ hex: STRIP[i % 6], ok: !WRONG.includes(i) }));

// states the scenes draw
export const named = { 'pickles.guestNickname': 'mob', 'pickles.best': '17' };
export const lobby = {
    ...matchState(),
    phase: 'lobby',
    players: lobbyPlayers,
    hostId: 'p2',
    me: { id: 'me', ready: true },
};
export const room = {
    ...matchState(),
    phase: 'lobby',
    type: 'invite',
    code: '3FA0C9E1',
    players: lobbyPlayers.map(p => (p.id === 'me' ? { ...p, ready: false } : p)),
    hostId: 'me',
    me: { id: 'me', ready: false },
};
const withMe = me =>
    matchState({
        me: { id: 'me', score: 12, ...me },
        players: players.map(p => (p.id === 'me' ? { ...p, ...me } : p)),
    });
export const urgent = withMe({ health: 2, questionIndex: 15, status: 'active' });
export const out = withMe({ health: 0, questionIndex: 19, status: 'eliminated' });
export const failed = { feedback: 'no answer yet · check your connection', leaveArmed: true, damaging: true };
export const won = resultData({ winnerId: 'me', code: '3FA0C9E1', reason: 'no_active_players', results: wonResults });
