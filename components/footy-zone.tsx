"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import type { Team } from "@/lib/types";
import TeamCard from "@/components/football/team-card";
import { Button } from "@/components/ui/button";
import {
  generateChallengePair,
  generateNormalPair,
  type DraftMode,
} from "@/lib/game";

const LEAGUES = [
  { id: "all", name: "All five leagues" },
  { id: "39", name: "Premier League" },
  { id: "140", name: "La Liga" },
  { id: "78", name: "Bundesliga" },
  { id: "135", name: "Serie A" },
  { id: "61", name: "Ligue 1" },
];

export default function FootyZone() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Team[]>([]);
  const [league, setLeague] = useState("all");
  const [mode, setMode] = useState<DraftMode>("normal");
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

  const availableTeams = teams.filter(
    (team) => league === "all" || String(team.leagueId) === league,
  );

  function generate() {
    if (availableTeams.length < 2) return;

    const pair =
      mode === "normal"
        ? generateNormalPair(availableTeams)
        : generateChallengePair(availableTeams);

    if (!pair) {
      setResults([]);
      setError(
        mode === "normal"
          ? "There are not enough teams rated between 85 and 96 with a rating gap of two points or less."
          : "No valid challenge pair could be generated from the current teams.",
      );
      return;
    }

    setError("");
    setResults(pair);
  }

  return (
    <main className="h-svh overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex shrink-0 items-center gap-3 border-b border-border pb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Trophy size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">FootyZone</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Football draft generator · current top-five league data
            </p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Draft</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a league and a draft type.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                  League
                </span>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs outline-none transition focus:ring-2 focus:ring-ring"
                  value={league}
                  onChange={(event) => setLeague(event.target.value)}
                >
                  {LEAGUES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                  Draft type
                </span>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
                  {([
                    ["challenge", "Challenge"],
                    ["normal", "Normal"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`h-8 rounded-md text-[11px] font-medium transition ${
                        mode === value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generate}
                disabled={loading || availableTeams.length < 2}
                className="h-10 w-full rounded-lg font-semibold"
              >
                <RefreshCw size={15} />
                Generate
              </Button>
            </div>
          </aside>

          <section className="min-h-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {mode === "normal" ? "Normal draft" : "Challenge draft"}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {results.length ? "Your matchup" : "Ready to draft"}
              </h2>
            </div>

            {error ? (
              <div className="flex h-[calc(100%-60px)] min-h-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <div>
                  <p className="text-sm font-medium text-destructive">Could not generate the draft</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : loading ? (
              <div className="grid h-[calc(100%-60px)] min-h-0 grid-cols-2 gap-3">
                <div className="animate-pulse rounded-xl border border-border bg-muted/30" />
                <div className="animate-pulse rounded-xl border border-border bg-muted/30" />
              </div>
            ) : results.length ? (
              <div className="grid h-[calc(100%-60px)] min-h-0 grid-cols-2 gap-3">
                {results.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            ) : (
              <div className="flex h-[calc(100%-60px)] min-h-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                <div>
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <RefreshCw size={18} />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">Generate a matchup</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                    Normal keeps both teams between 85 and 96 with a tiny rating gap. Challenge creates a wider or tightly matched rating challenge.
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
