const WARN_SECONDS = 15;
const DANGER_SECONDS = 5;
const REPAINT_MS = 50;

// The HUD clock: a bar and the seconds, updated together once a second
// (color, blink, and a tick in the last 5 s). The HUD is rebuilt on every
// state update, so each repaint looks the clock up again; a rebuild
// mid-second doesn't blink twice.
export function createClock(sound) {
    let interval = null;
    let deadline = null;
    let totalMs = 0;
    let lastSecond = null;

    function paint() {
        const clock = document.querySelector('.game-clock');
        if (!clock || deadline == null) return;

        const seconds = Math.ceil(Math.max(0, deadline - performance.now()) / 1000);
        const totalSeconds = Math.max(1, Math.ceil(totalMs / 1000));
        const urgency = seconds <= DANGER_SECONDS ? 'danger' : seconds <= WARN_SECONDS ? 'warn' : 'calm';
        // the bar's length is the stylesheet's (--clock-cells, shorter on a phone)
        const cells = parseInt(getComputedStyle(clock).getPropertyValue('--clock-cells'), 10) || 24;
        const left = Math.min(cells, Math.ceil((cells * seconds) / totalSeconds));
        clock.dataset.urgency = urgency;
        clock.querySelector('.game-hud-timer').textContent = `${seconds}s`;
        clock.querySelector('.game-clock-bar').textContent = '▆'.repeat(left) + '▁'.repeat(cells - left);

        if (seconds === lastSecond) return;
        lastSecond = seconds;
        clock.classList.remove('is-beat');
        void clock.offsetWidth; // restart the CSS animation
        clock.classList.add('is-beat');
        if (seconds > 0 && urgency === 'danger') sound.tick();
    }

    return {
        // How long is left now, or null when no match is running.
        setRemaining(ms) {
            deadline = ms == null ? null : performance.now() + ms;
        },
        // Repaints after each render of the match screen.
        sync(durationMs) {
            totalMs = durationMs;
            paint();
            interval ||= setInterval(paint, REPAINT_MS);
        },
        stop() {
            clearInterval(interval);
            interval = null;
            lastSecond = null;
        },
    };
}
