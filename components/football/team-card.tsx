"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import type { Team } from "@/lib/types";
import { TeamStrength } from "./strength";

export default function TeamCard({ team, favorite, revealed = true, onFavorite, onReveal }: { team: Team; favorite: boolean; revealed?: boolean; onFavorite: () => void; onReveal?: () => void }) {
  return (
    <article className="team-card rounded-2xl border border-white/8 bg-[#0a0f13] p-4">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-white p-2">
          <Image src={team.logo} alt={`${team.name} logo`} width={56} height={56} className="h-14 w-14 object-contain" />
        </div>
        <button aria-label={`Favorite ${team.name}`} onClick={onFavorite} className="rounded-lg p-2 text-[var(--muted)] hover:bg-white/5">
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-4"><h3 className="font-semibold">{team.name}</h3><p className="mt-1 text-xs text-[var(--muted)]">{team.league} · Rank {team.rank ?? "—"}</p></div>
      {!revealed && onReveal ? <button onClick={onReveal} className="action mt-4 w-full rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] py-2 text-sm text-[var(--accent)]">Reveal strength</button> : <TeamStrength team={team} />}
    </article>
  );
}
