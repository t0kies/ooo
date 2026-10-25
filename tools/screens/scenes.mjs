import { failed, lobby, matchState, named, out, resultData, room, soloHistory, urgent, won } from './fixtures.mjs';

// storage: localStorage to set before load. run / args: what draw-scene.mjs
// draws. focus: a selector to focus afterwards.
export const SCENES = [
    { id: '01-home', title: 'Home · first visit (no name)', run: 'home' },
    {
        id: '02-home-named',
        title: 'Home · name typed, best score',
        storage: named,
        run: 'home',
        focus: '.home-menu-btn',
    },
    {
        id: '03-home-join-code',
        title: 'Home · Join Room with code field',
        storage: named,
        run: 'homeJoin',
        args: { code: '3FA0' },
    },
    {
        id: '04-home-notice',
        title: 'Home · error notice',
        storage: { 'pickles.guestNickname': 'mob' },
        run: 'home',
        args: { notice: 'That match is no longer available.' },
    },
    { id: '05-home-offline', title: 'Home · online unavailable', run: 'home', args: { transportMissing: true } },
    { id: '06-queue', title: 'Quick match · waiting for players', run: 'queue' },
    { id: '07-lobby', title: 'Quick match lobby · ready check', run: 'waiting', args: { state: lobby } },
    { id: '08-invite-room-owner', title: 'Invite room · owner view (kick)', run: 'waiting', args: { state: room } },
    { id: '09-match', title: 'Match · picking', run: 'play', args: { state: matchState(), clock: { seconds: 9 } } },
    {
        id: '10-match-urgent',
        title: 'Match · last seconds, low hp, guess failed, esc armed',
        run: 'play',
        args: { state: urgent, ui: failed, clock: { seconds: 4 } },
    },
    {
        id: '11-match-eliminated',
        title: 'Match · you are out',
        run: 'play',
        args: { state: out, clock: { seconds: 6 } },
    },
    { id: '12-results-lost', title: 'Results · someone else won', run: 'results', args: { result: resultData() } },
    { id: '13-results-won', title: 'Results · you won (invite room)', run: 'results', args: { result: won } },
    {
        id: '14-results-draw',
        title: 'Results · draw',
        run: 'results',
        args: { result: resultData({ winnerId: null, reason: 'all_eliminated' }) },
    },
    { id: '15-solo', title: 'Solo practice · picking', storage: { 'pickles.best': '17' }, run: 'solo' },
    {
        id: '16-solo-result',
        title: 'Solo practice · result',
        storage: { 'pickles.best': '17' },
        run: 'soloResult',
        args: { score: 13, history: soloHistory, isBest: false },
    },
    {
        id: '17-solo-new-best',
        title: 'Solo practice · new best',
        storage: { 'pickles.best': '19' },
        run: 'soloResult',
        args: { score: 19, history: soloHistory, isBest: true },
    },
];
