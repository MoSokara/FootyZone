import "server-only";

import type { FootballApiResponse, Team } from "./types";

const API_URL = "https://v3.football.api-sports.io";
const DEFAULT_SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026);

/**
 * Returns the server-side API-Football credential.
 *
 * @throws {Error} When `API_FOOTBALL_KEY` is not configured.
 */
function getKey() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  return key;
}

/**
 * Calculates a FootyZone gameplay score from standings and up to five recent results.
 * Missing rank is treated as last place; missing points or form add no adjustment.
 *
 * @returns An integer from 70 through 99.
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
 * Fetches and decodes an API-Football endpoint using Next.js data revalidation.
 *
 * @param path An API path including its query string.
 * @param revalidate Cache lifetime in seconds.
 * @throws {Error} When the API key is missing or the upstream response is unsuccessful.
 */
async function apiFetch<T>(path: string, revalidate = 3600): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "x-apisports-key": getKey() },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches league standings and maps each entry to a team with a gameplay strength.
 * Requests for the supplied leagues run concurrently and use one-hour revalidation.
 *
 * @param leagueIds API-Football league identifiers, in the desired result-group order.
 * @param season The season used for every standings request.
 * @returns Teams grouped in the same order as `leagueIds`.
 * @throws {Error} When the API key is missing or a standings request is unsuccessful.
 */
export async function getTeams(leagueIds: number[], season = DEFAULT_SEASON): Promise<Team[]> {
  const batches = await Promise.all(
    leagueIds.map(async (leagueId) => {
      const data = await apiFetch<any>(`/standings?league=${leagueId}&season=${season}`, 3600);
      const table = data.response?.[0]?.league?.standings?.[0] ?? [];
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

/**
 * Fetches the API-Football live-fixtures payload with 30-second revalidation.
 *
 * @throws {Error} When the API key is missing or the upstream response is unsuccessful.
 */
export async function getLiveFixtures() {
  return apiFetch<any>("/fixtures?live=all", 30);
}

export type { FootballApiResponse };
