import { button, line } from '../../../lib/dom.js';
import { setScreen } from '../../../lib/screen.js';
import { settings } from '../../../lib/settings.js';
import { bestScore } from '../../../solo/best.js';
import { cat } from '../../../ui/cat.js';
import { logo } from '../../../ui/logo.js';
import { codeField } from './code.js';
import { createMenu } from './menu.js';
import { nameField } from './name.js';

const OFFLINE = 'online play is off right now · practice still works';
const KEYS = '↑ ↓ move · ↵ select · ↵ on the name to type it · esc stops typing';

// Home: the logo, the menu, and a notice slot. The online rows need a name
// and are disabled until there is one. Layout is fixed in
// styles/components/home.css, so nothing here moves the logo or menu.
// start: { quickMatch(name), createInvite(name), joinInvite(code, name), solo() }
export function showHome(game, { notice, transportMissing }, start) {
    const opening = !game.querySelector('.home-card'); // not a redraw for a notice
    game.replaceChildren();
    const card = line('game-card home-card');
    game.appendChild(card);

    const { solo, quickMatch, invites } = settings.features;
    const online = (quickMatch || invites) && !transportMissing;
    const onlineButtons = [];
    const refresh = () => {
        for (const el of onlineButtons) el.disabled = !name.hasName();
        menu.markEnter();
    };
    const name = nameField({ onDone: () => onlineButtons[0]?.focus(), onChange: refresh });
    const code = codeField({
        onJoin: value => start.joinInvite(value, name.input.value),
        back: () => onlineButtons.at(-1),
    });
    const practice = solo ? button('Quick Practice', 'home-practice', start.solo) : null;
    // ↲ goes on the focused row; while typing a name, on the first online row
    const menu = createMenu(card, at => {
        const target = name.typing() && name.hasName() ? onlineButtons[0] : at;
        return menu.has(target) ? target : practice;
    });

    if (practice) menu.row(practice, practice);
    if (online) menu.row(name.input, name.el).classList.add('home-name');
    const add = (label, run, ...extra) => {
        const el = button(label, 'home-menu-btn', run);
        onlineButtons.push(el);
        menu.row(el, el, ...extra);
        return el;
    };
    if (online && quickMatch) add('Quick Match', () => start.quickMatch(name.input.value));
    if (online && invites) {
        add('New Room', () => start.createInvite(name.input.value));
        menu.share(code.input, add('Join Room', code.joinRoom, code.el));
    }

    const notices = line('home-notices');
    if (transportMissing) notices.appendChild(line('game-notice', OFFLINE));
    if (notice) notices.appendChild(line('game-notice', notice));
    const home = line('home');
    const best = bestScore();
    if (best != null) home.append(line(opening ? 'home-best is-flashing' : 'home-best', `best ${best}`));
    home.append(logo('big'), menu.menu, notices);
    card.appendChild(home);
    cat(card, 'home');
    refresh();
    setScreen('menu', { home: true, keys: KEYS });

    // back from a failed join, the code field reopens. Otherwise a
    // returning player lands on Quick Match, a new one on practice.
    if (!(notice && invites && online && code.restore())) {
        code.forget();
        ((online && name.hasName() && onlineButtons[0]) || practice || (online ? name.input : null))?.focus();
    }
    menu.markEnter();
}
