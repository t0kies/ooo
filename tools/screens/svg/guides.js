import { round } from './color.js';
import { visible } from './walk.js';

const line = (x1, y1, x2, y2, extra = '') =>
    `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}"${extra}/>`;
const box = (rc, label, extra = '') =>
    `<rect data-name="${label}" x="${round(rc.left)}" y="${round(rc.top)}" width="${round(rc.width)}" height="${round(rc.height)}"${extra}/>`;
const group = (name, attrs, items) => [`  <g id="${name}" ${attrs}>`, ...items.map(s => `    ${s}`), '  </g>'];

// The cell grid; every 10th column and 5th row stronger.
function cellGrid(b, { cw, lh }) {
    const cols = Math.round(b.width / cw);
    const rows = Math.round(b.height / lh);
    const strong = ' stroke-opacity="0.5"';
    const lines = [];
    for (let c = 0; c <= cols; c++)
        lines.push(line(b.left + c * cw, b.top, b.left + c * cw, b.bottom, c % 10 ? '' : strong));
    for (let r = 0; r <= rows; r++)
        lines.push(line(b.left, b.top + r * lh, b.right, b.top + r * lh, r % 5 ? '' : strong));
    const name = `guide: cell grid ${cols}×${rows} (cell ${round(cw)}×${round(lh)})`;
    return group(name, 'stroke="#ff00ff" stroke-width="0.5" stroke-opacity="0.18" fill="none"', lines);
}

// The scene box, its padding rows, main, the bars and #game.
function frame(b, { lh }) {
    const boxes = [
        box(b, `scene box ${round(b.width)}×${round(b.height)}`),
        box({ left: b.left, top: b.top, width: b.width, height: lh }, 'padding row top'),
        box({ left: b.left, top: b.bottom - lh, width: b.width, height: lh }, 'padding row bottom'),
        box(document.querySelector('main').getBoundingClientRect(), 'main (2-cell side gutters)'),
    ];
    for (const sel of ['.topbar', '.bottombar', '#game']) {
        const el = document.querySelector(sel);
        if (el && visible(el)) boxes.push(box(el.getBoundingClientRect(), sel));
    }
    return group('guide: frame', 'stroke="#00b7ff" stroke-width="1" fill="none" stroke-dasharray="4 3"', boxes);
}

// The visible card with its centre lines, the column with its --w and
// --top, and home's fixed blocks in cells from the card's corner.
function content({ cw, lh }) {
    const items = [];
    const card = [...document.querySelectorAll('.game-card')].find(visible);
    if (card) {
        const c = card.getBoundingClientRect();
        items.push(box(c, '.game-card'));
        items.push(line(c.left + c.width / 2, c.top, c.left + c.width / 2, c.bottom, ' data-name="card centre x"'));
        items.push(line(c.left, c.top + c.height / 2, c.right, c.top + c.height / 2, ' data-name="card centre y"'));
        const orange = ' stroke="#ff8a00"';
        const column = card.querySelector('.round-column');
        if (column) {
            const w = column.style.getPropertyValue('--w');
            const top = column.style.getPropertyValue('--top');
            items.push(
                box(column.getBoundingClientRect(), `.round-column (--w ${w} cells, --top ${top} rows)`, orange),
            );
        }
        const cells = q =>
            `${Math.round((q.left - c.left) / cw)},${Math.round((q.top - c.top) / lh)} ${Math.round(q.width / cw)}×${Math.round(q.height / lh)}`;
        for (const sel of ['.home', '.home-menu', '.home-notices']) {
            const el = card.querySelector(sel);
            if (!el || !visible(el)) continue;
            const q = el.getBoundingClientRect();
            items.push(box(q, `${sel} (cell ${cells(q)})`, orange));
        }
    }
    return group('guide: content', 'stroke="#00d26a" stroke-width="1" fill="none"', items);
}

export function guides(body, size) {
    const b = body.getBoundingClientRect();
    return [...cellGrid(b, size), ...frame(b, size), ...content(size)];
}
