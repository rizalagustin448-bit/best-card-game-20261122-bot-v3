// The five tide-lords, one per duel, in three acts. Each lord carries
// 2–3 PATTERNS that take turns each round: the intent banner always shows
// what the current pattern will do next, so reading the lord is a skill —
// and RIPPLE lets the player pay energy to shove the lord onto another
// pattern. An intent is {kind, value, text}: attack, block, buff or hex.
export const BOSSES = [
  {
    name: 'Gull King Raka', title: 'Act I · Lord of the Shallows', hp: 42,
    color: '#7dd3fc', glyph: '~',
    patterns: [
      { name: 'Peck', intent: { kind: 'attack', value: 6, text: 'Peck for 6' } },
      { name: 'Squall Cry', intent: { kind: 'attack', value: 4, text: 'Cry 4 + Weaken' } },
      { name: 'Feather Guard', intent: { kind: 'block', value: 8, text: 'Guard 8 Block' } },
    ],
  },
  {
    name: 'Reef Witch Sari', title: 'Act I · Witch of the Coral Maze', hp: 58,
    color: '#fb7185', glyph: '❋',
    patterns: [
      { name: 'Thorn Lash', intent: { kind: 'attack', value: 8, text: 'Lash for 8' } },
      { name: 'Bloom', intent: { kind: 'block', value: 10, text: 'Bloom 10 Block + Heal 6' } },
      { name: 'Hex Tide', intent: { kind: 'hex', value: 2, text: 'Hex: Weaken 2' } },
    ],
  },
  {
    name: 'Storm Herald Bara', title: 'Act II · Herald of the Gale', hp: 74,
    color: '#facc15', glyph: '⚡',
    patterns: [
      { name: 'Gale Cut', intent: { kind: 'attack', value: 10, text: 'Cut for 10' } },
      { name: 'Charge the Sky', intent: { kind: 'buff', value: 3, text: 'Charge: +3 Strength' } },
      { name: 'Cloud Wall', intent: { kind: 'block', value: 12, text: 'Wall 12 Block' } },
    ],
  },
  {
    name: 'The Abyssal Choir', title: 'Act II · Voices from the Trench', hp: 88,
    color: '#a78bfa', glyph: '◉',
    patterns: [
      { name: 'Dirge', intent: { kind: 'attack', value: 12, text: 'Dirge for 12' } },
      { name: 'Drowning Hymn', intent: { kind: 'attack', value: 6, text: 'Hymn 6 + Frail' } },
      { name: 'Swell', intent: { kind: 'block', value: 14, text: 'Swell 14 Block + Rage 2' } },
    ],
  },
  {
    name: 'The Tide-Lord Maras', title: 'Act III · The Tide Itself', hp: 112,
    color: '#34d399', glyph: '🌊',
    patterns: [
      { name: 'Tsunami', intent: { kind: 'attack', value: 16, text: 'Tsunami for 16' } },
      { name: 'Maelstrom', intent: { kind: 'attack', value: 8, text: 'Maelstrom 8 + Weaken 2' } },
      { name: 'Crown of Foam', intent: { kind: 'block', value: 18, text: 'Crown 18 Block + Rage 3' } },
    ],
  },
];

export function actOf(bossIndex) {
  return bossIndex < 2 ? 1 : bossIndex < 4 ? 2 : 3;
}
