# Odd One Out

Three swatches, one a shade off, and a clock running down.

A small color game drawn entirely in text, in the Departure Mono pixel font.
Solo practice runs in the browser; online, friends and strangers play
35-second matches against each other.

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

## Settings

Settings come from environment variables or a `.env` file, with real variables
taking precedence. `.env.example` lists every one with its default. An invalid
value stops the boot with a list of every problem.

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
