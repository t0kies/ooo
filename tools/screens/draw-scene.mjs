// Runs in the page (passed to page.evaluate, so it must be self-contained):
// draws one scene with the app's own view modules and the fixture data.
export async function drawScene({ run, args = {}, focus }) {
    const game = document.getElementById('game');
    const noop = () => {};
    const view = path => import(`/scripts/${path}`);
    const sound = { damage: noop, tick: noop, right: noop, back: noop, select: noop, navigate: noop };

    // paints the clock as it would look `seconds` from the end
    const paintClock = ({ seconds }) => {
        const clock = document.querySelector('.game-clock');
        if (!clock) return;
        const cells = parseInt(getComputedStyle(clock).getPropertyValue('--clock-cells'), 10) || 24;
        const left = Math.min(cells, Math.ceil((cells * seconds) / Math.ceil(args.state.durationMs / 1000)));
        clock.dataset.urgency = seconds <= 5 ? 'danger' : seconds <= 15 ? 'warn' : 'calm';
        clock.querySelector('.game-hud-timer').textContent = `${seconds}s`;
        clock.querySelector('.game-clock-bar').textContent = '▆'.repeat(left) + '▁'.repeat(cells - left);
    };
    const home = async () => {
        const { showHome } = await view('match/views/home/index.js');
        const start = { quickMatch: noop, createInvite: noop, joinInvite: noop, solo: noop };
        showHome(game, { notice: args.notice || '', transportMissing: !!args.transportMissing }, start);
    };

    const scenes = {
        home,
        async homeJoin() {
            await home();
            [...document.querySelectorAll('.home-menu-btn')].find(b => /join/i.test(b.textContent)).click();
            const input = document.querySelector('input[name="invite-code"]');
            input.value = args.code;
            input.dispatchEvent(new Event('input'));
        },
        async queue() {
            (await view('match/views/queue.js')).showQueue(game, { onPractice: noop, onCancel: noop });
        },
        async waiting() {
            const actions = { setReady: noop, kick: noop, leave: noop };
            (await view('match/views/waiting.js')).showWaiting(game, args.state, actions);
        },
        async play() {
            const ui = {
                feedback: '',
                pending: false,
                picked: -1,
                question: null,
                answer: -1,
                damaging: false,
                ...args.ui,
            };
            const actions = { guess: noop, leave: noop, findAnother: noop, redraw: noop };
            (await view('match/views/play.js')).showPlay(game, args.state, ui, actions);
            paintClock(args.clock);
        },
        async results() {
            const actions = { playAgain: noop, back: noop };
            (await view('match/views/results.js')).showResults(game, args.result, 'me', actions);
        },
        async solo() {
            window.__stopSolo = (await view('solo/solo.js')).startSolo(game, sound, noop);
        },
        async soloResult() {
            (await view('solo/result.js')).showResult(game, args, { onReplay: noop, onExit: noop });
        },
    };
    await scenes[run]();
    if (focus) document.querySelector(focus)?.focus();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
