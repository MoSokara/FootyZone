"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Heart, RefreshCw, Search, Shield, Sparkles, Trophy } from "lucide-react";
import type { Team } from "@/lib/types";
import TeamCard from "@/components/football/team-card";
import DraftHistory from "@/components/football/draft-history";
import { shuffle } from "@/lib/game";
import DuelMode from "./football/duel-mode";

const LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 78, name: "Bundesliga" },
  { id: 135, name: "Serie A" },
  { id: 61, name: "Ligue 1" },
];

type Mode = "random" | "balanced" | "challenge";

export default function FootyZone() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Team[]>([]);
  const [league, setLeague] = useState("all");
  const [count, setCount] = useState(4);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("random");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [history, setHistory] = useState<Team[][]>([]);
  const [challengeRevealed, setChallengeRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("footyzone:favorites");
    const savedHistory = localStorage.getItem("footyzone:history");
    try {
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch {
      localStorage.removeItem("footyzone:favorites");
      localStorage.removeItem("footyzone:history");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("footyzone:favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("footyzone:history", JSON.stringify(history.slice(0, 8)));
  }, [history]);

  useEffect(() => {
    /** Loads the initial team list and reflects request failures in component state. */
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/football");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load football data.");
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

  /** Generates a draft from the active filters and records it in recent history. */
  function generate() {
    if (!filteredTeams.length) return;

    let next: Team[];
    if (mode === "balanced") {
      const ordered = [...filteredTeams].sort((a, b) => a.strength - b.strength);
      const step = Math.max(1, Math.floor(ordered.length / count));
      next = shuffle(Array.from({ length: count }, (_, index) => ordered[Math.min(index * step, ordered.length - 1)]));
    } else {
      next = shuffle(filteredTeams).slice(0, Math.min(count, filteredTeams.length));
    }

    setResults(next);
    setHistory((current) => [next, ...current.filter((item) => item.map((team) => team.id).join(",") !== next.map((team) => team.id).join(","))].slice(0, 8));
    setChallengeRevealed(mode !== "challenge");
    setCopied(false);
  }

  /** Adds or removes a team from the favorites state. */
  function toggleFavorite(id: number) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  /** Copies the current draft's team names to the clipboard when results exist. */
  async function copyResults() {
    if (!results.length) return;
    await navigator.clipboard.writeText(results.map((team) => team.name).join(" • "));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const favoriteTeams = teams.filter((team) => favorites.includes(team.id));

  /** Replaces the displayed live fixtures with the latest API response. */
  async function loadLive() {
    setLiveLoading(true);
    try {
      const response = await fetch("/api/football?mode=live");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load live fixtures.");
      setLive(data.response ?? []);
    } catch {
      setLive([]);
    } finally {
      setLiveLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-(--accent)">
              <Trophy size={17} /> FOOTYZONE
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Pick your next football challenge.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-(--muted) sm:text-base">
              A modern football team randomizer using current league data instead of a bundled team-image database.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-2 text-xs text-(--muted)">
            <Shield size={15} /> {teams.length} teams loaded
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="card rounded-3xl p-5">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles size={17} className="text-(--accent)" />
              <h2 className="font-semibold">Draft controls</h2>
            </div>

            <label className="mb-2 block text-xs font-medium text-(--muted)">League</label>
            <select className="control mb-4 w-full rounded-xl px-3 py-2.5 text-sm" value={league} onChange={(e) => setLeague(e.target.value)}>
              <option value="all">All supported leagues</option>
              {LEAGUES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>

            <label className="mb-2 block text-xs font-medium text-(--muted)">Teams per draft</label>
            <select className="control mb-4 w-full rounded-xl px-3 py-2.5 text-sm" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[2, 3, 4, 5, 6, 8, 10].map((value) => <option key={value} value={value}>{value} teams</option>)}
            </select>

            <label className="mb-2 block text-xs font-medium text-(--muted)">Search teams</label>
            <div className="relative mb-5">
              <Search size={16} className="absolute left-3 top-3 text-(--muted)" />
              <input className="control w-full rounded-xl py-2.5 pl-9 pr-3 text-sm" placeholder="Arsenal, Milan..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-1">
              {([
                ["random", "Random"],
                ["balanced", "Balanced"],
                ["challenge", "Challenge"],
              ] as const).map(([value, label]) => (
                <button key={value} onClick={() => setMode(value)} className={`rounded-lg px-2 py-2 text-xs transition ${mode === value ? "bg-(--accent) font-semibold text-black" : "text-(--muted) hover:bg-white/5"}`}>
                  {label}
                </button>
              ))}
            </div>

            <button onClick={generate} disabled={loading || !filteredTeams.length} className="action flex w-full items-center justify-center gap-2 rounded-xl bg-(--accent) px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={17} /> Generate
            </button>

            <div className="mt-5 rounded-2xl border border-white/6 bg-black/15 p-3 text-xs leading-5 text-(--muted)">
              <strong className="text-white">Game Strength</strong> is a FootyZone gameplay score derived from league position, points and recent form. It is not an official club rating.
            </div>
          </aside>

          <div className="min-w-0">
            {error && (
              <div className="card mb-5 rounded-2xl border-red-500/30 p-4 text-sm text-red-300">
                {error} Check your API key and try again.
              </div>
            )}

            <div className="card min-h-105 rounded-3xl p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">{mode} mode</p>
                  <h2 className="mt-1 text-2xl font-bold">{results.length ? "Your draft" : "Ready when you are"}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyResults} disabled={!results.length} className="action rounded-xl border border-white/8 px-3 py-2 text-xs text-(--muted) disabled:opacity-40">
                    <Copy size={15} className="mr-1 inline" /> {copied ? "Copied" : "Copy"}
                  </button>
                  <button onClick={() => setResults([])} disabled={!results.length} className="action rounded-xl border border-white/8 px-3 py-2 text-xs text-(--muted) disabled:opacity-40">
                    Clear
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1,2,3,4].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
              ) : results.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((team, index) => (
                    <TeamCard key={team.id} team={team} favorite={favorites.includes(team.id)} revealed={mode !== "challenge" || challengeRevealed} onFavorite={() => toggleFavorite(team.id)} onReveal={() => setChallengeRevealed(true)} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-2xl bg-(--accent-soft) p-4 text-(--accent)"><Sparkles size={24} /></div>
                  <h3 className="font-semibold">Generate a team draft</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-(--muted)">Choose a league and game mode, then generate teams. Results are randomized locally after the initial API load.</p>
                </div>
              )}
            </div>

            <DuelMode teams={teams} />

            <section className="card mt-5 rounded-3xl p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-(--accent)" /><h2 className="font-semibold">Live radar</h2></div>
                  <p className="mt-1 text-xs text-(--muted)">On-demand live fixtures. Refresh manually to protect the free API quota.</p>
                </div>
                <button onClick={loadLive} disabled={liveLoading} className="action rounded-xl border border-white/8 px-3 py-2 text-xs text-(--muted) disabled:opacity-50">
                  <RefreshCw size={14} className="mr-1 inline" /> {liveLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
              {live.length ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {live.slice(0, 9).map((fixture) => (
                    <div key={fixture.fixture?.id} className="rounded-2xl border border-white/6 bg-black/15 p-3 text-sm">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-(--muted)">{fixture.league?.name ?? "Live match"}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span>{fixture.teams?.home?.name ?? "Home"}</span>
                        <strong>{fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}</strong>
                        <span className="text-right">{fixture.teams?.away?.name ?? "Away"}</span>
                      </div>
                      <div className="mt-2 text-center text-[10px] text-(--accent)">{fixture.fixture?.status?.elapsed ? fixture.fixture.status.elapsed + "'" : fixture.fixture?.status?.short ?? "LIVE"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-(--muted)">No live data loaded. Press Refresh when you want to check current matches.</p>
              )}
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="card rounded-3xl p-5">
                <div className="mb-4 flex items-center gap-2"><Heart size={17} className="text-(--accent)" /><h2 className="font-semibold">Favorites</h2></div>
                {favoriteTeams.length ? <div className="flex flex-wrap gap-2">{favoriteTeams.map((team) => <button key={team.id} onClick={() => toggleFavorite(team.id)} className="rounded-full border border-white/8 px-3 py-1.5 text-xs hover:border-(--accent)">{team.name}</button>)}</div> : <p className="text-sm text-(--muted)">Favorite teams will appear here.</p>}
              </section>
              <DraftHistory history={history} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
