const MOVES = ["rock", "paper", "scissors"];

const COUNTER = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

export function createSmartAI() {
  const transitions = {
    rock: { rock: 0, paper: 0, scissors: 0 },
    paper: { rock: 0, paper: 0, scissors: 0 },
    scissors: { rock: 0, paper: 0, scissors: 0 },
  };

  const frequency = {
    rock: 0,
    paper: 0,
    scissors: 0,
  };

  const history = [];

  function record(playerMove) {
    if (!MOVES.includes(playerMove)) return;

    if (history.length > 0) {
      const prev = history[history.length - 1];
      transitions[prev][playerMove] += 1;
    }

    frequency[playerMove] += 1;
    history.push(playerMove);
  }

  function predict() {
    if (Math.random() < 0.15 || history.length === 0) {
      return MOVES[Math.floor(Math.random() * 3)];
    }

    const last = history[history.length - 1];
    const row = transitions[last];

    const total = row.rock + row.paper + row.scissors;

    let predicted;

    if (total >= 2) {
      predicted = MOVES.reduce((a, b) =>
        row[a] >= row[b] ? a : b
      );
    } else {
      predicted = MOVES.reduce((a, b) =>
        frequency[a] >= frequency[b] ? a : b
      );
    }

    return COUNTER[predicted];
  }

  function reset() {
    for (const m of MOVES) {
      frequency[m] = 0;

      for (const n of MOVES) {
        transitions[m][n] = 0;
      }
    }

    history.length = 0;
  }

  return { record, predict, reset };
}

export function judge(playerMove, aiMove) {
  if (playerMove === aiMove) return "tie";

  if (COUNTER[playerMove] === aiMove) {
    return "lose";
  }

  return "win";
}
