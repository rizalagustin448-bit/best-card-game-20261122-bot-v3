// Tiny WebAudio synth: no audio files, every sound is a few oscillators.
// The context starts on the first gesture, so loading the page stays silent.
export function createAudio() {
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }
  function tone(freq, dur, type, gain, slide) {
    const c = ensure();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slide) osc.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
      g.gain.setValueAtTime(gain || 0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(g).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch {
      // Sound is garnish: a failure here never stops the game.
    }
  }
  return {
    unlock() { ensure(); },
    playCard() { tone(520, 0.12, 'triangle', 0.07, 780); },
    hit() { tone(160, 0.18, 'sawtooth', 0.08, 70); },
    block() { tone(240, 0.1, 'square', 0.04, 180); },
    tide() { tone(660, 0.16, 'sine', 0.08, 990); tone(990, 0.2, 'sine', 0.06, 1320); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.08), i * 110)); },
    lose() { tone(220, 0.5, 'sawtooth', 0.06, 90); },
  };
}
