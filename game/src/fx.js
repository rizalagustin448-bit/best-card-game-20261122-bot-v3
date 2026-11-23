// Floating damage numbers and screen shake: the juice that makes a hit
// read in a still screenshot — the number hangs in the air, the life bar
// shakes while it lands.
export function createFx() {
  return { shake: 0 };
}

export function updateFx(state, dt) {
  for (let i = state.floats.length - 1; i >= 0; i -= 1) {
    const f = state.floats[i];
    f.life -= dt * 0.9;
    f.y -= dt * 46;
    if (f.life <= 0) state.floats.splice(i, 1);
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
}
