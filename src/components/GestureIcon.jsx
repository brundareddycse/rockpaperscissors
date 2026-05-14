import { HandFist, HandPalm, Scissors, Question } from "@phosphor-icons/react";

const ICONS = {
  rock: HandFist,
  paper: HandPalm,
  scissors: Scissors,
};

const LABELS = {
  rock: "ROCK",
  paper: "PAPER",
  scissors: "SCISSORS",
};

export const GestureIcon = ({ move, size = 96, weight = "duotone", color }) => {
  const Icon = ICONS[move] || Question;
  return <Icon size={size} weight={weight} color={color} />;
};

export const gestureLabel = (move) => LABELS[move] || "—";
