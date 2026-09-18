import type { Team } from "@/lib/types";

export default function DraftHistory({ history }: { history: Team[][] }) {
  return <section className="card rounded-3xl p-5"><h2 className="mb-4 font-semibold">Recent drafts</h2>{history.length ? <div className="space-y-2">{history.slice(0,4).map((draft,index)=><div key={index} className="text-xs text-[var(--muted)]">{draft.map(team=>team.name).join(" · ")}</div>)}</div> : <p className="text-sm text-[var(--muted)]">Your latest drafts will be saved locally.</p>}</section>;
}
