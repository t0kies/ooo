// Copies onto main only what production runs (MAIN) as one commit, after the
// checks pass here. package.json keeps its dependencies and MAIN_SCRIPTS.
// Takes the commit message as its argument; --dry-run lists the changes only.
// main is rebuilt from dev each time, so commits made on main directly don't last.
const { execFileSync } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const { smoke } = require('./smoke');

const MAIN = [
    'backend',
    'frontend',
    'package.json',
    'pnpm-lock.yaml',
    'Dockerfile',
    '.dockerignore',
    'railway.toml',
    '.env.example',
    '.gitignore',
    '.nvmrc',
    'LICENSE.md',
    'README.md',
];
const MAIN_SCRIPTS = ['start', 'watch'];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

function fail(message) {
    console.error(message);
    process.exit(1);
}

// dev's package.json with only the production scripts and no dev dependencies
function mainManifest() {
    const pkg = JSON.parse(git('show', 'dev:package.json'));
    pkg.scripts = Object.fromEntries(MAIN_SCRIPTS.map(name => [name, pkg.scripts[name]]));
    delete pkg.devDependencies;
    return `${JSON.stringify(pkg, null, 4)}\n`;
}

const dryRun = process.argv.includes('--dry-run');
const message = process.argv.slice(2).find(arg => !arg.startsWith('--'));
if (git('branch', '--show-current') !== 'dev') fail('Run this on the dev branch.');
if (git('status', '--porcelain')) fail('Commit or stash your changes first.');
if (!dryRun && !message) fail('Usage: pnpm release "message" (or --dry-run)');

if (dryRun) {
    const extra = git('ls-tree', '-r', '--name-only', 'main')
        .split('\n')
        .filter(file => !MAIN.some(path => file === path || file.startsWith(`${path}/`)));
    console.log(git('diff', '--name-status', '--no-renames', 'main', 'dev', '--', ...MAIN));
    for (const file of extra) console.log(`D\t${file}`);
    console.log('(package.json and pnpm-lock.yaml are trimmed for main)');
    process.exit(0);
}

async function release() {
    run('pnpm', ['check']);
    git('switch', '-q', 'main');
    try {
        git('rm', '-rq', '--', '.');
        git('checkout', 'dev', '--', ...MAIN);
        writeFileSync('package.json', mainManifest());
        run('pnpm', ['install']);
        await smoke();
        git('add', '-A');
        if (!git('status', '--porcelain')) throw new Error('main already matches dev.');
        git('commit', '-q', '-m', message);
        console.log(git('log', '--oneline', '-1'));
    } catch (error) {
        // main started clean, so the reset drops only this run's changes
        git('reset', '-q', '--hard');
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        git('switch', '-q', 'dev');
        run('pnpm', ['install']);
    }
}

release();
