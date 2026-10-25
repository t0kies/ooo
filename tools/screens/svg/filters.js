import { COLOR, rgba, round } from './color.js';

// Text shadows become SVG filters, one per distinct CSS text-shadow.
export function createShadows() {
    const shadows = new Map(); // css text-shadow → filter id
    const idFor = ts => {
        if (!ts || ts === 'none') return null;
        if (!shadows.has(ts)) shadows.set(ts, `shadow-${shadows.size + 1}`);
        return shadows.get(ts);
    };
    return { idFor, defs: () => [...shadows].map(([ts, id]) => filter(ts, id)) };
}

// Spelled the way Figma exports a drop shadow, in SVG 1.1 primitives only:
// Inkscape drops anything filtered with feDropShadow, and Figma reads this
// pattern back as Drop shadow effects. Each shadow in the CSS list is one
// effect; the first in CSS paints on top.
function filter(ts, id) {
    const pattern = new RegExp(String.raw`${COLOR}\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+([\d.]+)px)?`);
    const list = ts
        .split(/,(?![^(]*\))/)
        .map(s => s.match(pattern))
        .filter(Boolean);
    if (!list.length) return '';
    const steps = ['<feFlood flood-opacity="0" result="BackgroundImageFix"/>'];
    let below = 'BackgroundImageFix';
    list.reverse().forEach(([, color, dx, dy, blur = 0], i) => {
        const [cr, cg, cb, ca] = rgba(color);
        const f = n => round(n / 255);
        steps.push(
            '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>',
            `<feOffset dx="${dx}" dy="${dy}"/>`,
            ...(Number(blur) ? [`<feGaussianBlur stdDeviation="${blur / 2}"/>`] : []),
            '<feComposite in2="hardAlpha" operator="out"/>',
            `<feColorMatrix type="matrix" values="0 0 0 0 ${f(cr)} 0 0 0 0 ${f(cg)} 0 0 0 0 ${f(cb)} 0 0 0 ${ca} 0"/>`,
            `<feBlend mode="normal" in2="${below}" result="effect${i + 1}_dropShadow"/>`,
        );
        below = `effect${i + 1}_dropShadow`;
    });
    steps.push(`<feBlend mode="normal" in="SourceGraphic" in2="${below}" result="shape"/>`);
    const box = 'x="-20%" y="-20%" width="140%" height="160%"';
    return `    <filter id="${id}" ${box} color-interpolation-filters="sRGB">${steps.join('')}</filter>`;
}
