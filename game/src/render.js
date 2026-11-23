// Drawing only: the game state in, pixels out. The 1280x800 table is
// scaled to the window. The hand is FANNED (tilted, overlapping arcs),
// the selected card lifts and glows in its suit colour, damage numbers
// float, the life bar shakes on a hit, and the energy pool is one big
// orb in the middle of the table — all readable in a still screenshot.
// `layout(state)` returns the same rectangles the renderer draws, so
// the main loop hit-tests exactly what the player sees.
import { CARD_H, CARD_W, FONT, SUITS, SUIT_NAMES, TABLE, VIEW_H, VIEW_W } from './config.js';
import { currentIntent, currentPattern } from './engine.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_REWARD = 'reward';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, frac, fill, back) {
  ctx.fillStyle = back;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

export function handLayout(state, hover) {
  const n = state.hand.length;
  const mid = (n - 1) / 2;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const d = i - mid;
    let x = 640 + d * 158;
    let y = 596 + Math.abs(d) * 13;
    let rot = d * 0.085;
    if (i === state.selected) { y -= 40; rot = 0; }
    else if (i === hover) { y -= 26; rot *= 0.4; }
    out.push({ index: i, x, y, w: CARD_W, h: CARD_H, rot });
  }
  return out;
}

export function layout(state, hover) {
  const cards = state.screen === 'play' ? handLayout(state, hover) : [];
  const buttons = {};
  if (state.screen === 'play') {
    buttons.endTurn = { x: 892, y: 396, w: 196, h: 58 };
    buttons.ripple = { x: 36, y: 140, w: 196, h: 58 };
    buttons.toss = { x: 36, y: 210, w: 196, h: 58 };
  }
  if (state.screen === 'reward' && state.reward) {
    buttons.rewardCards = state.reward.cards.map((c, i) => ({
      index: i, x: 430 + i * 190, y: 250, w: CARD_W, h: CARD_H, rot: 0,
    }));
    if (state.reward.relics) {
      buttons.rewardRelics = state.reward.relics.map((r, i) => ({
        index: i, x: 390 + i * 300, y: 560, w: 280, h: 90,
      }));
    }
  }
  return { cards, buttons };
}

function pointIn(r, x, y) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function hitCard(cards, x, y) {
  // Topmost card wins: test from the last (rightmost) card backwards.
  for (let i = cards.length - 1; i >= 0; i -= 1) {
    const c = cards[i];
    const dx = x - c.x;
    const dy = y - c.y;
    const cos = Math.cos(-c.rot);
    const sin = Math.sin(-c.rot);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if (Math.abs(lx) <= c.w / 2 && Math.abs(ly) <= c.h / 2) return c.index;
  }
  return -1;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = size + (weight || '');
    if (!fonts.has(key)) fonts.set(key, `${weight || ''} ${size}px ${FONT}`);
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
    view.x = (canvas.width - VIEW_W * view.scale) / 2;
    view.y = (canvas.height - VIEW_H * view.scale) / 2;
  }
  function toLogical(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const px = (cx - rect.left) * (canvas.width / rect.width);
    const py = (cy - rect.top) * (canvas.height / rect.height);
    return { x: (px - view.x) / view.scale, y: (py - view.y) / view.scale };
  }

  function drawSea(t) {
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, TABLE.seaTop);
    grad.addColorStop(1, TABLE.seaBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.10)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 5; row += 1) {
      ctx.beginPath();
      for (let x = 0; x <= VIEW_W; x += 16) {
        const y = 90 + row * 150 + Math.sin(x / 180 + t * 0.6 + row * 2) * 12;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = TABLE.felt;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(640, 430, 560, 300, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawCardAt(card, x, y, rot, selected, mode) {
    const suit = SUITS[card.suit];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (selected) {
      ctx.shadowColor = suit.color;
      ctx.shadowBlur = 34;
    }
    ctx.fillStyle = '#0b2233';
    rr(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeStyle = selected ? suit.color : 'rgba(148, 210, 235, 0.4)';
    ctx.stroke();
    // Suit banner
    ctx.fillStyle = suit.dark;
    rr(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, 52, 14);
    ctx.fill();
    ctx.fillRect(-CARD_W / 2, -CARD_H / 2 + 38, CARD_W, 14);
    ctx.fillStyle = suit.color;
    ctx.beginPath();
    ctx.arc(0, -CARD_H / 2 + 62, 30, 0, Math.PI * 2);
    ctx.fill();
    text(suit.glyph, 0, -CARD_H / 2 + 74, 34, '#04121e', 'center', 'bold');
    text(card.name, 0, -CARD_H / 2 + 112, 17, TABLE.ink, 'center', 'bold');
    text(card.suit, 0, -CARD_H / 2 + 134, 13, suit.color, 'center', 'bold');
    // Two modes, A on top, B below; the chosen mode glows.
    const aOn = !selected || mode === 'A';
    const bOn = !selected || mode === 'B';
    ctx.globalAlpha = aOn ? 1 : 0.45;
    text('A · ' + card.aLabel, 0, -CARD_H / 2 + 162, 13.5, TABLE.ink, 'center');
    ctx.globalAlpha = bOn ? 1 : 0.45;
    text('B · ' + card.bLabel, 0, -CARD_H / 2 + 184, 13.5, TABLE.ink, 'center');
    ctx.globalAlpha = 1;
    // Cost orb
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-CARD_W / 2 + 20, -CARD_H / 2 + 20, 17, 0, Math.PI * 2);
    ctx.fill();
    text(String(card.cost), -CARD_W / 2 + 20, -CARD_H / 2 + 26, 20, '#231303', 'center', 'bold');
    ctx.restore();
  }

  function drawButton(r, label, sub, enabled, accent) {
    ctx.fillStyle = enabled ? (accent || 'rgba(8, 47, 73, 0.95)') : 'rgba(30, 41, 59, 0.7)';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = enabled ? TABLE.gold : 'rgba(148, 163, 184, 0.4)';
    ctx.stroke();
    text(label, r.x + r.w / 2, r.y + (sub ? 26 : 36), 19, enabled ? TABLE.ink : '#94a3b8', 'center', 'bold');
    if (sub) text(sub, r.x + r.w / 2, r.y + 46, 13, TABLE.dim, 'center');
  }

  function drawBoss(state, t) {
    const boss = state.boss;
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.fillStyle = boss.def.color;
    ctx.beginPath();
    ctx.arc(640, 138, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#04121e';
    ctx.beginPath();
    ctx.arc(640, 138, 62, 0, Math.PI * 2);
    ctx.fill();
    text(boss.def.glyph, 640, 162, 52, boss.def.color, 'center');
    text(boss.def.name, 640, 238, 30, TABLE.ink, 'center', 'bold');
    text(boss.def.title, 640, 262, 15, TABLE.dim, 'center');
    bar(ctx, 440, 272, 400, 22, boss.hp / boss.maxHp, '#ef4444', 'rgba(15, 23, 42, 0.9)');
    ctx.strokeStyle = 'rgba(148, 210, 235, 0.5)';
    ctx.lineWidth = 1.5;
    rr(ctx, 440, 272, 400, 22, 11);
    ctx.stroke();
    text(`${boss.hp} / ${boss.maxHp}`, 640, 288, 15, '#fff', 'center', 'bold');
    let chipX = 860;
    if (boss.block > 0) { text(`🛡 ${boss.block}`, chipX, 288, 15, '#7dd3fc', 'left', 'bold'); chipX += 70; }
    if (boss.str > 0) { text(`⚔ +${boss.str}`, chipX, 288, 15, '#fde047', 'left', 'bold'); chipX += 70; }
    if (boss.weak > 0) { text(`💜 Weak ${boss.weak}`, chipX, 288, 15, '#c4b5fd', 'left', 'bold'); chipX += 90; }
    if (boss.vuln > 0) { text(`💗 Exposed ${boss.vuln}`, chipX, 288, 15, '#f0abfc', 'left', 'bold'); }
    // Intent banner: the readable plan, with the pattern name.
    const intent = currentIntent(state);
    const pattern = currentPattern(state);
    const kindColor = intent.kind === 'attack' ? '#f87171' : intent.kind === 'block' ? '#7dd3fc' : intent.kind === 'buff' ? '#fde047' : '#c4b5fd';
    ctx.fillStyle = 'rgba(4, 24, 38, 0.9)';
    rr(ctx, 916, 84, 320, 96, 12);
    ctx.fill();
    ctx.strokeStyle = kindColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('NEXT · ' + pattern.name.toUpperCase(), 1076, 112, 14, kindColor, 'center', 'bold');
    text(intent.text, 1076, 142, 19, TABLE.ink, 'center', 'bold');
    text('RIPPLE shifts the pattern', 1076, 166, 12, TABLE.dim, 'center');
    ctx.restore();
  }

  function drawPlayerPanel(state) {
    const p = state.player;
    ctx.fillStyle = TABLE.panel;
    rr(ctx, 36, 560, 300, 196, 14);
    ctx.fill();
    ctx.strokeStyle = TABLE.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text('YOU · THE DIVER', 56, 592, 15, TABLE.gold, 'left', 'bold');
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    bar(ctx, 56 + shakeX, 606, 260, 24, p.hp / p.maxHp, '#22c55e', 'rgba(15, 23, 42, 0.9)');
    text(`${p.hp} / ${p.maxHp} HP`, 186, 623, 15, '#fff', 'center', 'bold');
    let y = 662;
    if (p.block > 0) { text(`🛡 Block ${p.block}`, 56, y, 16, '#7dd3fc', 'left', 'bold'); y += 26; }
    if (p.str > 0) { text(`⚔ Strength +${p.str}`, 56, y, 16, '#fde047', 'left', 'bold'); y += 26; }
    if (p.weak > 0) { text(`💜 Weak ${p.weak}`, 56, y, 16, '#c4b5fd', 'left', 'bold'); y += 26; }
    if (p.vuln > 0) { text(`💗 Exposed ${p.vuln}`, 56, y, 16, '#f0abfc', 'left', 'bold'); y += 26; }
    text(`Deck ${state.drawPile.length} · Discard ${state.discardPile.length}`, 56, 742, 13, TABLE.dim, 'left');
  }

  function drawEnergy(state) {
    const pulse = 1 + Math.sin(performance.now() / 500) * 0.03;
    const r = 46 * pulse;
    const grad = ctx.createRadialGradient(640 - 12, 405 - 14, 6, 640, 405, r);
    grad.addColorStop(0, '#fef3c7');
    grad.addColorStop(0.55, '#fbbf24');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(640, 405, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fef3c7';
    ctx.stroke();
    text(String(state.energy), 640, 421, 42, '#451a03', 'center', 'bold');
    text('ENERGY', 700, 398, 13, TABLE.gold, 'left', 'bold');
    text(`${state.energy} / ${state.maxEnergy}`, 700, 420, 15, TABLE.ink, 'left', 'bold');
  }

  function drawTideRow(state) {
    let x = 440;
    text('TIDE — play 2 of a suit:', 440, 312, 13, TABLE.dim, 'left');
    for (const name of SUIT_NAMES) {
      const suit = SUITS[name];
      const count = state.suitsThisTurn[name] || 0;
      const done = !!state.tideDone[name];
      ctx.fillStyle = done ? suit.color : 'rgba(15, 23, 42, 0.85)';
      rr(ctx, x, 318, 96, 30, 8);
      ctx.fill();
      ctx.strokeStyle = suit.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(`${suit.glyph} ${name} ${count}/2`, x + 48, 339, 13, done ? '#04121e' : TABLE.ink, 'center', 'bold');
      x += 104;
    }
  }

  function drawFloats(state) {
    for (const f of state.floats) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.font = `bold 30px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(2, 10, 20, 0.9)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlay(state, lay, t) {
    drawBoss(state, t);
    drawTideRow(state);
    drawPlayerPanel(state);
    drawEnergy(state);
    const b = lay.buttons;
    drawButton(b.endTurn, 'END TURN', 'Space', true, 'rgba(8, 47, 73, 0.95)');
    drawButton(b.ripple, '⟳ RIPPLE', state.relics.some((r) => r.flag === 'freeRipple') && state.ripplesUsed === 0 ? 'FREE this duel' : '1 energy · shift intent', state.energy >= 1 || (state.relics.some((r) => r.flag === 'freeRipple') && state.ripplesUsed === 0));
    drawButton(b.toss, state.tossMode ? 'TOSS: PICK A CARD' : '✂ TOSS A CARD', '+1 energy · discard', true);
    // How to play, top-left where the table is empty.
    text('Click a card to lift it — click its A line or B line to play it.', 36, 88, 14, TABLE.ink, 'left');
    text('1–7 select · A/B play · T toss · R ripple · Space end turn', 36, 110, 14, TABLE.dim, 'left');
    // Relic strip, under the intent banner.
    if (state.relics.length > 0) {
      text('RELICS', 916, 212, 12, TABLE.gold, 'left', 'bold');
      state.relics.forEach((r, i) => text('◆ ' + r.name, 916, 234 + i * 20, 13, TABLE.ink, 'left'));
    }
    for (const c of lay.cards) {
      const held = state.hand[c.index];
      drawCardAt(held.def, c.x, c.y, c.rot, c.index === state.selected, state.mode);
    }
    // Log lines
    ctx.globalAlpha = 0.85;
    state.log.slice(0, 2).forEach((line, i) => text(line, 36, 36 + i * 20, 14, TABLE.dim, 'left'));
    ctx.globalAlpha = 1;
    drawFloats(state);
  }

  function drawTitle(state, t) {
    ctx.fillStyle = 'rgba(2, 12, 22, 0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text('🌊 TIDEBREAKER 🌊', 640, 210, 84, '#7dd3fc', 'center', 'bold');
    text('5 tide-lords · 52 cards · 14 relics · 3 acts', 640, 262, 26, TABLE.gold, 'center', 'bold');
    text('A deck-builder duel on the open sea. Every card has two modes.', 640, 306, 19, TABLE.ink, 'center');
    text('Play 2 cards of one suit to fire its Tide bonus. Read the lord’s intent —', 640, 336, 19, TABLE.ink, 'center');
    text('then RIPPLE it away, or TOSS a card for the energy to answer it.', 640, 366, 19, TABLE.ink, 'center');
    let x = 340;
    for (const name of SUIT_NAMES) {
      const suit = SUITS[name];
      ctx.fillStyle = suit.dark;
      rr(ctx, x, 400, 140, 74, 10);
      ctx.fill();
      text(suit.glyph + ' ' + name, x + 70, 430, 18, suit.color, 'center', 'bold');
      text(suit.bonusText, x + 70, 456, 14, TABLE.ink, 'center');
      x += 160;
    }
    text('CLICK OR PRESS SPACE TO SET SAIL', 640, 560, 26, '#fef3c7', 'center', 'bold');
    text('Mouse + keyboard · 1–7 cards · A/B modes · Space end turn · T toss · R ripple', 640, 610, 15, TABLE.dim, 'center');
    text('Best run: ' + state.wins + ' tide-lord' + (state.wins === 1 ? '' : 's') + ' drowned', 640, 650, 15, TABLE.dim, 'center');
  }

  function drawReward(state, lay) {
    ctx.fillStyle = 'rgba(2, 12, 22, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text('⚓ LORD FALLEN ⚓', 640, 120, 44, TABLE.gold, 'center', 'bold');
    text('Choose 1 card to add to your deck', 640, 158, 20, TABLE.ink, 'center');
    for (const c of lay.buttons.rewardCards) {
      drawCardAt(state.reward.cards[c.index], c.x + CARD_W / 2, c.y + CARD_H / 2, 0, false, 'A');
    }
    if (state.reward.relics) {
      text('…and a relic to bend the rules', 640, 540, 20, TABLE.ink, 'center');
      for (const r of lay.buttons.rewardRelics) {
        const relic = state.reward.relics[r.index];
        ctx.fillStyle = 'rgba(8, 47, 73, 0.95)';
        rr(ctx, r.x, r.y, r.w, r.h, 12);
        ctx.fill();
        ctx.strokeStyle = TABLE.gold;
        ctx.lineWidth = 2;
        ctx.stroke();
        text('◆ ' + relic.name, r.x + r.w / 2, r.y + 34, 19, TABLE.gold, 'center', 'bold');
        text(relic.text, r.x + r.w / 2, r.y + 62, 13, TABLE.ink, 'center');
      }
    }
  }

  function drawEnd(state, won) {
    ctx.fillStyle = won ? 'rgba(20, 40, 8, 0.55)' : 'rgba(10, 4, 20, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const s = state.stats;
    const statsLine = `Duels won ${s.bosses} · Turns ${s.turns} · Cards played ${s.played} · Tides fired ${s.tides} · Damage dealt ${s.damage}`;
    if (won) {
      // Gold rays fanning out behind the crown.
      ctx.strokeStyle = 'rgba(251,191,36,0.35)';
      ctx.lineWidth = 6;
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(640 + Math.cos(a) * 96, 260 + Math.sin(a) * 96);
        ctx.lineTo(640 + Math.cos(a) * 150, 260 + Math.sin(a) * 150);
        ctx.stroke();
      }
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(640, 260, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(640, 260, 92, 0, Math.PI * 2);
      ctx.fill();
      text('👑', 640, 292, 72, '#fbbf24', 'center');
      text('THE TIDE IS YOURS', 640, 430, 58, '#fde68a', 'center', 'bold');
      text(`${s.bosses} / 5 TIDE-LORDS DROWNED`, 640, 470, 30, '#fbbf24', 'center', 'bold');
      text(statsLine, 640, 505, 18, TABLE.ink, 'center');
      text('PRESS SPACE OR CLICK TO SAIL AGAIN', 640, 560, 22, '#fef3c7', 'center', 'bold');
    } else {
      // Anchor drawn with strokes only (no emoji — stays legible anywhere).
      ctx.fillStyle = 'rgba(8, 4, 18, 0.9)';
      ctx.beginPath();
      ctx.arc(640, 210, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b7cc8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(640, 210, 92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(640, 148, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(640, 162);
      ctx.lineTo(640, 262);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(598, 182);
      ctx.lineTo(682, 182);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(640, 262);
      ctx.quadraticCurveTo(600, 258, 592, 224);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(640, 262);
      ctx.quadraticCurveTo(680, 258, 688, 224);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(592, 224);
      ctx.lineTo(580, 238);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(688, 224);
      ctx.lineTo(700, 238);
      ctx.stroke();
      text('SWALLOWED BY THE DEEP', 640, 380, 56, '#c4b5fd', 'center', 'bold');
      text(`${state.boss ? state.boss.def.name : 'The sea'} keeps the diver.`, 640, 410, 20, TABLE.ink, 'center');
      text('The tide takes back its own.', 640, 438, 20, TABLE.ink, 'center');
      text(statsLine, 640, 478, 18, TABLE.ink, 'center');
      text(`FELL TO ${state.boss ? state.boss.def.name.toUpperCase() : 'THE SEA'} — DUEL ${state.bossIndex + 1} OF 5`, 640, 516, 26, '#c4b5fd', 'center', 'bold');
      text('PRESS SPACE OR CLICK TO SAIL AGAIN', 640, 560, 22, '#fef3c7', 'center', 'bold');
    }
  }

  function draw(state, screen, hover, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#03101d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawSea(t);
    if (screen === SCREEN_TITLE) { drawTitle(state, t); return; }
    if (screen === SCREEN_WIN) { drawEnd(state, true); return; }
    if (screen === SCREEN_LOSE) { drawEnd(state, false); return; }
    if (screen === SCREEN_REWARD) { drawReward(state, layout(state, -1)); return; }
    const lay = layout(state, hover);
    drawPlay(state, lay, t);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical, view, pointIn, hitCard, layout };
}
