// Colors go out as SVG 1.1 (#rrggbb plus a separate opacity): Inkscape and
// Figma can't read the color(srgb … / a) that color-mix() computes to.

export const COLOR = String.raw`(rgba?\([^)]*\)|color\([^)]*\)|#\w+)`;

export const round = n => Math.round(n * 100) / 100;

export const esc = s =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A computed CSS color as [r, g, b, a] with channels 0–255.
export function rgba(css) {
    const n = (css.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
    const scale = css.startsWith('color(') ? 255 : 1;
    return [n[0] * scale, n[1] * scale, n[2] * scale, n[3] ?? 1];
}

export const hex = c =>
    `#${c
        .slice(0, 3)
        .map(v =>
            Math.round(Math.max(0, Math.min(255, v)))
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;

// `fill="#…"` (or another attribute), with an opacity attribute if needed.
export function paint(css, attr = 'fill') {
    const c = rgba(css);
    const opacity = attr === 'stop-color' ? 'stop-opacity' : `${attr}-opacity`;
    return `${attr}="${hex(c)}"${c[3] < 1 ? ` ${opacity}="${round(c[3])}"` : ''}`;
}

// Resolves a CSS color expression (var(), color-mix()) to its computed rgb().
export function createResolver(body) {
    const probe = document.createElement('div');
    probe.style.display = 'none';
    body.appendChild(probe);
    const resolve = expr => {
        probe.style.color = '';
        probe.style.color = expr;
        return getComputedStyle(probe).color;
    };
    return { resolve, remove: () => probe.remove() };
}
