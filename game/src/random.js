// A tiny seeded random source so a seed always replays the same run:
// mulberry32, plus shuffle and pick helpers the engine uses for draws.
export function createRandom(seed) {
  let a = seed >>> 0;
  function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function int(n) { return Math.floor(next() * n); }
  function pick(list) { return list[int(list.length)]; }
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = int(i + 1);
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }
  return { next, int, pick, shuffle };
}
