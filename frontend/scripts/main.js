import { $, isTyping } from './lib/dom.js';
import { hasMultiplayer, loadSettings } from './lib/settings.js';
import { startMatchClient } from './match/client/index.js';
import { setupControlSounds } from './ui/control-sounds.js';
import { setupFullscreen } from './ui/fullscreen.js';
import { logo, setupLogo } from './ui/logo.js';
import { createSound } from './ui/sound.js';
import { setupSoundToggle } from './ui/sound-toggle.js';
import { nextTheme, setupTheme } from './ui/theme.js';

setupTheme();
setupLogo();
setupFullscreen($('fullscreen-toggle'));
$('brand').replaceChildren(logo('small'));

// The Socket.IO client is served by the server itself; resolves either way.
function loadSocketClient() {
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = script.onerror = resolve;
        document.head.appendChild(script);
    });
}

await loadSettings();
if (hasMultiplayer()) await loadSocketClient();
const socket = hasMultiplayer() && typeof window.io === 'function' ? window.io() : null;
const sound = createSound();
const toggleSound = setupSoundToggle(sound, $('sound-toggle'));
setupControlSounds(sound);
startMatchClient($('game'), socket, sound);

// t: next theme, m: sound on/off
document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.defaultPrevented) return;
    if (isTyping(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 't') nextTheme();
    else if (key === 'm') toggleSound();
});
