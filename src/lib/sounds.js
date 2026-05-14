let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;

    if (!AC) return null;

    ctx = new AC();
  }

  return ctx;
}

function beep(freq, duration = 0.12, type = "square", volume = 0.15) {
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
  tick: () => beep(660, 0.08, "square", 0.12),

  shoot: () => beep(880, 0.22, "sawtooth", 0.2),

  win: () => {
    beep(523, 0.1);

    setTimeout(() => beep(659, 0.1), 110);

    setTimeout(() => beep(784, 0.18), 220);
  },

  lose: () => {
    beep(330, 0.14, "sawtooth", 0.18);

    setTimeout(() => beep(220, 0.22, "sawtooth", 0.18), 150);
  },

  tie: () => beep(440, 0.16, "triangle", 0.15),

  matchWin: () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(
        () => beep(f, 0.16, "square", 0.18),
        i * 120
      )
    );
  },

  matchLose: () => {
    [392, 330, 262, 196].forEach((f, i) =>
      setTimeout(
        () => beep(f, 0.2, "sawtooth", 0.18),
        i * 150
      )
    );
  },
};
