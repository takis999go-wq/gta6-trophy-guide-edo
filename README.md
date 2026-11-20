# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/takis999go-wq/gta6-trophy-guide-edo/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/takis999go-wq/gta6-trophy-guide-edo/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that tracks all **55 GTA VI trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze) with a per-trophy guide for every single one. Built for the [make.fun](https://make.fun/bounty/gta6-trophy-guide-01) bounty "Build the best GTA 6 trophy guide".

## What it does

- Complete checklist of all 55 trophies with official names, descriptions and grades
- A written guide for every trophy, including missable and unconfirmed flags
- Live progress: earned count, percentage, per-grade breakdown, platinum progress bar
- Filters by grade, trophy kind, confirmed/unconfirmed and missable-only, plus search
- Spoiler mode: story trophies stay hidden until earned
- Progress saved in the browser (localStorage), with JSON export/import
- A 4-stage platinum roadmap and named sources rendered from the trophy data
- Fully offline: no external requests, everything runs from `app/`

## Run it

Open `app/index.html` in a browser, or serve the folder:

```
node serve.ts
```

`main.ts` is the hand-in entry point: it copies `app/` and `screenshots/` to the output directory and writes `dossier.json` via `buildDossier` from `vendor/makefun-frontend.ts`.

## Layout

- `app/` — the static app (`index.html`, `app.js`, `style.css`, `data/trophies.json`)
- `screenshots/` — four screenshots of the running app
- `vendor/` — the make.fun frontend kit, byte-identical to the competition kit
- `main.ts`, `serve.ts`, `shots.json` — hand-in and local serving

Entry for the make.fun bounty: https://make.fun/bounty/gta6-trophy-guide-01
