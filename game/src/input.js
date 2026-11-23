// Pointer and keyboard input. Clicks are queued with their logical
// coordinates (the renderer converts client pixels), keys are queued as
// codes; the loop takes each queue once, so a press is never lost or
// counted twice. Keys: 1–7 pick a hand card, A/B pick its mode,
// Space ends the turn, T toggles TOSS, R ripples, Enter confirms.
export function createInput(canvas, toLogical) {
  const clicks = [];
  const keys = [];
  const mouse = { x: 640, y: 400 };

  canvas.addEventListener('pointermove', (event) => {
    const p = toLogical(event.clientX, event.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = toLogical(event.clientX, event.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    clicks.push({ x: p.x, y: p.y });
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.push(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  });
  window.addEventListener('blur', () => { clicks.length = 0; keys.length = 0; });

  return {
    mouse,
    takeClicks() { return clicks.splice(0, clicks.length); },
    takeKeys() { return keys.splice(0, keys.length); },
  };
}
