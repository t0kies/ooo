import { line } from '../../../lib/dom.js';

// The home menu. Each row has a 2-cell gutter that shows ↲ on the row Enter
// would run; ↑ ↓ move between usable rows like Tab.
// enterTarget(focused) names the control whose row gets the ↲.
export function createMenu(card, enterTarget) {
    const menu = line('home-menu');
    const gutters = new Map(); // control → its row's gutter

    function markEnter() {
        for (const gutter of gutters.values()) gutter.textContent = '  ';
        const gutter = gutters.get(enterTarget(document.activeElement));
        if (gutter) gutter.textContent = '↲ ';
    }

    // Adds a row for `control`, holding `items`.
    function row(control, ...items) {
        const el = line('home-row');
        const enter = line('home-enter', '  ');
        enter.setAttribute('aria-hidden', 'true');
        el.append(enter, ...items);
        gutters.set(control, enter);
        control.addEventListener('focus', markEnter);
        menu.appendChild(el);
        return el;
    }

    // `control` shares the row (and gutter) of `owner`.
    function share(control, owner) {
        gutters.set(control, gutters.get(owner));
        control.addEventListener('focus', markEnter);
    }

    card.addEventListener('keydown', event => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const stops = [...gutters.keys()].filter(el => !el.disabled && !el.closest('[hidden]'));
        const next = stops[stops.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1)];
        if (!next) return;
        event.preventDefault();
        next.focus();
    });

    return { menu, row, share, markEnter, has: control => gutters.has(control) };
}
