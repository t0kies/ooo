import { read, write } from '../lib/storage.js';

const KEY = 'pickles.sound';
const HIT_COUNT = 10;
// pre-tuned offline to one key and loudness, so they play as they are
const FILES = [
    'ui/tick.mp3',
    'ui/select.mp3',
    'ui/navigate.mp3',
    'ui/back.mp3',
    'ui/right.mp3',
    ...Array.from({ length: HIT_COUNT }, (_, i) => `hit/${i + 1}.mp3`),
];

// Plays assets/sounds. Browsers allow audio only after a user gesture, so the
// AudioContext is created and the files decoded on the first one.
export function createSound() {
    let enabled = read('localStorage', KEY) !== 'off';
    let context = null;
    let unavailable = false;
    const buffers = {};

    async function load(file) {
        const response = await fetch(new URL(`../../assets/sounds/${file}`, import.meta.url));
        buffers[file] = await context.decodeAudioData(await response.arrayBuffer());
    }

    function unlock() {
        if (!enabled || unavailable) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            unavailable = true;
            return;
        }
        try {
            if (!context) {
                context = new AudioContextClass();
                Promise.all(FILES.map(load)).catch(() => {
                    unavailable = true;
                });
            }
            if (context.state === 'suspended') {
                context.resume().catch(() => {
                    unavailable = true;
                });
            }
        } catch {
            unavailable = true;
        }
    }

    function play(file) {
        if (!enabled || unavailable) return;
        unlock();
        if (context?.state !== 'running' || !buffers[file]) return;
        const source = context.createBufferSource();
        source.buffer = buffers[file];
        source.connect(context.destination);
        source.start();
    }

    document.addEventListener('pointerdown', unlock, { capture: true });
    document.addEventListener('keydown', unlock, { capture: true });

    return {
        get enabled() {
            return enabled;
        },
        toggle() {
            enabled = !enabled;
            write('localStorage', KEY, enabled ? 'on' : 'off');
            if (enabled) unlock();
        },
        damage: () => play(`hit/${1 + Math.floor(Math.random() * HIT_COUNT)}.mp3`),
        tick: () => play('ui/tick.mp3'),
        select: () => play('ui/select.mp3'),
        navigate: () => play('ui/navigate.mp3'),
        back: () => play('ui/back.mp3'),
        right: () => play('ui/right.mp3'),
    };
}
