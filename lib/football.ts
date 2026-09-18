import "server-only";

import type { FootballApiResponse, Team } from "./types";
import { FALLBACK_TEAMS } from "./fallback-teams";

const API_URL = "https://v3.football.api-sports.io";
const DEFAULT_SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026);

function getKey() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  return key;
}

/**
 * Creates a gameplay rating from the current league table.
 * It deliberately normalizes each metric inside its own league so clubs from
 * different top-five leagues can be drafted without one league being favored.
 */
function calculateStrength(
  rank: number | null,
  points: number | null,
  played: number | null,
  goalsDiff: number | null,
  form: string | null,
  teamCount: number,
) {
  if (teamCount <= 0) return 75;

  const positionScore = 55 - ((Math.max(1, rank ?? teamCount) - 1) / Math.max(1, teamCount - 1)) * 25;
  const pointsPerGame = played && played > 0 ? (points ?? 0) / played : 0;
  const pointsScore = Math.min(12, Math.max(0, pointsPerGame / 3 * 12));
  const goalDiffPerGame = played && played > 0 ? (goalsDiff ?? 0) / played : 0;
  const goalScore = Math.min(6, Math.max(-3, goalDiffPerGame * 1.5));
  const formScore = form
    ? [...form].slice(-5).reduce((score, result) => score + (result === "W" ? 1.4 : result === "D" ? 0.2 : -1.1), 0)
    : 0;

  return Math.round(Math.min(99, Math.max(70, positionScore + pointsScore + goalScore + formScore)));
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
  if (apiErrors && ((Array.isArray(apiErrors) && apiErrors.length > 0) || (!Array.isArray(apiErrors) && Object.keys(apiErrors).length > 0))) {
    const message = Array.isArray(apiErrors) ? apiErrors.join("; ") : Object.values(apiErrors).filter(Boolean).join("; ");
    throw new Error(`API-Football: ${message || "request rejected"}`);
  }

  return data;
}

export async function getTeams(leagueIds: number[], season = DEFAULT_SEASON): Promise<Team[]> {
  if (!process.env.API_FOOTBALL_KEY) {
    return FALLBACK_TEAMS.filter((team) => leagueIds.includes(team.leagueId));
  }

  const batches = await Promise.all(
    leagueIds.map(async (leagueId) => {
      const data = await apiFetch<any>(`/standings?league=${leagueId}&season=${season}`, 3600);
      const tables = data.response?.[0]?.league?.standings ?? [];
      const table = tables.flat();
      const teamCount = table.length;

      if (!teamCount) {
        throw new Error(`No standings data returned for ${data.response?.[0]?.league?.name ?? `league ${leagueId}`}.`);
      }

      return table.map((entry: any) => {
        const all = entry.all ?? {};
        const goals = all.goals ?? {};

        const rank = Number(entry.rank) || null;
        const points = Number(entry.points) || null;
        const played = Number(all.played) || null;
        const wins = Number(all.win) || null;
        const draws = Number(all.draw) || null;
        const losses = Number(all.lose) || null;
        const goalsFor = Number(goals.for) || null;
        const goalsAgainst = Number(goals.against) || null;
        const goalsDiff = Number(entry.goalsDiff) || 0;

        return {
          id: Number(entry.team.id),
          name: entry.team.name,
          logo: entry.team.logo,
          leagueId,
          league: data.response?.[0]?.league?.name ?? "Unknown League",
          country: data.response?.[0]?.league?.country ?? "Unknown",
          rank,
          points,
          form: entry.form ?? null,
          goalsDiff,
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          strength: calculateStrength(rank, points, played, goalsDiff, entry.form ?? null, teamCount),
        } satisfies Team;
      });
    }),
  );

  const allTeams = batches.flat();

  if (allTeams.length < 80) {
    throw new Error(`Only ${allTeams.length} teams were returned. The five major leagues require their complete current standings.`);
  }

  return allTeams;
}

export async function getLiveFixtures() {
  return apiFetch<any>("/fixtures?live=all", 30);
}

export type { FootballApiResponse };
