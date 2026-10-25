import { $ } from './dom.js';

// On a phone the way out moves to the start of the bottom row, leaving the
// top row to the HUD.
const phone = matchMedia('(pointer: coarse) and (hover: none)');
function placeExit() {
    const end = $('screen-end');
    if (phone.matches) document.querySelector('.bottombar').prepend(end);
    else document.querySelector('.topbar').append(end);
}
phone.addEventListener('change', placeExit);
placeExit();

function exitButton({ label, run, key = 'esc', armed = false }) {
    const out = document.createElement('button');
    out.type = 'button';
    out.dataset.focus = 'exit';
    if (armed) out.classList.add('is-armed');
    if (key === false) {
        out.textContent = label;
    } else {
        const hint = document.createElement('span');
        hint.className = 'key';
        hint.setAttribute('aria-hidden', 'true');
        hint.textContent = key;
        out.append(hint, ` ${label}`);
        out.setAttribute('aria-keyshortcuts', 'Escape');
    }
    out.addEventListener('click', run);
    return out;
}

// Sets up the frame around a screen. In a game the top row shows the HUD (or
// `title` without one) and the way out. Home has only the bottom row.
// exit: { label, run, key ('esc' by default, false for none), armed (the
// first of two presses was made) }. keys: the hint line, kept hidden for now.
export function setScreen(title, { exit = null, keys = '', hud = null, home = false } = {}) {
    document.body.dataset.frame = home ? 'home' : 'game';
    $('screen-title').textContent = hud ? '' : title;
    $('screen-hud').replaceChildren(...(hud ? [hud] : []));
    $('screen-end').replaceChildren(...(exit ? [exitButton(exit)] : []));
    $('screen-keys').textContent = keys;
}
