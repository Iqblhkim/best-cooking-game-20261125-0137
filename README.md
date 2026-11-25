[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Iqblhkim/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Iqblhkim/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve — best-cooking-game-20261125-0137

A complete cooking game for the make.fun bounty "Make the best cooking game"
($250, top 10; deadline 25 Nov 2026 13:37 UTC). Original 2D canvas game, no
libraries, no network requests, keyboard + mouse.

## The game

One chef, one lunch rush, 180 seconds. Orders land on the board with a
patience bar. Grab ingredients from the crates, chop tomato / lettuce / onion
on the boards (hold E), grill patties (take them off before they burn), stack
everything on a plate at the assembly counter, and serve at the window before
the customer walks out. 3 strikes ends the shift early. 5 recipes, 3 levels
of rising pressure, combo multiplier, coins, and a results screen with stars.

- Move: WASD / arrows, or click a station to walk there (click-to-move).
- Use a station: E / Space (hold to chop). P pause, M mute, R restart.
- Sound: synthesized WebAudio bleeps, no audio files.

## Layout

- `game/` — the game, plain static files. `index.html` + `src/`:
  `config.js` (layout + tuning), `recipes.js` (ingredients + recipes),
  `world.js` (state + rules), `render.js` (all drawing), `input.js`,
  `audio.js`, `shots.js` (screenshot scenes), `main.js` (loop + screens).
- `screenshots/` — 4 real renders of the game (1280×720 JPEG):
  cover (rush, finished plate in hand), chopping, grilling, late-game rush.
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes
  `dossier.json` with the vendored `vendor/makefun-game.ts`).
- `serve.ts` — `node serve.ts --port 8901`, then open http://localhost:8901.

## Screenshots (regenerable)

`shots.json` lists the four scenes (`?shot=cover|chop|grill|rush&seed=7`).
Each scene plays the real rules forward with a scripted autopilot (a dish is
really cooked and served), then dresses the frame with real game state.
Re-render with headless Chrome, e.g.:

```sh
chromium --headless=new --window-size=1280,720 --virtual-time-budget=9000 \
  --screenshot=/tmp/final-cover.png "http://localhost:8901/?shot=cover&seed=7"
ffmpeg -y -i /tmp/final-cover.png -q:v 6 screenshots/1-cover.jpg
```

## Local checks (25 Nov 2026, all done)

- Node logic test (`/tmp/test-game.mjs`): 29/29 pass — recipe matching, all
  four staged scenes, full-shift soak.
- `MAKEFUN_OUTPUT_DIR=out node main.ts`: builds; two runs byte-identical.
- `makefun check --worktree`: competition_open, snapshot, license_osi (MIT),
  entrypoint all pass. `transcripts_present` fails only because no transcript
  bundle was passed — that is bundled at submit time, not at build time.
- No console errors in headless Chrome; game loads nothing over the network.

## Repo creation (for the submit run)

Commit only: `main.ts`, `serve.ts`, `LICENSE`, `README.md`, `shots.json`,
`game/`, `screenshots/`, `vendor/`. Do NOT commit: the
`best-cooking-game-20261125-0137-kit/` folder, `out/`, or any build output.
The repo must be created after the competition opened (25 Nov 2026 01:37 UTC)
and must be public under GitHub account Iqblhkim.
