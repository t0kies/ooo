import { $ } from '../lib/dom.js';

const KEY = 'pickles.theme';
const link = () => $('theme');
const themes = () => link().dataset.themes.split(' ');
const current = () => document.documentElement.dataset.theme;

function show(name) {
    link().href = `./styles/themes/${name}.css`;
    document.documentElement.dataset.theme = name;
    const btn = $('theme-toggle');
    btn.querySelector('.setting-value').textContent = name;
    btn.setAttribute('aria-label', `Theme ${name}, change`);
}

export function nextTheme() {
    const list = themes();
    const name = list[(list.indexOf(current()) + 1) % list.length];
    show(name);
    try {
        localStorage.setItem(KEY, name);
    } catch {}
    const url = new URL(location.href);
    if (url.searchParams.has('theme')) {
        url.searchParams.set('theme', name);
        history.replaceState(null, '', url);
    }
}

export function setupTheme() {
    show(current());
    $('theme-toggle').addEventListener('click', nextTheme);
}
