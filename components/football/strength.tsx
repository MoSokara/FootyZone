import type { Team } from "@/lib/types";

export function strengthLabel(value: number) {
  if (value >= 92) return "Elite";
  if (value >= 86) return "Strong";
  if (value >= 80) return "Competitive";
  return "Underdog";
}

export function TeamStrength({ team }: { team: Team }) {
  return (
    <div className="flex items-end justify-between border-t border-border pt-2">
      <div>
        <p className="text-xl font-semibold tabular-nums">{team.strength}</p>
        <p className="text-[10px] text-muted-foreground">{strengthLabel(team.strength)}</p>
      </div>
      <p className="max-w-20 truncate text-right text-[10px] text-muted-foreground">{team.form ?? "—"}</p>
    </div>
  );
}
