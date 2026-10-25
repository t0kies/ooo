// Turns ::before / ::after content into real spans so they can be measured
// and exported. Returns a function that puts the page back.
export function materialisePseudo(body) {
    const style = document.createElement('style');
    style.textContent = '[data-svg-mat]::before,[data-svg-mat]::after{content:none!important}';
    const done = [];
    for (const el of body.querySelectorAll('*')) {
        const parts = [];
        for (const which of ['::before', '::after']) {
            const cs = getComputedStyle(el, which);
            const m = cs.content.match(/^"((?:[^"\\]|\\.)*)"/);
            if (!m || cs.display === 'none') continue;
            const span = document.createElement('span');
            for (const prop of cs) span.style.setProperty(prop, cs.getPropertyValue(prop));
            span.style.removeProperty('content');
            span.textContent = m[1].replace(/\\(.)/g, '$1');
            span.dataset.svgPseudo = which.slice(2);
            parts.push([which, span]);
        }
        if (parts.length) done.push([el, parts]);
    }
    document.head.appendChild(style);
    for (const [el, parts] of done) {
        el.dataset.svgMat = '';
        for (const [which, span] of parts) {
            if (which === '::before') el.prepend(span);
            else el.append(span);
        }
    }
    return () => {
        for (const [el, parts] of done) {
            delete el.dataset.svgMat;
            for (const [, span] of parts) span.remove();
        }
        style.remove();
    };
}
