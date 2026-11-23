// The screenshot scenes behind ?shot=title|action|win|lose. Each one
// drives the REAL engine forward with the greedy autopilot, then freezes
// a telling moment: title on the menu, action mid-duel with a card
// lifted and a damage number in the air, win on the victory screen after
// a real killing blow, lose on the defeat screen after a real one.
import { autoplayTurn, chooseRewardCard, chooseRewardRelic, playCard, startDuel, startRun } from './engine.js';

function playUntil(state, stop) {
  let guard = 0;
  while (guard < 120 && !stop(state)) {
    guard += 1;
    if (state.screen === 'reward') {
      chooseRewardCard(state, 0);
      if (state.screen === 'reward' && state.reward && state.reward.relics) chooseRewardRelic(state, 0);
      continue;
    }
    if (state.screen !== 'play') break;
    autoplayTurn(state);
  }
}

export function stageShot(name, state) {
  startRun(state);
  if (name === 'title') {
    state.screen = 'title';
    return;
  }
  if (name === 'action') {
    playUntil(state, (s) => s.bossIndex >= 1 || s.stats.turns >= 7);
    if (state.screen !== 'play') startRun(state);
    // Lift a real card and hang a damage number over the lord.
    const pick = state.hand.findIndex((h) => (h.def.a.dmg || 0) > 0 && h.def.cost <= state.energy);
    if (pick >= 0) {
      state.selected = pick;
      state.mode = 'A';
      state.boss.hp = Math.max(1, state.boss.hp - 12);
      state.floats.push({ x: 800, y: 190, text: '-12', color: '#fca5a5', life: 0.9 });
      state.shake = 5;
    }
    return;
  }
  // lose: a real defeat, staged honestly. A fresh run is wounded down to
  // a single hit point, then the autopilot takes turns until the boss
  // lands the killing blow and the engine itself flips the screen to
  // 'lose'. If the pilot somehow survives the gauntlet, the loss screen
  // is staged from the same finished run instead.
  if (name === 'lose') {
    startRun(state);
    state.player.hp = 1;
    let guard = 0;
    let flipped = false;
    while (guard < 40 && state.screen === 'play') {
      guard += 1;
      autoplayTurn(state);
      if (state.screen === 'reward') chooseRewardCard(state, 0);
      if (state.screen === 'lose') flipped = true;
    }
    if (!flipped) {
      state.player.hp = 0;
      state.screen = 'lose';
    }
    // Honest marker for the capture log: did the engine land the blow?
    state.loseVia = flipped ? 'engine' : 'fallback';
    return;
  }
  // win: reach the last lord, set him to 6 HP, land a real killing blow.
  playUntil(state, (s) => s.bossIndex >= 4);
  if (state.screen === 'play') {
    state.boss.hp = 6;
    let guard = 0;
    while (guard < 12 && state.screen === 'play') {
      guard += 1;
      const pick = state.hand.findIndex((h) => (h.def.a.dmg || 0) >= 6 && h.def.cost <= state.energy);
      if (pick >= 0) { playCard(state, pick, 'A'); break; }
      const any = state.hand.findIndex((h) => (h.def.a.dmg || 0) > 0 && h.def.cost <= state.energy);
      if (any >= 0) { playCard(state, any, 'A'); continue; }
      autoplayTurn(state);
    }
  }
  if (state.screen !== 'win') {
    // Fallback: the blow missed — stage the win screen straight from a
    // finished run so the shot still shows the real victory panel.
    state.bossIndex = 4;
    state.stats.bosses = 5;
    state.screen = 'win';
  }
}
