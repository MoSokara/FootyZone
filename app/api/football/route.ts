import { NextRequest, NextResponse } from "next/server";
import { getLiveFixtures, getTeams } from "@/lib/football";
import { LEAGUES } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Serves supported-league team data or, when `mode=live`, current fixtures.
 *
 * Team requests may select comma-separated league IDs and a season; unsupported
 * league IDs are ignored. Upstream and configuration errors become JSON 500
 * responses rather than escaping the route handler.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const mode = params.get("mode") ?? "teams";

    if (mode === "live") {
      const data = await getLiveFixtures();
      return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
    }

    const rawLeagues = params.get("leagues");
    const leagueIds = (rawLeagues
      ? rawLeagues.split(",").map(Number).filter(Boolean)
      : LEAGUES.map((league) => league.id)
    ).filter((id) => LEAGUES.some((league) => league.id === id));

    const season = Number(params.get("season") ?? process.env.FOOTBALL_SEASON ?? 2026);
    const teams = await getTeams(leagueIds, season);

    return NextResponse.json(
      { results: teams.length, response: teams },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected football API error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
