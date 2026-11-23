// Boot and the one loop: clicks and keys are read every frame, the
// floating numbers and shake decay with time, and the renderer paints
// what is there. Screens: title, play, reward, win, lose.
// ?seed=N fixes the run. ?shot=title|action|nearwin|win stages that
// scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { createRandom } from './random.js';
import { chooseRewardCard, chooseRewardRelic, createGame, endTurn, playCard, ripple, startRun, tossCard } from './engine.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { updateFx } from './fx.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRandom(seed));
window.__game = game;
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas, renderer.toLogical);

function readWins() {
  try { return Number.parseInt(window.localStorage.getItem('tidebreaker.wins') ?? '0', 10) || 0; }
  catch { return 0; }
}
function saveWins(value) {
  try { window.localStorage.setItem('tidebreaker.wins', String(value)); }
  catch { /* private windows: the count lasts this visit only */ }
}
game.wins = readWins();

function announce(message) { status.textContent = message; }

function hoverCard() {
  if (game.screen !== 'play') return -1;
  const lay = renderer.layout(game, -1);
  return renderer.hitCard(lay.cards, input.mouse.x, input.mouse.y);
}

function handleClick(click) {
  audio.unlock();
  if (game.screen === 'title') {
    startRun(game);
    announce('Duel 1: Gull King Raka. Read his intent, then play.');
    return;
  }
  if (game.screen === 'win' || game.screen === 'lose') {
    startRun(game);
    return;
  }
  if (game.screen === 'reward') {
    const lay = renderer.layout(game, -1);
    const cards = lay.buttons.rewardCards || [];
    for (const c of cards) {
      if (renderer.pointIn({ x: c.x, y: c.y, w: c.w, h: c.h }, click.x, click.y)) {
        chooseRewardCard(game, c.index);
        audio.playCard();
        return;
      }
    }
    const relics = lay.buttons.rewardRelics || [];
    for (const r of relics) {
      if (renderer.pointIn(r, click.x, click.y)) {
        chooseRewardRelic(game, r.index);
        audio.tide();
        return;
      }
    }
    return;
  }
  if (game.screen !== 'play') return;
  const lay = renderer.layout(game, hoverCard());
  const b = lay.buttons;
  if (renderer.pointIn(b.endTurn, click.x, click.y)) { endTurn(game); audio.hit(); return; }
  if (renderer.pointIn(b.ripple, click.x, click.y)) { if (ripple(game)) audio.tide(); return; }
  if (renderer.pointIn(b.toss, click.x, click.y)) { game.tossMode = !game.tossMode; game.selected = -1; return; }
  const hit = renderer.hitCard(lay.cards, click.x, click.y);
  if (hit >= 0) {
    if (game.tossMode) { tossCard(game, hit); audio.block(); return; }
    if (game.selected === hit) {
      // Clicking the lifted card plays it: its A line or its B line.
      const card = lay.cards[hit];
      const mode = click.y < card.y + 73 ? 'A' : 'B';
      if (playCard(game, hit, mode)) audio.playCard();
      return;
    }
    game.selected = hit; game.mode = 'A'; audio.unlock();
  } else {
    game.selected = -1;
  }
}

function handleKey(code) {
  audio.unlock();
  if (code === 'Space' || code === 'Enter') {
    if (game.screen === 'title' || game.screen === 'win' || game.screen === 'lose') { startRun(game); return; }
    if (game.screen === 'play') { endTurn(game); return; }
  }
  if (game.screen !== 'play') return;
  if (code === 'KeyT') { game.tossMode = !game.tossMode; game.selected = -1; return; }
  if (code === 'KeyR') { ripple(game); return; }
  if (code === 'KeyA' && game.selected >= 0) { if (playCard(game, game.selected, 'A')) audio.playCard(); return; }
  if (code === 'KeyB' && game.selected >= 0) { if (playCard(game, game.selected, 'B')) audio.playCard(); return; }
  const num = Number.parseInt(code.replace('Digit', ''), 10);
  if (num >= 1 && num <= 7 && game.hand[num - 1]) {
    game.selected = game.selected === num - 1 ? -1 : num - 1;
    game.mode = 'A';
  }
}

function runShot(name) {
  stageShot(name, game);
  let painted = 0;
  function paint() {
    updateFx(game, 1 / 60);
    renderer.draw(game, game.screen, -1, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let last = performance.now();
  let prevScreen = game.screen;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const click of input.takeClicks()) handleClick(click);
    for (const key of input.takeKeys()) handleKey(key);
    updateFx(game, dt);
    if (game.screen !== prevScreen) {
      prevScreen = game.screen;
      if (game.screen === 'win') { game.wins += 1; saveWins(game.wins); audio.win(); }
      if (game.screen === 'lose') audio.lose();
      announce(game.screen === 'win' ? 'Victory! The tide is yours.' : game.screen === 'lose' ? 'Swallowed by the deep.' : game.screen);
    }
    renderer.draw(game, game.screen, hoverCard(), now / 1000);
  }
  announce('Tidebreaker. Click or press Space to set sail.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
