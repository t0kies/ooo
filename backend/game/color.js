// Hue (0–360), saturation and brightness (0–100) to an uppercase #RRGGBB.
function hsbToHex(hue, saturation, brightness) {
    const h = ((hue % 360) + 360) % 360;
    const v = brightness / 100;
    const chroma = v * (saturation / 100);
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - chroma;
    const sectors = [
        [chroma, x, 0],
        [x, chroma, 0],
        [0, chroma, x],
        [0, x, chroma],
        [x, 0, chroma],
        [chroma, 0, x],
    ];
    const rgb = sectors[Math.min(5, Math.floor(h / 60))];
    const hex = rgb.map(channel =>
        Math.round((channel + m) * 255)
            .toString(16)
            .padStart(2, '0'),
    );
    return `#${hex.join('').toUpperCase()}`;
}

module.exports = { hsbToHex };
