// The sound setting in the bottom row. Returns the toggle function (bound to m).
export function setupSoundToggle(sound, toggle) {
    function sync() {
        toggle.querySelector('.setting-value').textContent = sound.enabled ? 'on' : 'off';
        toggle.setAttribute('aria-pressed', String(sound.enabled));
        toggle.setAttribute('aria-label', `Sound ${sound.enabled ? 'on' : 'off'}, toggle`);
    }
    const flip = () => {
        sound.toggle();
        sync();
    };
    toggle.addEventListener('click', flip);
    sync();
    return flip;
}
