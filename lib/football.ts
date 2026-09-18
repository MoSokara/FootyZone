import "server-only";

import type { FootballApiResponse, Team } from "./types";

const API_URL = "https://v3.football.api-sports.io";
const DEFAULT_SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026);

function getKey() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  return key;
}

/**
 * Creates a gameplay rating from current-season league performance.
 * Metrics are calculated inside each league so the rating is comparable
 * across the five supported competitions without simply favoring one league.
 */
function calculateStrength(
  rank: number,
  points: number,
  played: number,
  goalsDiff: number,
  form: string | null,
  teamCount: number,
) {
  const positionScore =
    55 -
    ((Math.max(1, rank) - 1) / Math.max(1, teamCount - 1)) * 25;
  const pointsPerGame = played > 0 ? points / played : 0;
  const pointsScore = Math.min(12, Math.max(0, (pointsPerGame / 3) * 12));
  const goalDiffPerGame = played > 0 ? goalsDiff / played : 0;
  const goalScore = Math.min(6, Math.max(-3, goalDiffPerGame * 1.5));
  const formScore = form
    ? [...form].slice(-5).reduce(
        (score, result) =>
          score + (result === "W" ? 1.4 : result === "D" ? 0.2 : -1.1),
        0,
      )
    : 0;

  return Math.round(
    Math.min(
      99,
      Math.max(70, positionScore + pointsScore + goalScore + formScore),
    ),
  );
}

async function apiFetch<T>(path: string, revalidate = 3600): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "x-apisports-key": getKey() },
    next: { revalidate },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status}`);
  }

  const apiErrors = data?.errors;
  if (
    apiErrors &&
    ((Array.isArray(apiErrors) && apiErrors.length > 0) ||
      (!Array.isArray(apiErrors) && Object.keys(apiErrors).length > 0))
  ) {
    const message = Array.isArray(apiErrors)
      ? apiErrors.join("; ")
      : Object.values(apiErrors).filter(Boolean).join("; ");

    throw new Error(`API-Football: ${message || "request rejected"}`);
  }

  return data;
}

const EXPECTED_TEAM_COUNTS: Record<number, number> = {
  39: 20,
  140: 20,
  78: 18,
  135: 20,
  61: 18,
};

export async function getTeams(
  leagueIds: number[],
  season = DEFAULT_SEASON,
): Promise<Team[]> {
  if (!process.env.API_FOOTBALL_KEY) {
    throw new Error(
      "API_FOOTBALL_KEY is required to load the complete five-league team database.",
    );
  }

  const batches = await Promise.all(
    leagueIds.map(async (leagueId) => {
      const expectedCount = EXPECTED_TEAM_COUNTS[leagueId];

      if (!expectedCount) {
        throw new Error(`Unsupported league id: ${leagueId}.`);
      }

      const data = await apiFetch<any>(
        `/standings?league=${leagueId}&season=${season}`,
        3600,
      );
      const league = data.response?.[0]?.league;
      const table = (league?.standings ?? []).flat();

      if (table.length !== expectedCount) {
        throw new Error(
          `${league?.name ?? `League ${leagueId}`} returned ${table.length} teams; expected ${expectedCount}.`,
        );
      }

      const uniqueTeamIds = new Set(
        table.map((entry: any) => Number(entry.team?.id)).filter(Boolean),
      );

      if (uniqueTeamIds.size !== expectedCount) {
        throw new Error(
          `${league?.name ?? `League ${leagueId}`} contains duplicate or invalid team entries.`,
        );
      }

      return table.map((entry: any) => {
        const all = entry.all ?? {};
        const goals = all.goals ?? {};

        const rank = Number(entry.rank);
        const points = Number(entry.points);
        const played = Number(all.played);
        const wins = Number(all.win);
        const draws = Number(all.draw);
        const losses = Number(all.lose);
        const goalsFor = Number(goals.for);
        const goalsAgainst = Number(goals.against);
        const goalsDiff = Number(entry.goalsDiff);

        return {
          id: Number(entry.team.id),
          name: entry.team.name,
          logo: entry.team.logo,
          leagueId,
          league: league?.name ?? "Unknown League",
          country: league?.country ?? "Unknown",
          rank: Number.isFinite(rank) ? rank : null,
          points: Number.isFinite(points) ? points : null,
          form: entry.form ?? null,
          goalsDiff: Number.isFinite(goalsDiff) ? goalsDiff : null,
          played: Number.isFinite(played) ? played : null,
          wins: Number.isFinite(wins) ? wins : null,
          draws: Number.isFinite(draws) ? draws : null,
          losses: Number.isFinite(losses) ? losses : null,
          goalsFor: Number.isFinite(goalsFor) ? goalsFor : null,
          goalsAgainst: Number.isFinite(goalsAgainst) ? goalsAgainst : null,
          strength: calculateStrength(
            rank || expectedCount,
            points || 0,
            played || 0,
            goalsDiff || 0,
            entry.form ?? null,
            expectedCount,
          ),
        } satisfies Team;
      });
    }),
  );

  const allTeams = batches.flat();
  const expectedTotal = leagueIds.reduce(
    (total, leagueId) => total + EXPECTED_TEAM_COUNTS[leagueId],
    0,
  );

  if (allTeams.length !== expectedTotal) {
    throw new Error(
      `Expected ${expectedTotal} teams from the selected leagues but received ${allTeams.length}.`,
    );
  }

  return allTeams;
}

export async function getLiveFixtures() {
  return apiFetch<any>("/fixtures?live=all", 30);
}

export type { FootballApiResponse };
