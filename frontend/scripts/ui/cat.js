import { cellSize, onRefit, space } from '../lib/grid.js';

// A cat face on a random empty row (above or below the screen's content,
// never between its lines). A new `key` (screen, round, level) picks a new
// face and spot; the same key keeps them across redraws. Faces use only
// glyphs Departure Mono has. No empty row, no cat.
const CATS = ['(= ФωФ =)', '~(=^·.·^)', '=^• ω •^=', '/^·x·^\\', '°Λ°', '^._.^', '^ØωØ^', '\\(=^·ω·^=)/'];

const pick = items => items[Math.floor(Math.random() * items.length)];
let last = { key: null, face: '', row: -1, col: -1 };

// Rows of the card that no content overlaps.
function emptyRows(card, lh) {
    const rows = [...Array(Math.floor(card.clientHeight / lh)).keys()];
    const block = card.querySelector('.round-column, .home');
    const boxes = [...(block?.children ?? [])].map(el => el.getBoundingClientRect()).filter(box => box.height > 0);
    if (!boxes.length) return rows;
    const origin = card.getBoundingClientRect().top;
    const top = Math.min(...boxes.map(box => box.top)) - origin;
    const bottom = Math.max(...boxes.map(box => box.bottom)) - origin;
    return rows.filter(row => (row + 1) * lh <= top + 0.5 || row * lh >= bottom - 0.5);
}

function sit(card, keep) {
    for (const el of document.querySelectorAll('.cat')) el.remove();
    const { cw, lh } = cellSize();
    const { cols } = space(card);
    const rows = emptyRows(card, lh);
    const room = cols - last.face.length;
    if (!rows.length || room < 0) return;
    const row = keep && rows.includes(last.row) ? last.row : pick(rows);
    const col = keep && last.col >= 0 && last.col <= room ? last.col : Math.floor(Math.random() * (room + 1));
    Object.assign(last, { row, col });

    const el = document.createElement('div');
    el.className = 'cat';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = last.face;
    el.style.top = `${row * lh}px`;
    el.style.left = `${col * cw}px`;
    card.appendChild(el);
    // next frame, after the screen has refitted, so rows measure right
    onRefit(card, el, () => requestAnimationFrame(() => sit(card, true)));
}

// Places this screen's cat, once the card's content is in.
export function cat(card, key) {
    const keep = key === last.key;
    if (!keep) last = { key, face: pick(CATS.filter(face => face !== last.face)), row: -1, col: -1 };
    sit(card, keep);
}
