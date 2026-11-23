// The screenshot scenes behind ?shot=title|action|nearwin|win. Each one
// drives the REAL engine forward with the greedy autopilot, then freezes
// a telling moment: title on the menu, action mid-duel with a card
// lifted and a damage number in the air, nearwin with the last lord on
// 9 HP, win on the victory screen after a real killing blow.
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
  if (name === 'nearwin') {
    // Sail straight to the last lord, then leave him on 9 HP.
    playUntil(state, (s) => s.bossIndex >= 4);
    if (state.bossIndex < 4) {
      // Autopilot lost somewhere: jump the run to the final duel directly.
      state.bossIndex = 4;
      state.player.hp = 34;
      state.screen = 'play';
      startDuel(state);
    }
    if (state.screen === 'play') {
      state.boss.hp = 9;
      state.player.hp = Math.min(state.player.hp, 34);
      const pick = state.hand.findIndex((h) => (h.def.a.dmg || 0) > 0 && h.def.cost <= state.energy);
      if (pick >= 0) { state.selected = pick; state.mode = 'A'; }
    }
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
