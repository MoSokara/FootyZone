"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Shuffle, Trophy } from "lucide-react";
import type { Team } from "@/lib/types";
import TeamCard from "@/components/football/team-card";
import { Button } from "@/components/ui/button";
import { shuffle } from "@/lib/game";

const LEAGUES = [
  { id: "all", name: "All five leagues" },
  { id: "39", name: "Premier League" },
  { id: "140", name: "La Liga" },
  { id: "78", name: "Bundesliga" },
  { id: "135", name: "Serie A" },
  { id: "61", name: "Ligue 1" },
];

type Mode = "random" | "balanced";

export default function FootyZone() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Team[]>([]);
  const [league, setLeague] = useState("all");
  const [count, setCount] = useState(4);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("random");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/football");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load football data.");
        }

        setTeams(data.response ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load football data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return teams.filter((team) => {
      const leagueMatch = league === "all" || String(team.leagueId) === league;
      const queryMatch = !normalized || team.name.toLowerCase().includes(normalized);
      return leagueMatch && queryMatch;
    });
  }, [teams, league, query]);

  function generate() {
    if (filteredTeams.length === 0) return;

    if (mode === "balanced") {
      const ordered = [...filteredTeams].sort((a, b) => a.strength - b.strength);
      const step = Math.max(1, Math.floor(ordered.length / count));
      const picked = Array.from(
        { length: Math.min(count, ordered.length) },
        (_, index) => ordered[Math.min(index * step, ordered.length - 1)],
      );

      setResults(shuffle(picked));
      return;
    }

    setResults(shuffle(filteredTeams).slice(0, Math.min(count, filteredTeams.length)));
  }

  return (
    <main className="h-svh overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Trophy size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">FootyZone</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Football draft generator · current top-five league data</p>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            {loading ? "Loading teams…" : `${teams.length} clubs`}
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Shuffle size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Draft</h2>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">League</span>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs outline-none transition focus:ring-2 focus:ring-ring"
                  value={league}
                  onChange={(event) => setLeague(event.target.value)}
                >
                  {LEAGUES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Clubs per draft</span>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs outline-none transition focus:ring-2 focus:ring-ring"
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                >
                  {[2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} clubs</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Find a club</span>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-2.5 text-xs outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                    placeholder="Arsenal, Milan…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </label>

              <div>
                <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Draft style</span>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
                  {([
                    ["random", "Random"],
                    ["balanced", "Balanced"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`h-8 rounded-md text-[11px] font-medium transition ${mode === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generate}
                disabled={loading || filteredTeams.length === 0}
                className="h-10 w-full rounded-lg font-semibold"
              >
                <RefreshCw size={15} />
                Generate
              </Button>
            </div>
          </aside>

          <section className="min-h-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{mode} draft</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {results.length ? "Your clubs" : "Ready to draft"}
                </h2>
              </div>
              <p className="text-right text-[11px] text-muted-foreground">
                {filteredTeams.length} matching clubs
              </p>
            </div>

            {error ? (
              <div className="flex h-[calc(100%-60px)] min-h-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <div>
                  <p className="text-sm font-medium text-destructive">Football data could not be loaded</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="grid h-[calc(100%-60px)] min-h-0 grid-cols-2 gap-3 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-xl border border-border bg-muted/30" />
                ))}
              </div>
            ) : results.length ? (
              <div className="grid h-[calc(100%-60px)] min-h-0 grid-cols-2 gap-3 md:grid-cols-3">
                {results.map((team) => (
                  <TeamCard key={team.id} team={team} favorite={false} onFavorite={() => undefined} compact />
                ))}
              </div>
            ) : (
              <div className="flex h-[calc(100%-60px)] min-h-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                <div>
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Shuffle size={18} />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">Generate a football draft</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                    Pick a league, choose how many clubs you want, then generate a fresh draft from the complete current standings.
                  </p>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
