// Fourteen relics. Each one bends exactly one rule — a small permanent
// twist the player carries for the rest of the run. Relics are offered
// after the 2nd and 4th lords (pick 1 of 2), and a few are also found
// after the 1st lord. `flag` is the key the engine checks.
export const RELICS = [
  { id: 'coral-heart', name: 'Coral Heart', flag: 'turnHeal', text: 'Heal 2 at the start of every turn.' },
  { id: 'storm-lantern', name: 'Storm Lantern', flag: 'firstTurnEnergy', text: '+1 energy on the first turn of each duel.' },
  { id: 'deep-anchor', name: 'Deep Anchor', flag: 'startBlock', text: 'Begin each duel with 8 Block.' },
  { id: 'wave-charm', name: 'Wave Charm', flag: 'tideStrong', text: 'Tide bonuses are stronger: Wave +9, Storm +4, Coral heals 6, Deep draws 3.' },
  { id: 'gull-feather', name: 'Gull Feather', flag: 'extraDraw', text: 'Draw 1 extra card every turn.' },
  { id: 'salt-compass', name: 'Salt Compass', flag: 'freeRipple', text: 'The first RIPPLE of each duel is free.' },
  { id: 'pearl-tides', name: 'Pearl of Tides', flag: 'winHeal', text: 'Heal 6 after winning a duel.' },
  { id: 'kraken-ink', name: 'Kraken Ink', flag: 'firstHit', text: 'Your first attack each turn deals +4.' },
  { id: 'shell-shield', name: 'Shell Shield', flag: 'maxHp', text: 'Max HP +12, and heal 12 at once.' },
  { id: 'tempest-coin', name: 'Tempest Coin', flag: 'tideEnergy', text: 'Gain 1 energy whenever a Tide bonus fires.' },
  { id: 'siren-song', name: 'Siren Song', flag: 'bossWeak', text: 'Each lord starts the duel Weakened 2.' },
  { id: 'moon-tide', name: 'Moon Tide', flag: 'firstTurnDraw', text: 'Draw 2 extra cards on the first turn of each duel.' },
  { id: 'ember-coral', name: 'Ember Coral', flag: 'coralStrong', text: 'Coral cards heal 2 more.' },
  { id: 'leviathan-scale', name: 'Leviathan Scale', flag: 'keepBlock', text: 'Keep half your Block when a turn ends.' },
];

export function relicChoices(rng, owned, count) {
  const pool = rng.shuffle(RELICS.filter((r) => !owned.some((o) => o.id === r.id)));
  return pool.slice(0, count);
}
