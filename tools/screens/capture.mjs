// Draws every screen from fixture data against the running dev server and
// saves each as an editable SVG (text layers and guides) and a 2× PNG, in
// output/screens/<viewport>-<theme>/ (ignored by git).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChromium } from '../lib/chromium.mjs';
import { drawScene } from './draw-scene.mjs';
import { SCENES } from './scenes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(here, '../../output/screens');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const VIEWPORTS = {
    desktop: { width: 1440, height: 960 },
    mobile: { width: 390, height: 844 },
    'mobile-landscape': { width: 844, height: 390 },
};
const THEMES = ['noctua', 'silver'];
// the page's settings: the defaults, with the most hearts the layout must fit
const CONFIG = {
    features: { solo: true, quickMatch: true, invites: true },
    match: { seconds: 35, startingHealth: 10, minPlayers: 2, maxPlayers: 8 },
    difficulty: { startStep: 16, minStep: 3, rampRounds: 10 },
    nicknameMaxLength: 20,
};
// RUNS=desktop,mobile captures only those viewports; --svg-only (or SVG_ONLY=1) skips PNGs
const only = process.env.RUNS?.split(',');
const svgOnly = process.argv.includes('--svg-only') || process.env.SVG_ONLY === '1';
const runs = Object.keys(VIEWPORTS)
    .filter(vp => !only || only.includes(vp))
    .flatMap(vp => THEMES.map(theme => [vp, theme]));

async function capture(browser, vp, theme, scene, dir) {
    const context = await browser.newContext({
        viewport: VIEWPORTS[vp],
        deviceScaleFactor: 2,
        reducedMotion: 'reduce',
        hasTouch: vp.startsWith('mobile'),
    });
    try {
        // no live socket: the views run on the fixtures alone
        await context.route('**/socket.io/**', route => route.abort());
        await context.route('**/config.json', route => route.fulfill({ json: CONFIG }));
        // the SVG converter's modules, served from tools/screens/svg/
        await context.route('**/__svg/**', async route => {
            const file = path.join(here, 'svg', path.basename(new URL(route.request().url()).pathname));
            await route.fulfill({ body: await readFile(file), contentType: 'application/javascript' });
        });
        await context.addInitScript(
            ({ storage, theme }) => {
                localStorage.clear();
                localStorage.setItem('pickles.theme', theme);
                for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
            },
            { storage: scene.storage || {}, theme },
        );
        const page = await context.newPage();
        await page.goto(`${BASE}/?theme=${theme}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForSelector('#game .game-card');
        await page.evaluate(drawScene, scene);
        // hold the blinking cursor and the clock beat still, so captures match
        const still = '*{animation-play-state:paused!important;animation-delay:0s!important;transition:none!important}';
        await page.addStyleTag({ content: still });
        const name = `${scene.id} — ${scene.title} (${vp}, ${theme})`;
        const svg = await page.evaluate(async n => (await import('/__svg/index.js')).toSVG({ name: n }), name);
        await writeFile(path.join(dir, `${scene.id}.svg`), svg);
        if (!svgOnly) await page.screenshot({ path: path.join(dir, `${scene.id}.png`) });
    } finally {
        await context.close();
    }
}

const browser = await launchChromium();
try {
    for (const [vp, theme] of runs) {
        const dir = path.join(outRoot, `${vp}-${theme}`);
        await mkdir(dir, { recursive: true });
        for (const scene of SCENES) {
            await capture(browser, vp, theme, scene, dir);
            console.log(`${vp}-${theme}/${scene.id}`);
        }
    }
} finally {
    await browser.close();
}
const index = SCENES.map(({ id, title }) => ({ id, title }));
await writeFile(path.join(outRoot, 'scenes.json'), `${JSON.stringify(index, null, 2)}\n`);
