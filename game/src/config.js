// Shared numbers and looks: every suit's colour, shape and tide bonus,
// the table size, and the tuning knobs the engine and renderer both read.
export const VIEW_W = 1280;
export const VIEW_H = 800;

export const SUITS = {
  Wave: { color: '#38bdf8', dark: '#075985', glyph: '~', bonus: 'Block', bonusText: '+6 Block' },
  Storm: { color: '#facc15', dark: '#854d0e', glyph: '⚡', bonus: 'Strength', bonusText: '+3 Strength' },
  Coral: { color: '#fb7185', dark: '#881337', glyph: '❋', bonus: 'Heal', bonusText: 'Heal 4' },
  Deep: { color: '#a78bfa', dark: '#4c1d95', glyph: '◉', bonus: 'Draw', bonusText: 'Draw 2' },
};
export const SUIT_NAMES = Object.keys(SUITS);

export const PLAYER_MAX_HP = 60;
export const HAND_SIZE = 5;
export const BASE_ENERGY = 3;
export const TIDE_NEED = 2;

export const TABLE = {
  seaTop: '#06283d',
  seaBottom: '#03101d',
  felt: '#0b3d2e',
  gold: '#fbbf24',
  ink: '#e8f4f8',
  dim: '#9db8c4',
  panel: 'rgba(4, 24, 38, 0.88)',
  line: 'rgba(148, 210, 235, 0.35)',
};

export const CARD_W = 148;
export const CARD_H = 200;
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
