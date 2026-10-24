// Renders card.html to the link preview image, frontend/assets/images/og-image.png,
// or to the path given as the first argument.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchChromium } from '../lib/chromium.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] || path.join(here, '../../frontend/assets/images/og-image.png'));

const browser = await launchChromium();
try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.goto(pathToFileURL(path.join(here, 'card.html')).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out });
    console.log(`wrote ${path.relative(process.cwd(), out)}`);
} finally {
    await browser.close();
}
