"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import type { Team } from "@/lib/types";
import { createDuel, getDuelWinner } from "@/lib/game";
import Image from "next/image";

export default function DuelMode({ teams }: { teams: Team[] }) {
  const [duel, setDuel] = useState<[Team, Team] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("footyzone:best-streak");
    if (saved) setBestStreak(Number(saved));
  }, []);

  function newDuel() {
    setDuel(createDuel(teams));
    setSelected(null);
    setRevealed(false);
  }

  function choose(team: Team) {
    if (!duel || revealed) return;
    setSelected(team.id);
    setRevealed(true);
    const winner = getDuelWinner(duel[0], duel[1]);
    const correct = team.id === winner.id;
    const nextStreak = correct ? streak + 1 : 0;
    const nextScore = correct ? score + 100 + streak * 25 : Math.max(0, score - 25);
    setStreak(nextStreak);
    setScore(nextScore);
    if (nextStreak > bestStreak) {
      setBestStreak(nextStreak);
      localStorage.setItem("footyzone:best-streak", String(nextStreak));
    }
  }

  if (teams.length < 2) return null;

  return (
    <section className="card mt-5 rounded-3xl p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Game mode</p>
          <h2 className="mt-1 text-2xl font-bold">Duel Mode</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Which club has the higher FootyZone Game Strength?</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-white/8 px-3 py-2"><Trophy size={14} className="mr-1 inline" /> {score} pts</span>
          <span className="rounded-full border border-white/8 px-3 py-2"><Flame size={14} className="mr-1 inline" /> {streak} streak</span>
        </div>
      </div>

      {!duel ? (
        <button onClick={newDuel} className="action w-full rounded-2xl bg-[var(--accent)] px-4 py-4 font-bold text-black">Start Duel</button>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {duel.map((team) => {
              const winner = revealed ? getDuelWinner(duel[0], duel[1]).id === team.id : false;
              const picked = selected === team.id;
              return (
                <button key={team.id} onClick={() => choose(team)} className={`rounded-2xl border p-5 text-left transition ${picked ? "border-[var(--accent)]" : "border-white/8 hover:border-white/20"}`}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white p-2"><Image src={team.logo} alt="" width={52} height={52} className="h-13 w-13 object-contain" /></div>
                    <div><h3 className="font-semibold">{team.name}</h3><p className="text-xs text-[var(--muted)]">{team.league}</p></div>
                  </div>
                  {revealed && <div className="mt-4 flex items-center justify-between text-sm"><span className={winner ? "text-[var(--accent)]" : "text-[var(--muted)]"}>{winner ? "Higher strength" : "Lower strength"}</span><strong>{team.strength}</strong></div>}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">{revealed ? (selected === getDuelWinner(duel[0], duel[1]).id ? "Correct pick!" : "Not this time.") : "Pick one club."}</p>
            {revealed && <button onClick={newDuel} className="action rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black">Next Duel</button>}
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">Best streak: {bestStreak}</p>
        </>
      )}
    </section>
  );
}
