// Runs in the page (served by ../capture.mjs). Turns the rendered DOM into an
// editable SVG: each run of text a <text> layer in Departure Mono, each filled
// cell a <rect>, groups named after the DOM's classes, and a "guides" group
// with the cell grid, the frame rows and the centred content column.
import { createResolver, esc, paint, round } from './color.js';
import { createShadows } from './filters.js';
import { guides } from './guides.js';
import { materialisePseudo } from './pseudo.js';
import { createAscent } from './text.js';
import { walk } from './walk.js';

export function toSVG({ name = 'screen' } = {}) {
    const W = innerWidth;
    const H = innerHeight;
    const body = document.body;
    const fs = parseFloat(getComputedStyle(body).fontSize);
    const size = { cw: (fs * 7) / 11, lh: (fs * 14) / 11 };
    const px = fs / 11;
    const { resolve, remove } = createResolver(body);
    const restore = materialisePseudo(body);
    const cx = { body, shadows: createShadows(), ascent: createAscent() };

    const [bgHi, bg, bgLo, dot] = ['--bg-hi', '--bg', '--bg-lo', '--bg-dot'].map(v => resolve(`var(${v})`));
    const content = [];
    walk(cx, body, content, 1);
    const guideLines = guides(body, size);
    restore();
    remove();

    const stop = (offset, color) => `<stop offset="${offset}" ${paint(color, 'stop-color')}/>`;
    const pattern = `width="${round(px * 2)}" height="${round(px * 2)}" patternUnits="userSpaceOnUse"`;
    const circle = `<circle cx="${round(px)}" cy="${round(px)}" r="${round(px * 2 * 0.34)}" ${paint(dot)}/>`;
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
        `  <title>${esc(name)}</title>`,
        '  <defs>',
        `    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">${stop(0, bgHi)}${stop(0.45, bg)}${stop(1, bgLo)}</linearGradient>`,
        `    <pattern id="dots" ${pattern}>${circle}</pattern>`,
        ...cx.shadows.defs(),
        '  </defs>',
        '  <g id="background">',
        `    <rect data-name="glass" width="${W}" height="${H}" fill="url(#glass)"/>`,
        `    <rect data-name="dots" width="${W}" height="${H}" fill="url(#dots)"/>`,
        '  </g>',
        '  <g id="ui">',
        ...content,
        '  </g>',
        '  <g id="guides">',
        ...guideLines,
        '  </g>',
        '</svg>',
    ].join('\n');
}
