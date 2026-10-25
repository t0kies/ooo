import { esc, paint, round } from './color.js';
import { inputValue } from './text.js';
import { textNode } from './text-runs.js';

export const visible = el => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[hidden]');
};

// Layer names follow the DOM: #id, else the classes, else the tag.
function layerName(el) {
    if (el.dataset?.svgPseudo) {
        const parent = el.parentElement;
        return `${parent.className || parent.tagName.toLowerCase()}::${el.dataset.svgPseudo}`;
    }
    if (el.id) return `#${el.id}`;
    const classes = typeof el.className === 'string' ? el.className.trim() : '';
    return classes ? classes.split(/\s+/).join('.') : el.tagName.toLowerCase();
}

const rect = (b, attrs) =>
    `<rect ${attrs} x="${round(b.left)}" y="${round(b.top)}" width="${round(b.width)}" height="${round(b.height)}"`;

// The element and its children as nested <g> layers. A swatch (a block of █)
// becomes one rect, which is what you'd resize in Figma; a background color
// becomes a "fill" rect behind the text.
export function walk(cx, el, out, depth) {
    if (!visible(el)) return;
    const indent = '  '.repeat(depth);
    const cs = getComputedStyle(el);
    if (el.classList.contains('blocks')) {
        const rows = el.textContent.split('\n');
        const label = `swatch ${rows[0].length}×${rows.length} cells`;
        out.push(`${indent}${rect(el.getBoundingClientRect(), `id="${label}"`)} ${paint(cs.color)}/>`);
        return;
    }
    const inner = [];
    const bg = cs.backgroundColor;
    const box = el.getBoundingClientRect();
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && box.width && box.height) {
        inner.push(`${indent}  ${rect(box, 'data-name="fill"')} ${paint(bg)}/>`);
    }
    if (el.tagName === 'INPUT') {
        const text = inputValue(cx, el);
        if (text) inner.push(`${indent}  ${text}`);
    }
    for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.data.trim()) {
            inner.push(...textNode(cx, child).map(t => `${indent}  ${t}`));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(cx, child, inner, depth + 1);
        }
    }
    if (inner.length) out.push(`${indent}<g id="${esc(layerName(el))}">`, ...inner, `${indent}</g>`);
}
