import Image from "next/image";
import type { Team } from "@/lib/types";
import { TeamStrength } from "./strength";

type Props = {
  team: Team;
  favorite?: boolean;
  onFavorite?: () => void;
  compact?: boolean;
};

export default function TeamCard({ team, favorite = false, onFavorite, compact = false }: Props) {
  return (
    <article className={`team-card flex min-h-0 flex-col rounded-xl border border-border bg-background/70 p-3 ${compact ? "justify-between" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`flex items-center justify-center rounded-lg bg-white p-1.5 ${compact ? "size-11" : "size-14"}`}>
          <Image
            src={team.logo}
            alt={`${team.name} logo`}
            width={compact ? 40 : 52}
            height={compact ? 40 : 52}
            className="size-full object-contain"
          />
        </div>
        {onFavorite && (
          <button
            type="button"
            aria-label={`Favorite ${team.name}`}
            onClick={onFavorite}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <span className={favorite ? "text-primary" : ""}>♥</span>
          </button>
        )}
      </div>

      <div className="mt-2 min-w-0">
        <h3 className={`truncate font-semibold ${compact ? "text-sm" : "text-base"}`}>{team.name}</h3>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {team.league} · {team.rank ? `#${team.rank}` : "Current"}
        </p>
      </div>

      <div className="mt-2">
        <TeamStrength team={team} />
      </div>
    </article>
  );
}
