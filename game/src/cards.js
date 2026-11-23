// The card pool: 52 cards in 4 suits. Every card has TWO modes —
// mode A and mode B do different things, so playing a card is a choice,
// not a reflex. An effect is {dmg, block, heal, draw, str, weak, vuln, energy}.
// Rows: [name, suit, cost, mode-A label, mode-A effect, mode-B label, mode-B effect]
const ROWS = [
  // ---- Wave (blue): clean damage and block ----
  ['Breaker Slam', 'Wave', 1, 'Smash 7', { dmg: 7 }, 'Smash 4 + Draw', { dmg: 4, draw: 1 }],
  ['Foam Guard', 'Wave', 1, 'Block 9', { block: 9 }, 'Block 5 + Heal', { block: 5, heal: 2 }],
  ['Undertow', 'Wave', 2, 'Drag 11', { dmg: 11 }, 'Drag 6 + Weaken', { dmg: 6, weak: 1 }],
  ['Crest Ride', 'Wave', 0, 'Nip 3', { dmg: 3 }, 'Catch a card', { draw: 1 }],
  ['Riptide', 'Wave', 2, 'Hit 8 + Block 4', { dmg: 8, block: 4 }, 'Hit 5 + Draw', { dmg: 5, draw: 1 }],
  ['Salt Spray', 'Wave', 1, 'Sting 5', { dmg: 5 }, 'Mist 7 Block', { block: 7 }],
  ['Tidal Push', 'Wave', 1, 'Shove 6 + Weaken', { dmg: 6, weak: 1 }, 'Shove 3 + Draw', { dmg: 3, draw: 1 }],
  ['White Cap', 'Wave', 0, 'Foam 4 Block', { block: 4 }, 'Sip 2 Heal', { heal: 2 }],
  ['Surge', 'Wave', 3, 'Crash 16', { dmg: 16 }, 'Crash 9 + Block 6', { dmg: 9, block: 6 }],
  ['Harbor Wall', 'Wave', 2, 'Wall 13 Block', { block: 13 }, 'Wall 7 + Heal 3', { block: 7, heal: 3 }],
  ['Kelp Snare', 'Wave', 1, 'Tangle: Weaken 2', { weak: 2 }, 'Tangle + Hit 4', { dmg: 4, weak: 1 }],
  ['Monsoon Edge', 'Wave', 2, 'Cut 10 + Expose', { dmg: 10, vuln: 1 }, 'Cut 6 + Draw', { dmg: 6, draw: 1 }],
  ['Moon Pull', 'Wave', 1, 'Pull 2 cards', { draw: 2 }, 'Pull + Hit 5', { dmg: 5 }],
  // ---- Storm (yellow): damage, strength, weakening ----
  ['Spark Jab', 'Storm', 0, 'Zap 4', { dmg: 4 }, 'Zap 2 + Draw', { dmg: 2, draw: 1 }],
  ['Thunder Clap', 'Storm', 2, 'Boom 12', { dmg: 12 }, 'Boom 7 + Weaken', { dmg: 7, weak: 1 }],
  ['Gale Slash', 'Storm', 1, 'Slash 6', { dmg: 6 }, 'Rage + Hit 3', { dmg: 3, str: 1 }],
  ['Lightning Rod', 'Storm', 1, 'Bolt 5 + Expose', { dmg: 5, vuln: 1 }, 'Rod 6 Block', { block: 6 }],
  ['Squall Line', 'Storm', 2, 'Rake 9 + Draw', { dmg: 9, draw: 1 }, 'Rake 6 + Rage', { dmg: 6, str: 1 }],
  ['Static Shield', 'Storm', 1, 'Charge 8 Block', { block: 8 }, 'Charge 4 + Rage', { block: 4, str: 1 }],
  ['Tempest Roar', 'Storm', 3, 'Roar 15 + Weaken', { dmg: 15, weak: 1 }, 'Roar 8 + Rage 2', { dmg: 8, str: 2 }],
  ['Rain Dagger', 'Storm', 1, 'Prick 7', { dmg: 7 }, 'Prick 4 + Draw', { dmg: 4, draw: 1 }],
  ['Cloud Burst', 'Storm', 0, 'Catch a card', { draw: 1 }, 'Drip 3', { dmg: 3 }],
  ['Storm Surge', 'Storm', 2, 'Slam 10', { dmg: 10 }, 'Slam 6 + Block 5', { dmg: 6, block: 5 }],
  ['Thunderhead', 'Storm', 2, 'Rage 2', { str: 2 }, 'Strike 8', { dmg: 8 }],
  ['Forked Bolt', 'Storm', 1, 'Bolt 5 + Expose', { dmg: 5, vuln: 1 }, 'Bolt 5 + Weaken', { dmg: 5, weak: 1 }],
  ['Eye of Storm', 'Storm', 3, 'Calm Hit 14 + Draw', { dmg: 14, draw: 1 }, 'Calm Heal 6 + Block 6', { heal: 6, block: 6 }],
  // ---- Coral (pink): healing and steady block ----
  ['Reef Mend', 'Coral', 1, 'Mend 6', { heal: 6 }, 'Mend 6 Block', { block: 6 }],
  ['Coral Spike', 'Coral', 1, 'Poke 6', { dmg: 6 }, 'Poke + Mend 3', { heal: 3 }],
  ['Anemone Kiss', 'Coral', 0, 'Kiss 3 Heal', { heal: 3 }, 'Kiss + Nip 2', { dmg: 2 }],
  ['Pearl Guard', 'Coral', 2, 'Pearl 12 Block', { block: 12 }, 'Pearl 5 + Mend 4', { block: 4, heal: 5 }],
  ['Blooming Strike', 'Coral', 1, 'Bloom 5 + Mend 3', { dmg: 5, heal: 3 }, 'Bloom 8', { dmg: 8 }],
  ['Tidepool Rest', 'Coral', 1, 'Rest 5 + Draw', { heal: 5, draw: 1 }, 'Rest 7 Block', { block: 7 }],
  ['Thorn Reef', 'Coral', 2, 'Thorn 9 + Weaken', { dmg: 9, weak: 1 }, 'Thorn Mend 6', { heal: 6 }],
  ['Shell Song', 'Coral', 0, 'Song 5 Block', { block: 5 }, 'Song 2 + Draw', { heal: 2, draw: 1 }],
  ['Coral Crown', 'Coral', 3, 'Crown Mend 10 + Rage', { heal: 10, str: 1 }, 'Crown 12', { dmg: 12 }],
  ['Lagoon Calm', 'Coral', 1, 'Calm 4 + Block 4', { heal: 4, block: 4 }, 'Calm Draw 2', { draw: 2 }],
  ['Sting Ray', 'Coral', 1, 'Sting 7 + Expose', { dmg: 7, vuln: 1 }, 'Sting Mend 4', { heal: 4 }],
  ['Reef Breaker', 'Coral', 2, 'Break 11', { dmg: 11 }, 'Break Mend 5 + Weaken', { heal: 5, weak: 1 }],
  ['Pink Tide', 'Coral', 2, 'Tide Mend 7 + Draw', { heal: 7, draw: 1 }, 'Tide 6 + Mend 3', { dmg: 6, heal: 3 }],
  // ---- Deep (purple): draws, exposure, weakening ----
  ['Abyss Gaze', 'Deep', 1, 'Stare 6 + Expose', { dmg: 6, vuln: 1 }, 'Stare Draw', { draw: 1 }],
  ['Dark Current', 'Deep', 2, 'Drag 10 + Draw', { dmg: 10, draw: 1 }, 'Drag 6 + Weaken', { dmg: 6, weak: 1 }],
  ['Lantern Fish', 'Deep', 0, 'Glow Draw', { draw: 1 }, 'Glow Nip 3', { dmg: 3 }],
  ['Pressure Drop', 'Deep', 2, 'Crush 12', { dmg: 12 }, 'Crush Weaken 2', { weak: 2 }],
  ['Whale Song', 'Deep', 1, 'Song Mend 4 + Draw', { heal: 4, draw: 1 }, 'Song 8 Block', { block: 8 }],
  ['Trench Dive', 'Deep', 1, 'Dive Draw 2', { draw: 2 }, 'Dive Hit 4', { dmg: 4 }],
  ['Ink Cloud', 'Deep', 1, 'Ink Weaken + Expose', { weak: 1, vuln: 1 }, 'Ink Hit 5', { dmg: 5 }],
  ['Leviathan Bite', 'Deep', 3, 'Bite 17', { dmg: 17 }, 'Bite 10 + Expose', { dmg: 10, vuln: 1 }],
  ['Cold Silence', 'Deep', 1, 'Hush 9 Block', { block: 9 }, 'Hush Weaken + Draw', { weak: 1, draw: 1 }],
  ['Deep Bargain', 'Deep', 0, 'Bargain Draw 2', { draw: 2 }, 'Bargain Hit 6', { dmg: 6 }],
  ['Siren Call', 'Deep', 2, 'Call Weaken 2 + Draw', { weak: 2, draw: 1 }, 'Call Hit 8', { dmg: 8 }],
  ['Midnight Drift', 'Deep', 1, 'Drift 5 + Draw', { dmg: 5, draw: 1 }, 'Drift 6 Block + Draw', { block: 6, draw: 1 }],
  ['Hollow Echo', 'Deep', 2, 'Echo 8 + Expose 2', { dmg: 8, vuln: 2 }, 'Echo Draw 2', { draw: 2 }],
];

export const CARD_POOL = ROWS.map((row, index) => ({
  id: index,
  name: row[0],
  suit: row[1],
  cost: row[2],
  aLabel: row[3],
  a: row[4],
  bLabel: row[5],
  b: row[6],
}));

export function cardByName(name) {
  return CARD_POOL.find((card) => card.name === name);
}

const STARTER_NAMES = [
  'Breaker Slam', 'Foam Guard', 'Crest Ride', 'Spark Jab', 'Gale Slash',
  'Reef Mend', 'Coral Spike', 'Abyss Gaze', 'Lantern Fish', 'Salt Spray',
];

export function startingDeck() {
  return STARTER_NAMES.map((name) => cardByName(name));
}

// Three distinct reward cards, never the ones already offered this time.
export function rewardChoices(rng, count) {
  const pool = rng.shuffle(CARD_POOL);
  return pool.slice(0, count);
}
