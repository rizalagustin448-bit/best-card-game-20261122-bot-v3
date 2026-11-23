# TIDEBREAKER — 5 tide-lords, 52 dual-mode cards, 14 relics, 3 acts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](main.ts)
[![make.fun](https://img.shields.io/badge/make.fun-best%20card%20game-0ea5e9.svg)](https://make.fun/c/best-card-game-20261122-1826)

A deck-builder card duel on the open sea. Break the tides, outread five tide-lords, and sink the Drowned King across 3 acts.

## How to play

- **Goal:** defeat all 5 tide-lords and survive 3 acts. Lose if your HP hits 0.
- **Dual-mode cards:** every card has two modes — **A** (strike) and **B** (effect: draw, heal, block, or buff). Each hand is a puzzle: the same card can hit hard or set up the next turn.
- **TOSS:** discard a card from your hand to gain **+1 energy** this turn — spend now or invest in a bigger play.
- **RIPPLE:** shift the boss's current pattern, so a telegraphed attack you can't block becomes one you can answer.
- **Tide bonus:** play 2 cards of the same suit in one turn to trigger its Tide — Wave grants Block, Storm grants Strength, Coral heals, Deep draws.
- **Boss intents:** every lord shows its next move (attack, block, buff, weaken) and rotates through 2–3 patterns, so reading the enemy is a skill, not a guess.
- **Rewards:** after each lord, add 1 of 3 new cards to your deck; after acts, take 1 of 2 relics (14 relics total, each bends a rule in your favour).
- **Energy:** 3 per turn, draw 5 cards a turn.

## Controls

- Mouse: click a card to play it, **END TURN** to pass, buttons for rewards.
- Keyboard: `1–7` play hand cards, `A` / `B` switch a card's mode, `T` toss a card, `Space` ends turn, `R` restarts after win/loss.

## Contents

- `game/` — the playable game (static files, no network, no build step): `index.html` + `styles.css` + `src/`:
  - `config.js` — tuning numbers (energy, draw, acts)
  - `cards.js` — 52 dual-mode cards
  - `bosses.js` — 5 tide-lords with rotating patterns
  - `relics.js` — 14 relics
  - `engine.js` — combat rules and turn flow
  - `render.js` — table, fanned hand, glow, floating damage
  - `fx.js` — shake, flashes, floating numbers
  - `audio.js` — WebAudio synth SFX
  - `input.js` — mouse + keyboard
  - `random.js` — seeded random
  - `shots.js` — deterministic screenshot stages
  - `main.js` — boot
- `screenshots/` — 4 real renders: title, midgame action, near win, win screen.
- `main.ts` — hand-in program (Node 22): copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.

## Run locally

```sh
node serve.ts   # then open http://localhost:8080
```

## Screenshots

`?shot=title|play|win|loss` stages each screen deterministically (seeded).
