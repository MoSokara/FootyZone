import type { Team } from "@/lib/types";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createDuel(teams: Team[]): [Team, Team] | null {
  if (teams.length < 2) return null;
  const [first, second] = shuffle(teams).slice(0, 2);
  return [first, second];
}

export function getDuelWinner(first: Team, second: Team): Team {
  return first.strength >= second.strength ? first : second;
}
