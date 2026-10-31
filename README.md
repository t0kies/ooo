<p>
  <a href="https://ooo.xorxnor.com/">
    <img src="frontend/assets/images/logo.svg" alt="the Odd One Out logo" width="240">
  </a>
</p>
<a href="https://ooo.xorxnor.com/">ooo.xorxnor.com</a>
<p>
  Three swatches, one a shade off, and a clock running down. <a href="https://ooo.xorxnor.com/">IT IS ONLINE</a>.

<br>

A small color game drawn entirely in text, in the Departure Mono pixel font.
Solo practice runs in the browser; online, friends and strangers play
35-second matches against each other.



## Contents

- [How to play](#how-to-play)
- [Keys](#keys)
- [Branches](#branches)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Settings](#settings)
- [Deployment](#deployment)
- [License](#license)

<br>

## How to play

Every round shows three swatches. Two are the same color and one is a little
off. Pick the odd one before the clock runs out.

- You start with five hearts, and a wrong pick costs one.
- The difference starts wide and closes in each round, from 16 steps down to 3.
- A match is 35 seconds. Solo is practice, and it keeps your best.
- Online, quick match puts you in with whoever's waiting, or you can share an
  invite code with friends (two to eight players).

## Keys

| key | does |
| --- | --- |
| `1` `2` `3` or `q` `w` `e` | pick a swatch |
| `t` | next theme (noctua, silver) |
| `m` | sound on or off |
| `Esc` | leave solo, or back out of the name and code fields |

<br>

## Branches

`main` holds what production runs: the server, the frontend and the deploy
files. `dev` adds the tests and lint, the dev servers, bots, the
link preview and screen capture tools, and the release script that copies the
production files from `dev` onto `main`.

## Scripts

| Script | Branch | What it does |
| --- | --- | --- |
| `pnpm start` | both | One server on port 8080: the game, `/config.json`, Socket.IO and `/healthz` |
| `pnpm watch` | both | The same server, restarted on any change in `backend/` or `frontend/` |
| `pnpm dev:all` | dev | Frontend on 3000 proxying to the backend on 8080, both restarted on changes |
| `pnpm dev:bots` | dev | Quick-match bots that ready up once a human joins (`--help` lists options) |
| `pnpm check` | dev | Biome lint and format, and the tests |
| `pnpm og` | dev | Renders the link preview card to `frontend/assets/images/og-image.png` |
| `pnpm screens` | dev | Every screen as an editable SVG and a PNG in `output/screens/` |
| `pnpm release` | dev | Copies the production files onto `main` as one commit |

The render tools use Playwright's Chromium from `~/.cache/ms-playwright`, or
the browser at `CHROMIUM`.

## Project layout

```
backend/            the server
  config/           settings from the environment, checked at boot
  game/             colors and the puzzles
  match/            rooms, lobbies and the match clock
  socket/           Socket.IO events
  http/             the page, /config.json and /healthz
frontend/           the game in the browser
  scripts/solo/     practice rounds
  scripts/match/    online play: home, lobby, the match and the board
  scripts/ui/       logo, theme, sound and the shared pieces
  styles/           base, components and the two themes
tools/              dev servers, bots, link preview, screens, release (dev only)
test/               the tests (dev only)
output/             screens land here, not committed
```

<br>

## Settings

Settings come from environment variables or a `.env` file, with real variables
taking precedence. `.env.example` lists every one with its default. An invalid
value stops the boot with a list of every problem.

The ones you'll touch most:

| setting | default | what it is |
| --- | --- | --- |
| `MATCH_SECONDS` | 35 | how long a match runs |
| `STARTING_HEALTH` | 5 | hearts at the start |
| `MIN_PLAYERS` / `MAX_PLAYERS` | 2 / 8 | room size |
| `DIFFICULTY` | normal | easy, normal or hard |
| `FEATURE_SOLO`, `FEATURE_QUICK_MATCH`, `FEATURE_INVITES` | true | turn each mode on or off |

## Deployment

The Dockerfile builds the production image: `NODE_ENV=production` and
production dependencies only. `railway.toml` points Railway at it, with a
`/healthz` health check. Rooms live in memory, so each service runs one
replica and keeps its own rooms; more regions mean one service per region.

On Railway, `CLIENT_IP_HEADER=x-real-ip` carries the client IP for the
per-IP limits, `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` at or above
`DRAIN_SECONDS` lets running matches finish across a deploy, and
`PUBLIC_URL` is the address link previews use.

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md): use, change, running and
deploying for any noncommercial purpose. Commercial use is not allowed.

Departure Mono by Helena Zhang is under the SIL Open Font License 1.1
(`frontend/assets/fonts/LICENSE`). The sounds are CC0, from EVRetro
(Freesound), AntumDeluge and Juhani Junkala (OpenGameArt) and Kenney.

Required Notice: Copyright 2026 XOXN
