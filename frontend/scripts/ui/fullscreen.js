// Phones go fullscreen on the first tap on a control (browsers require a
// gesture). After that only the bottom-row toggle switches it, so leaving
// sticks. iPhone Safari has no Fullscreen API: the toggle stays hidden and
// the home-screen app (manifest.webmanifest) is the way there.
export function setupFullscreen(toggle) {
    const root = document.documentElement;
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
    const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
    const phone = matchMedia('(pointer: coarse) and (hover: none)');
    toggle.hidden = true;
    if (!request || !exit) return;
    const active = () => !!(document.fullscreenElement ?? document.webkitFullscreenElement);
    const enter = () => Promise.resolve(request.call(root, { navigationUI: 'hide' })).catch(() => {});

    function sync() {
        const on = active();
        toggle.hidden = !phone.matches;
        toggle.querySelector('.symbol').textContent = on ? '↙' : '↗';
        toggle.querySelector('.setting-value').textContent = on ? 'on' : 'off';
        toggle.setAttribute('aria-pressed', String(on));
        toggle.setAttribute('aria-label', `Full screen ${on ? 'on' : 'off'}, toggle`);
    }

    let first = true;
    document.addEventListener(
        'pointerup',
        event => {
            if (!first || !phone.matches || event.pointerType !== 'touch') return;
            const control = event.target.closest('button, input');
            if (!control || control === toggle) return;
            first = false;
            if (!active()) enter();
        },
        { capture: true },
    );

    toggle.addEventListener('click', () => {
        first = false;
        if (active()) Promise.resolve(exit.call(document)).catch(() => {});
        else enter();
    });
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    phone.addEventListener('change', sync);
    sync();
}
