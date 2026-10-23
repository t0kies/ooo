const test = require('node:test');
const assert = require('node:assert/strict');
const { action, event, serve } = require('../helpers/socket');

test('Socket.IO clients can quick-match, ready, and progress independently', async t => {
    const { client } = await serve(t, { coordinatorOptions: { minReactionMs: 0 } });
    const first = client();
    const second = client();
    await Promise.all([event(first, 'connect'), event(second, 'connect')]);

    const queueNotice = event(first, 'match:queue');
    assert.equal((await action(first, 'match:quick-join', { nickname: 'Ada' })).queued, true);
    await queueNotice;

    const lobbies = [first, second].map(c => event(c, 'match:state', state => state.phase === 'lobby'));
    assert.equal((await action(second, 'match:quick-join', { nickname: 'Bob' })).phase, 'lobby');
    await Promise.all(lobbies);

    const active = [first, second].map(c => event(c, 'match:state', state => state.phase === 'active'));
    await action(first, 'match:ready', { ready: true });
    await action(second, 'match:ready', { ready: true });
    const [firstState, secondState] = await Promise.all(active);
    assert.deepEqual(firstState.question, secondState.question);

    const nextQuestion = event(first, 'match:state', state => state.me.questionIndex === 1);
    assert.equal((await action(first, 'match:guess', { questionIndex: 0, optionId: 0 })).ok, true);
    assert.equal((await nextQuestion).question.index, 1);
});

test('disabled modes answer feature_disabled', async t => {
    const { client } = await serve(t, { features: { invites: false } });
    const socket = client();
    await event(socket, 'connect');
    assert.equal((await action(socket, 'match:invite-create', { nickname: 'Ada' })).error, 'feature_disabled');
});

test('rejects Socket.IO handshakes with a foreign origin', async t => {
    const { client } = await serve(t);
    const socket = client({ transports: ['websocket'], extraHeaders: { Origin: 'http://evil.test' } });
    const error = await event(socket, 'connect_error');
    assert.match(error.message, /websocket error|xhr poll error|forbidden|websocket/i);
});

test('caps simultaneous connections per IP', async t => {
    const { client } = await serve(t, { limits: { maxConnectionsPerIp: 2 } });
    const clients = [1, 2, 3].map(() => client({ transports: ['websocket'] }));
    await Promise.all(clients.slice(0, 2).map(socket => event(socket, 'connect')));
    await event(clients[2], 'disconnect');
    assert.equal(clients[0].connected && clients[1].connected, true);
});
