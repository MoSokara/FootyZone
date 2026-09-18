import Image from "next/image";
import type { Team } from "@/lib/types";
import { TeamStrength } from "./strength";

type Props = {
  team: Team;
};

export default function TeamCard({ team }: Props) {
  return (
    <article className="team-card flex min-h-0 flex-col rounded-xl border border-border bg-background/70 p-4">
      <div className="flex items-center justify-center rounded-lg bg-white p-3">
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={72}
          height={72}
          className="size-16 object-contain"
        />
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="truncate text-base font-bold tracking-tight">{team.name}</h3>
        <p className="mt-1 flex items-center gap-2 truncate text-xs text-muted-foreground">
          <span className="truncate">{team.league}</span>
          <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className="shrink-0">#{team.rank ?? "—"}</span>
        </p>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <TeamStrength team={team} />
      </div>
    </article>
  );
}
