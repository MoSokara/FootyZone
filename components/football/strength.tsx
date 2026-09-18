import type { Team } from "@/lib/types";

export function strengthLabel(value: number) {
  if (value >= 92) return "Elite";
  if (value >= 86) return "Strong";
  if (value >= 80) return "Competitive";
  return "Underdog";
}

export function TeamStrength({ team, revealed = true }: { team: Team; revealed?: boolean }) {
  if (!revealed) return <div className="mt-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2 text-center text-sm text-[var(--accent)]">Strength hidden</div>;
  return (
    <div className="mt-4 flex items-end justify-between">
      <div><p className="text-2xl font-bold">{team.strength}</p><p className="text-[11px] text-[var(--muted)]">{strengthLabel(team.strength)}</p></div>
      <p className="max-w-24 text-right text-[11px] text-[var(--muted)]">{team.form ?? "No form data"}</p>
    </div>
  );
}
