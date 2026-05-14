let ctx = null;

function ac() {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AC) return null;

    ctx = new AC();
  }

  return ctx;
}

function beep(
  freq,
  duration = 0.12,
  type = "square",
  volume = 0.15
) {
  const a = ac();

  if (!a) return;

  const osc = a.createOscillator();
  const gain = a.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.value = volume;

  osc.connect(gain);
  gain.connect(a.destination);

  const now = a.currentTime;

  osc.start(now);

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + duration
  );

  osc.stop(now + duration);
}

export const sfx = {
  tick: () =>
    beep(660, 0.08, "square", 0.12),

  shoot: () =>
    beep(880, 0.22, "sawtooth", 0.2),
};
