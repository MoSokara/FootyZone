"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Flame, RotateCcw, Trophy } from "lucide-react";
import type { Team } from "@/lib/types";
import { createDuel, getDuelWinner } from "@/lib/game";

const TOTAL_ROUNDS = 10;

type Difficulty = "normal" | "hard";

export default function DuelMode({ teams }: { teams: Team[] }) {
  const [duel, setDuel] = useState<[Team, Team] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [started, setStarted] = useState(false);
  const [usedPairs, setUsedPairs] = useState<string[]>([]);

  useEffect(() => {
    const savedStreak = localStorage.getItem("footyzone:best-streak");
    const savedScore = localStorage.getItem("footyzone:best-score");
    if (savedStreak) setBestStreak(Number(savedStreak));
    if (savedScore) setBestScore(Number(savedScore));
  }, []);

  const availableTeams = useMemo(() => {
    if (difficulty === "hard") {
      return teams.filter((team) => team.strength >= 80);
    }
    return teams;
  }, [teams, difficulty]);

  function getNewDuel() {
    const candidates = availableTeams.length >= 2 ? availableTeams : teams;
    if (candidates.length < 2) return null;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const next = createDuel(candidates);
      if (!next) return null;
      const key = [next[0].id, next[1].id].sort((a, b) => a - b).join("-");
      if (!usedPairs.includes(key) || usedPairs.length >= Math.floor(candidates.length / 2)) {
        setUsedPairs((current) => [...current, key]);
        return next;
      }
    }
    return createDuel(candidates);
  }

  function startGame() {
    setScore(0);
    setStreak(0);
    setRound(1);
    setUsedPairs([]);
    setSelected(null);
    setRevealed(false);
    setStarted(true);
    const next = createDuel(availableTeams.length >= 2 ? availableTeams : teams);
    setDuel(next);
  }

  function choose(team: Team) {
    if (!duel || revealed || round === 0) return;
    setSelected(team.id);
    setRevealed(true);

    const winner = getDuelWinner(duel[0], duel[1]);
    const correct = team.id === winner.id;
    const nextStreak = correct ? streak + 1 : 0;
    const nextScore = correct
      ? score + (difficulty === "hard" ? 150 : 100) + streak * 25
      : Math.max(0, score - 25);

    setStreak(nextStreak);
    setScore(nextScore);

    if (nextStreak > bestStreak) {
      setBestStreak(nextStreak);
      localStorage.setItem("footyzone:best-streak", String(nextStreak));
    }
  }

  function nextRound() {
    if (round >= TOTAL_ROUNDS) {
      const finalScore = score;
      if (finalScore > bestScore) {
        setBestScore(finalScore);
        localStorage.setItem("footyzone:best-score", String(finalScore));
      }
      return;
    }
    setRound((current) => current + 1);
    setDuel(getNewDuel());
    setSelected(null);
    setRevealed(false);
  }

  function finishGame() {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("footyzone:best-score", String(score));
    }
    setStarted(false);
    setDuel(null);
    setRound(0);
    setSelected(null);
    setRevealed(false);
  }

  if (teams.length < 2) return null;

  const gameOver = started && round === TOTAL_ROUNDS && revealed;

  return (
    <section className="card mt-5 rounded-3xl p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Game mode</p>
          <h2 className="mt-1 text-2xl font-bold">Duel Mode</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Guess which club has the higher FootyZone Game Strength.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/8 px-3 py-2"><Trophy size={14} className="mr-1 inline" /> {score} pts</span>
          <span className="rounded-full border border-white/8 px-3 py-2"><Flame size={14} className="mr-1 inline" /> {streak}</span>
          <span className="rounded-full border border-white/8 px-3 py-2">Round {round || 0}/{TOTAL_ROUNDS}</span>
        </div>
      </div>

      {!started ? (
        <div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
            {(["normal", "hard"] as const).map((value) => (
              <button key={value} onClick={() => setDifficulty(value)} className={`rounded-lg px-3 py-2 text-sm transition ${difficulty === value ? "bg-[var(--accent)] font-semibold text-black" : "text-[var(--muted)] hover:bg-white/5"}`}>
                {value === "normal" ? "Normal" : "Hard"}
              </button>
            ))}
          </div>
          <button onClick={startGame} className="action flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-4 font-bold text-black">
            <Trophy size={17} /> Start 10-Round Duel
          </button>
          <p className="mt-3 text-center text-xs text-[var(--muted)]">Best score: {bestScore} · Best streak: {bestStreak}</p>
        </div>
      ) : gameOver ? (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-6 text-center">
          <Trophy className="mx-auto text-[var(--accent)]" size={30} />
          <h3 className="mt-3 text-xl font-bold">Game complete</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">Final score: <strong className="text-white">{score}</strong></p>
          <p className="mt-1 text-xs text-[var(--muted)]">Best score: {bestScore} · Best streak: {bestStreak}</p>
          <button onClick={finishGame} className="action mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black"><RotateCcw size={15} /> Play again</button>
        </div>
      ) : duel ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {duel.map((team) => {
              const winner = revealed && getDuelWinner(duel[0], duel[1]).id === team.id;
              const picked = selected === team.id;
              return (
                <button key={team.id} onClick={() => choose(team)} className={`rounded-2xl border p-5 text-left transition ${picked ? "border-[var(--accent)]" : "border-white/8 hover:border-white/20"}`}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-white p-2"><Image src={team.logo} alt={`${team.name} logo`} width={52} height={52} className="h-13 w-13 object-contain" /></div>
                    <div><h3 className="font-semibold">{team.name}</h3><p className="text-xs text-[var(--muted)]">{team.league}</p></div>
                  </div>
                  {revealed && <div className="mt-4 flex items-center justify-between text-sm"><span className={winner ? "text-[var(--accent)]" : "text-[var(--muted)]"}>{winner ? "Higher strength" : "Lower strength"}</span><strong>{team.strength}</strong></div>}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">{revealed ? (selected === getDuelWinner(duel[0], duel[1]).id ? "Correct pick!" : "Not this time.") : "Pick one club."}</p>
            {revealed && <button onClick={nextRound} className="action rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black">{round === TOTAL_ROUNDS ? "Finish" : "Next Duel"}</button>}
          </div>
        </>
      ) : null}
    </section>
  );
}
