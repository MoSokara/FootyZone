import "server-only";

import type { FootballApiResponse, Team } from "./types";

const API_URL = "https://v3.football.api-sports.io";
const DEFAULT_SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026);

/** Returns the server-side API key, throwing when it is not configured. */
function getKey() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  return key;
}

/**
 * Derives a gameplay strength score between 70 and 99 from table position,
 * points, recent form, and the number of teams in the table.
 */
function calculateStrength(rank: number | null, points: number | null, form: string | null, teamCount: number) {
  const safeRank = rank ?? teamCount;
  const rankScore = teamCount <= 1 ? 85 : 99 - ((safeRank - 1) / (teamCount - 1)) * 25;
  const pointsScore = points == null ? 0 : Math.min(5, Math.max(-3, (points / Math.max(teamCount, 1) - 2)));
  const formScore = form
    ? [...form].slice(-5).reduce((score, result) => score + (result === "W" ? 1.1 : result === "D" ? 0.2 : -0.8), 0)
    : 0;

  return Math.round(Math.min(99, Math.max(70, rankScore + pointsScore + formScore)));
}

/**
 * Fetches and parses an API-Football path with Next.js cache revalidation.
 * Throws when the API key is missing or the upstream response is unsuccessful.
 */
async function apiFetch<T>(path: string, revalidate = 3600): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "x-apisports-key": getKey() },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status}`);
  }

  const data = await response.json();
  const apiErrors = data?.errors;
  if (apiErrors && Object.keys(apiErrors).length > 0) {
    const message = Object.values(apiErrors).filter(Boolean).join("; ");
    throw new Error(`API-Football: ${message || "request rejected"}`);
  }

  return data;
}

/**
 * Fetches standings for the requested leagues and maps each entry to a team
 * with a derived gameplay strength score.
 */
export async function getTeams(leagueIds: number[], season = DEFAULT_SEASON): Promise<Team[]> {
  const batches = await Promise.all(
    leagueIds.map(async (leagueId) => {
      const data = await apiFetch<any>(`/standings?league=${leagueId}&season=${season}`, 3600);
      let table = data.response?.[0]?.league?.standings?.[0] ?? [];

      // Some competitions can briefly expose teams before their standings table is available.
      // Fall back to the teams endpoint so the draft game remains usable.
      if (!table.length) {
        const teamsData = await apiFetch<any>(`/teams?league=${leagueId}&season=${season}`, 3600);
        const apiTeams = teamsData.response ?? [];

        return apiTeams.map((item: any, index: number) => ({
          id: Number(item.team.id),
          name: item.team.name,
          logo: item.team.logo,
          leagueId,
          league: data.response?.[0]?.league?.name ?? "Unknown League",
          country: data.response?.[0]?.league?.country ?? "Unknown",
          rank: null,
          points: null,
          form: null,
          goalsDiff: 0,
          strength: Math.round(85 - index * 0.5),
        } satisfies Team));
      }
      const teamCount = table.length;

      return table.map((entry: any) => {
        const rank = Number(entry.rank) || null;
        const points = Number(entry.points) || null;
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
          goalsDiff: Number(entry.goalsDiff) || 0,
          strength: calculateStrength(rank, points, entry.form ?? null, teamCount),
        } satisfies Team;
      });
    }),
  );

  return batches.flat();
}

/** Fetches all live fixtures with a 30-second cache revalidation interval. */
export async function getLiveFixtures() {
  return apiFetch<any>("/fixtures?live=all", 30);
}

export type { FootballApiResponse };
