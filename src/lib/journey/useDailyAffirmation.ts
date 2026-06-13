import { useState } from "react";

const LAST_THOUGHT_KEY = "mabuhai-last-kind-thought";

export const KIND_THOUGHTS = [
  "You do not have to solve the whole day at once.",
  "Small steps still move you forward.",
  "Rest is part of the work, not a reward for finishing it.",
  "You are allowed to take things one breath at a time.",
  "Your pace does not need to match anyone else's.",
  "A difficult moment does not define the rest of your day.",
  "Showing up gently still counts as showing up.",
  "You can begin again without judging where you paused.",
  "One unfinished task does not erase everything you completed.",
  "You deserve the same patience you offer other people.",
  "It is okay if today asks for a smaller version of your plan.",
  "Your worth is not measured by your productivity.",
  "Taking a break can be a thoughtful decision.",
  "You can care about your goals without being unkind to yourself.",
  "Not knowing the next step does not mean you are stuck forever.",
  "You have permission to make room for how you really feel.",
  "Progress can be quiet and still be real.",
  "You are more than one grade, deadline, or difficult week.",
  "A slow day can still be a meaningful day.",
  "You can ask for help before things become overwhelming.",
  "Your feelings can be present without making every decision.",
  "Doing what you can today is enough for today.",
  "There is no shame in needing more time.",
  "You can pause without losing your direction.",
  "A gentle choice is still a strong choice.",
  "You do not need perfect focus to make a little progress.",
  "Even uncertain days can hold one steady moment.",
  "You are allowed to celebrate effort, not only outcomes.",
  "The next step can be small, simple, and yours.",
  "You are learning how to care for yourself as you go.",
] as const;

function pickThought(): string {
  if (typeof window === "undefined") return KIND_THOUGHTS[0];

  let previous = "";
  try {
    previous = window.sessionStorage.getItem(LAST_THOUGHT_KEY) ?? "";
  } catch {
    // Storage may be unavailable in private browsing contexts.
  }

  const choices = KIND_THOUGHTS.filter((thought) => thought !== previous);
  const thought = choices[Math.floor(Math.random() * choices.length)] ?? KIND_THOUGHTS[0];

  try {
    window.sessionStorage.setItem(LAST_THOUGHT_KEY, thought);
  } catch {
    // A fresh thought can still be shown without persistence.
  }

  return thought;
}

export function useDailyAffirmation(enabled: boolean = true) {
  const [text] = useState(() => (enabled ? pickThought() : KIND_THOUGHTS[0]));

  return {
    text,
    loading: false,
    date: new Date().toISOString().slice(0, 10),
  };
}
