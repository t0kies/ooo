import { esc, paint, round } from './color.js';

// Font ascent and descent per size, measured once.
export function createAscent() {
    const ctx = document.createElement('canvas').getContext('2d');
    const cache = new Map();
    return size => {
        if (!cache.has(size)) {
            ctx.font = `${size}px "Departure Mono"`;
            const m = ctx.measureText('Hg');
            cache.set(size, { a: m.fontBoundingBoxAscent, d: m.fontBoundingBoxDescent });
        }
        return cache.get(size);
    };
}

// The element's opacity times all its ancestors'.
function opacityOf(el) {
    let o = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement)
        o *= parseFloat(getComputedStyle(e).opacity);
    return o;
}

function textAttrs(cx, cs, opacity) {
    const attrs = ['font-family="Departure Mono"', `font-size="${round(parseFloat(cs.fontSize))}"`, paint(cs.color)];
    const filter = cx.shadows.idFor(cs.textShadow);
    if (filter) attrs.push(`filter="url(#${filter})"`);
    if (opacity < 1) attrs.push(`opacity="${round(opacity)}"`);
    return attrs.join(' ');
}

// One <text> at (x, top of a line box `height` tall).
export function textAt(cx, el, text, x, top, height) {
    const cs = getComputedStyle(el);
    const { a, d } = cx.ascent(parseFloat(cs.fontSize));
    const baseline = top + (height - (a + d)) / 2 + a;
    const attrs = textAttrs(cx, cs, opacityOf(el));
    return `<text x="${round(x)}" y="${round(baseline)}" xml:space="preserve" ${attrs}>${esc(text)}</text>`;
}

export function inputValue(cx, el) {
    const text = el.value || el.placeholder;
    if (!text) return null;
    const rect = el.getBoundingClientRect();
    return textAt(cx, el, text, rect.left + parseFloat(getComputedStyle(el).paddingLeft), rect.top, rect.height);
}
