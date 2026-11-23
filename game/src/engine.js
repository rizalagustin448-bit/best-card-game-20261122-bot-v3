// The duel engine: one run is five lords in a row, each a turn-based
// fight. The player draws, spends energy, and plays dual-mode cards;
// two cards of one suit in a turn fire that suit's Tide bonus. Bosses
// cycle through 2–3 named patterns, always showing their next intent,
// and RIPPLE pays energy to shove a boss onto another pattern. TOSS
// discards a card from the hand for +1 energy — tempo spent, tempo gained.
import { BASE_ENERGY, HAND_SIZE, PLAYER_MAX_HP, SUITS, TIDE_NEED } from './config.js';
import { BOSSES, actOf } from './bosses.js';
import { RELICS, relicChoices } from './relics.js';
import { cardByName, rewardChoices, startingDeck } from './cards.js';

let uidCounter = 1;
function freshCard(def) { return { uid: uidCounter + 1, def }; }

export function hasRelic(state, flag) {
  return state.relics.some((r) => r.flag === flag);
}

export function currentIntent(state) {
  const boss = state.boss;
  return boss.def.patterns[boss.patternIdx].intent;
}

export function currentPattern(state) {
  return state.boss.def.patterns[state.boss.patternIdx];
}

export function createGame(rng) {
  const state = {
    rng,
    screen: 'title',
    deck: startingDeck().map(freshCard),
    drawPile: [],
    discardPile: [],
    hand: [],
    energy: 0,
    maxEnergy: BASE_ENERGY,
    turn: 0,
    bossIndex: 0,
    boss: null,
    player: { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, block: 0, str: 0, weak: 0, vuln: 0 },
    suitsThisTurn: {},
    tideDone: {},
    relics: [],
    reward: null,
    selected: -1,
    mode: 'A',
    tossMode: false,
    ripplesUsed: 0,
    floats: [],
    shake: 0,
    log: [],
    stats: { turns: 0, played: 0, tides: 0, damage: 0, bosses: 0 },
    wins: 0,
  };
  return state;
}

export function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1 });
}

function say(state, text) {
  state.log.unshift(text);
  if (state.log.length > 4) state.log.pop();
}

function drawCards(state, n) {
  for (let i = 0; i < n; i += 1) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) return;
      state.drawPile = state.rng.shuffle(state.discardPile);
      state.discardPile = [];
    }
    state.hand.push(state.drawPile.pop());
  }
}

export function startRun(state) {
  state.deck = startingDeck().map(freshCard);
  state.relics = [];
  state.bossIndex = 0;
  state.player = { hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, block: 0, str: 0, weak: 0, vuln: 0 };
  state.stats = { turns: 0, played: 0, tides: 0, damage: 0, bosses: 0 };
  state.screen = 'play';
  startDuel(state);
}

export function startDuel(state) {
  const def = BOSSES[state.bossIndex];
  state.boss = {
    def, hp: def.hp, maxHp: def.hp, block: 0, str: 0, weak: 0, vuln: 0,
    patternIdx: state.rng.int(def.patterns.length),
  };
  state.drawPile = state.rng.shuffle(state.deck);
  state.discardPile = [];
  state.hand = [];
  state.turn = 0;
  state.ripplesUsed = 0;
  state.selected = -1;
  state.tossMode = false;
  state.player.block = 0;
  state.player.str = 0;
  state.player.weak = 0;
  state.player.vuln = 0;
  if (hasRelic(state, 'bossWeak')) state.boss.weak = 2;
  if (hasRelic(state, 'startBlock')) state.player.block = 8;
  say(state, `${def.name} rises — ${def.title}.`);
  beginTurn(state);
}

export function beginTurn(state) {
  state.turn += 1;
  state.stats.turns += 1;
  state.suitsThisTurn = {};
  state.tideDone = {};
  state.energy = state.maxEnergy;
  if (state.turn === 1 && hasRelic(state, 'firstTurnEnergy')) state.energy += 1;
  if (hasRelic(state, 'turnHeal')) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
  }
  let draw = HAND_SIZE;
  if (hasRelic(state, 'extraDraw')) draw += 1;
  if (state.turn === 1 && hasRelic(state, 'firstTurnDraw')) draw += 2;
  drawCards(state, draw);
}

function dealDamageToBoss(state, raw) {
  const boss = state.boss;
  let dmg = raw + state.player.str;
  if (boss.vuln > 0) dmg = Math.round(dmg * (1 + 0.5 * boss.vuln));
  if (hasRelic(state, 'firstHit') && state.stats.playedThisTurnAttacks === 1 && raw > 0) dmg += 4;
  let left = dmg;
  if (boss.block > 0) {
    const absorbed = Math.min(boss.block, left);
    boss.block -= absorbed;
    left -= absorbed;
  }
  boss.hp -= left;
  state.stats.damage += left;
  return left;
}

function applyEffect(state, fx, x, y) {
  const p = state.player;
  const boss = state.boss;
  if (fx.dmg) {
    const dealt = dealDamageToBoss(state, fx.dmg);
    addFloat(state, 800, 150, `-${dealt}`, '#fca5a5');
    state.shake = Math.max(state.shake, 4);
  }
  if (fx.block) {
    p.block += fx.block;
    addFloat(state, 186, 540, `+${fx.block} Block`, '#7dd3fc');
  }
  if (fx.heal) {
    let amount = fx.heal + (state.hand.length >= 0 && hasRelic(state, 'coralStrong') && state.lastSuit === 'Coral' ? 2 : 0);
    p.hp = Math.min(p.maxHp, p.hp + amount);
    addFloat(state, 186, 540, `+${amount} HP`, '#86efac');
  }
  if (fx.draw) drawCards(state, fx.draw);
  if (fx.str) {
    p.str += fx.str;
    addFloat(state, 186, 540, `+${fx.str} Strength`, '#fde047');
  }
  if (fx.weak) {
    boss.weak += fx.weak;
    addFloat(state, 900, 240, `Weak ${fx.weak}`, '#c4b5fd');
  }
  if (fx.vuln) {
    boss.vuln += fx.vuln;
    addFloat(state, 900, 272, `Exposed ${fx.vuln}`, '#f0abfc');
  }
  if (fx.energy) state.energy += fx.energy;
}

function fireTide(state, suit) {
  const strong = hasRelic(state, 'tideStrong');
  const p = state.player;
  state.stats.tides += 1;
  if (suit === 'Wave') {
    const amount = strong ? 9 : 6;
    p.block += amount;
    addFloat(state, 300, 360, `TIDE Wave +${amount} Block`, SUITS.Wave.color);
  } else if (suit === 'Storm') {
    const amount = strong ? 4 : 3;
    p.str += amount;
    addFloat(state, 300, 360, `TIDE Storm +${amount} Strength`, SUITS.Storm.color);
  } else if (suit === 'Coral') {
    const amount = strong ? 6 : 4;
    p.hp = Math.min(p.maxHp, p.hp + amount);
    addFloat(state, 300, 360, `TIDE Coral Heal ${amount}`, SUITS.Coral.color);
  } else {
    const amount = strong ? 3 : 2;
    drawCards(state, amount);
    addFloat(state, 300, 360, `TIDE Deep Draw ${amount}`, SUITS.Deep.color);
  }
  if (hasRelic(state, 'tideEnergy')) state.energy += 1;
  say(state, `Tide bonus: ${suit} — ${SUITS[suit].bonus}!`);
}

export function playCard(state, handIndex, mode) {
  if (state.screen !== 'play') return false;
  const held = state.hand[handIndex];
  if (!held) return false;
  const card = held.def;
  if (card.cost > state.energy) return false;
  state.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  state.discardPile.push(held);
  state.stats.played += 1;
  state.lastSuit = card.suit;
  const fx = mode === 'B' ? card.b : card.a;
  if ((fx.dmg || 0) > 0) state.stats.playedThisTurnAttacks = (state.stats.playedThisTurnAttacks || 0) + 1;
  applyEffect(state, fx, 640, 200);
  state.suitsThisTurn[card.suit] = (state.suitsThisTurn[card.suit] || 0) + 1;
  if (state.suitsThisTurn[card.suit] >= TIDE_NEED && !state.tideDone[card.suit]) {
    state.tideDone[card.suit] = true;
    fireTide(state, card.suit);
  }
  state.selected = -1;
  state.tossMode = false;
  if (state.boss.hp <= 0) {
    winDuel(state);
    return true;
  }
  return true;
}

export function tossCard(state, handIndex) {
  if (state.screen !== 'play' || !state.tossMode) return false;
  const held = state.hand[handIndex];
  if (!held) return false;
  state.hand.splice(handIndex, 1);
  state.discardPile.push(held);
  state.energy += 1;
  state.tossMode = false;
  state.selected = -1;
  say(state, `Tossed ${held.def.name} for +1 energy.`);
  return true;
}

// RIPPLE: pay 1 energy (free once per duel with the Salt Compass) to shove
// the boss onto its next pattern — an active counter, bought with tempo.
export function ripple(state) {
  if (state.screen !== 'play') return false;
  const free = hasRelic(state, 'freeRipple') && state.ripplesUsed === 0;
  if (!free && state.energy < 1) return false;
  if (!free) state.energy -= 1;
  state.ripplesUsed += 1;
  const boss = state.boss;
  boss.patternIdx = (boss.patternIdx + 1) % boss.def.patterns.length;
  say(state, `Ripple! ${boss.def.name} shifts to ${currentPattern(state).name}.`);
  return true;
}

function bossAct(state) {
  const boss = state.boss;
  const intent = currentIntent(state);
  const p = state.player;
  if (intent.kind === 'attack') {
    let dmg = intent.value + boss.str;
    if (boss.weak > 0) dmg = Math.max(0, Math.round(dmg * (1 - 0.25 * boss.weak)));
    if (intent.text.includes('Frail')) p.vuln += 1;
    let left = dmg;
    if (p.block > 0) {
      const absorbed = Math.min(p.block, left);
      p.block -= absorbed;
      left -= absorbed;
    }
    p.hp -= left;
    state.shake = 14;
    addFloat(state, 460, 500, `-${left}`, '#fca5a5');
    say(state, `${boss.def.name} hits for ${left}.`);
  } else if (intent.kind === 'block') {
    boss.block += intent.value;
    if (intent.text.includes('Heal')) boss.hp = Math.min(boss.maxHp, boss.hp + 6);
    if (intent.text.includes('Rage')) boss.str += intent.text.includes('Rage 3') ? 3 : 2;
    say(state, `${boss.def.name} guards ${intent.value}.`);
  } else if (intent.kind === 'buff') {
    boss.str += intent.value;
    say(state, `${boss.def.name} gains +${intent.value} Strength.`);
  } else if (intent.kind === 'hex') {
    p.weak += intent.value;
    say(state, `${boss.def.name} weakens you ${intent.value}.`);
  }
  boss.patternIdx = (boss.patternIdx + 1) % boss.def.patterns.length;
  if (boss.weak > 0) boss.weak -= 1;
  if (boss.vuln > 0) boss.vuln -= 1;
}

export function endTurn(state) {
  if (state.screen !== 'play') return;
  state.selected = -1;
  state.tossMode = false;
  // Block fades unless the Leviathan Scale keeps half of it.
  if (hasRelic(state, 'keepBlock')) state.player.block = Math.floor(state.player.block / 2);
  else state.player.block = 0;
  if (state.player.weak > 0) state.player.weak -= 1;
  if (state.player.vuln > 0) state.player.vuln -= 1;
  state.stats.playedThisTurnAttacks = 0;
  bossAct(state);
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.screen = 'lose';
    return;
  }
  // Hand is discarded at the end of the turn; a fresh hand is drawn.
  while (state.hand.length > 0) state.discardPile.push(state.hand.pop());
  beginTurn(state);
}

function winDuel(state) {
  state.stats.bosses += 1;
  state.boss.hp = 0;
  if (hasRelic(state, 'winHeal')) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
  }
  if (state.bossIndex >= BOSSES.length - 1) {
    state.wins += 1;
    state.screen = 'win';
    return;
  }
  const afterSecond = state.bossIndex === 1;
  const afterFourth = state.bossIndex === 3;
  state.reward = {
    cards: rewardChoices(state.rng, 3),
    relics: afterSecond || afterFourth ? relicChoices(state.rng, state.relics, 2) : null,
    relicPicked: false,
  };
  state.screen = 'reward';
}

export function chooseRewardCard(state, index) {
  if (state.screen !== 'reward' || !state.reward) return false;
  const card = state.reward.cards[index];
  if (!card) return false;
  state.deck.push(freshCard(card));
  say(state, `Kept ${card.name}.`);
  if (state.reward.relics && !state.reward.relicPicked) return true;
  nextDuel(state);
  return true;
}

export function chooseRewardRelic(state, index) {
  if (state.screen !== 'reward' || !state.reward || !state.reward.relics) return false;
  const relic = state.reward.relics[index];
  if (!relic) return false;
  state.relics.push(relic);
  state.reward.relicPicked = true;
  if (relic.flag === 'maxHp') {
    state.player.maxHp += 12;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 12);
  }
  say(state, `Relic: ${relic.name}.`);
  nextDuel(state);
  return true;
}

function nextDuel(state) {
  state.bossIndex += 1;
  state.reward = null;
  state.screen = 'play';
  startDuel(state);
}

// A greedy autopilot: plays the best damage it can afford, blocks when the
// boss is about to hit hard, then ends the turn. Used by the screenshot
// scenes and the playtest, never by the player.
export function autoplayTurn(state) {
  if (state.screen !== 'play') return false;
  const intent = currentIntent(state);
  let guard = 0;
  while (guard < 20) {
    guard += 1;
    let best = -1;
    let bestScore = -1;
    let bestMode = 'A';
    for (let i = 0; i < state.hand.length; i += 1) {
      const card = state.hand[i].def;
      if (card.cost > state.energy) continue;
      const threat = intent.kind === 'attack' ? intent.value + state.boss.str : 0;
      const scoreA = scoreCard(state, card, card.a, threat);
      const scoreB = scoreCard(state, card, card.b, threat);
      if (scoreA > bestScore) { bestScore = scoreA; best = i; bestMode = 'A'; }
      if (scoreB > bestScore) { bestScore = scoreB; best = i; bestMode = 'B'; }
    }
    if (best < 0 || bestScore <= 0) break;
    playCard(state, best, bestMode);
    if (state.screen !== 'play') return true;
  }
  endTurn(state);
  return state.screen === 'play';
}

function scoreCard(state, card, fx, threat) {
  let score = 0;
  if (fx.dmg) score += fx.dmg * 2;
  if (fx.block) score += threat > 8 ? fx.block * 2.2 : fx.block * 0.8;
  if (fx.heal) score += state.player.hp < state.player.maxHp * 0.6 ? fx.heal * 1.5 : 0.3;
  if (fx.draw) score += 3;
  if (fx.str) score += 6;
  if (fx.weak) score += 5;
  if (fx.vuln) score += 5;
  if (fx.energy) score += 4;
  score -= card.cost * 2;
  return score;
}

export { actOf, RELICS };
export function bossCount() { return BOSSES.length; }
