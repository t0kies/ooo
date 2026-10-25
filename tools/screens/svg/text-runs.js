import { textAt } from './text.js';

const transform = (data, cs) =>
    cs.textTransform === 'uppercase'
        ? data.toUpperCase()
        : cs.textTransform === 'lowercase'
          ? data.toLowerCase()
          : data;

// Splits a text node into its visual lines: [{ top, height, chars: [{ ch, left, right }] }].
function runsOf(node, data) {
    const range = document.createRange();
    const runs = [];
    let run = null;
    for (let i = 0; i < node.data.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = [...range.getClientRects()].find(q => q.width > 0);
        if (!rect) {
            run = null;
            continue;
        }
        if (!run || Math.abs(rect.top - run.top) > 1) {
            run = { top: rect.top, height: rect.height, chars: [] };
            runs.push(run);
        }
        run.chars.push({ ch: data[i], left: rect.left, right: rect.right });
    }
    return runs;
}

// Drops characters cut off by the nearest overflow box, with … if it asks.
function clip(el, runs, body) {
    let clipper = el;
    while (clipper && clipper !== body && getComputedStyle(clipper).overflowX === 'visible')
        clipper = clipper.parentElement;
    if (!clipper || clipper === body) return;
    const box = clipper.getBoundingClientRect();
    const ellipsis = getComputedStyle(clipper).textOverflow === 'ellipsis';
    for (const run of runs) {
        const kept = run.chars.filter(c => c.right <= box.right + 0.5 && c.left >= box.left - 0.5);
        if (kept.length < run.chars.length && ellipsis && kept.length)
            kept[kept.length - 1] = { ...kept.at(-1), ch: '…' };
        run.chars = kept;
    }
}

// One <text> per visual line of a text node, trimmed of edge spaces.
export function textNode(cx, node) {
    const el = node.parentElement;
    const runs = runsOf(node, transform(node.data, getComputedStyle(el)));
    clip(el, runs, cx.body);
    const out = [];
    for (const { top, height, chars } of runs) {
        while (chars.length && chars[0].ch === ' ') chars.shift();
        while (chars.length && chars.at(-1).ch === ' ') chars.pop();
        if (chars.length) out.push(textAt(cx, el, chars.map(c => c.ch).join(''), chars[0].left, top, height));
    }
    return out;
}
