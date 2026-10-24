// Launches Playwright's Chromium for the render tools (og, screens).
// CHROMIUM=/path/to/chrome overrides the newest one in ~/.cache/ms-playwright,
// where `playwright-core install chromium` puts it.
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

function findChromium() {
    if (process.env.CHROMIUM) return process.env.CHROMIUM;
    const cache = path.join(homedir(), '.cache/ms-playwright');
    const dir =
        existsSync(cache) &&
        readdirSync(cache)
            .filter(d => /^chromium-\d+$/.test(d))
            .sort()
            .at(-1);
    const exe = dir && path.join(cache, dir, 'chrome-linux64/chrome');
    if (!exe || !existsSync(exe)) {
        throw new Error(
            'No Playwright Chromium found. Run `pnpm exec playwright-core install chromium` or set CHROMIUM.',
        );
    }
    return exe;
}

export const launchChromium = () => chromium.launch({ executablePath: findChromium() });
