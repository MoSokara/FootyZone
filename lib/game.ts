export type DraftMode = "challenge" | "normal";

type ChallengeKind = "close" | "medium" | "wide";

const CHALLENGE_KINDS: ChallengeKind[] = ["close", "medium", "wide"];

const CLOSE_BANDS = [
  { min: 70, max: 73 },
  { min: 80, max: 83 },
  { min: 85, max: 88 },
];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

export function generateNormalPair<T extends { strength: number }>(teams: T[]) {
  const candidates = teams.filter((team) => team.strength >= 85 && team.strength <= 96);
  const pairs: Array<[T, T]> = [];

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      if (Math.abs(candidates[i].strength - candidates[j].strength) <= 2) {
        pairs.push([candidates[i], candidates[j]]);
      }
    }
  }

  return pairs.length ? randomItem(pairs) : null;
}

export function generateChallengePair<T extends { strength: number }>(teams: T[]) {
  const pairsByKind: Record<ChallengeKind, Array<[T, T]>> = {
    close: [],
    medium: [],
    wide: [],
  };

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const first = teams[i];
      const second = teams[j];
      const low = Math.min(first.strength, second.strength);
      const high = Math.max(first.strength, second.strength);
      const gap = high - low;

      if (CLOSE_BANDS.some((band) => low >= band.min && high <= band.max)) {
        pairsByKind.close.push([first, second]);
      } else if (gap >= 4 && gap <= 8) {
        pairsByKind.medium.push([first, second]);
      } else if (gap >= 9) {
        pairsByKind.wide.push([first, second]);
      }
    }
  }

  const availableKinds = CHALLENGE_KINDS.filter((kind) => pairsByKind[kind].length > 0);
  if (!availableKinds.length) return null;

  const kind = randomItem(availableKinds);
  return randomItem(pairsByKind[kind]);
}
