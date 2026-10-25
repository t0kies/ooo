// The ways out (close buttons, the top-row exit) play back.
const BACK = '.game-close-btn, [data-focus="exit"]';

// Sounds for using controls. Every pressed button plays select or back, except
// swatches (a wrong pick already plays a hit). Runs after the button's own
// handler, so turning sound on is heard. Moving focus with ↑ ↓ or Tab plays
// navigate; focus moved by a re-render doesn't.
export function setupControlSounds(sound) {
    document.addEventListener('click', event => {
        const pressed = event.target.closest('button');
        if (!pressed || pressed.disabled || pressed.classList.contains('game-choice')) return;
        if (pressed.matches(BACK)) sound.back();
        else sound.select();
    });

    let stepping = false;
    const capture = { capture: true };
    document.addEventListener(
        'keydown',
        event => {
            stepping = ['ArrowUp', 'ArrowDown', 'Tab'].includes(event.key);
        },
        capture,
    );
    document.addEventListener(
        'keyup',
        () => {
            stepping = false;
        },
        capture,
    );
    document.addEventListener('focusin', event => {
        if (stepping && event.target.matches('button, input')) sound.navigate();
    });
}
