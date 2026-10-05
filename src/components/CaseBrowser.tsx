"use client";

import { useMemo, useState } from "react";
import { caseState, type Mask } from "@/lib/cube";
import { useProgress, type Status } from "@/lib/progress";
import CubePlayer from "./cube/CubePlayer";
import { IsoView, TopView } from "./cube/Diagrams";

export interface BrowserCase {
  id: string;
  title: string;
  group?: string;
  alg: string;
  /** Algorithm text to show when it differs from what the player animates. */
  display?: string;
  auf?: string;
  details?: { label: string; value: string }[];
}

interface Props {
  cases: BrowserCase[];
  mask: Mask;
  thumb: "top" | "iso";
  arrows?: boolean;
  groups?: string[];
  /** Show the filter/progress bar (for the big lists). */
  filters?: boolean;
  columns?: string;
}

const STATUS_STYLE: Record<Status, string> = {
  learning: "bg-amber-400",
  learned: "bg-emerald-400",
};

export default function CaseBrowser({ cases, mask, thumb, arrows = false, groups, filters = false, columns }: Props) {
  const [selected, setSelected] = useState(cases[0].id);
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string>("All");
  const [show, setShow] = useState<"all" | "todo" | "learning" | "learned">("all");
  const { status, setStatus } = useProgress();

  const states = useMemo(
    () => new Map(cases.map((c) => [c.id, caseState(c.auf ? `${c.alg} ${c.auf}` : c.alg)])),
    [cases],
  );

  const visible = cases.filter((c) => {
    if (group !== "All" && c.group !== group) return false;
    const st = status(c.id);
    if (show === "todo") return !st;
    if (show === "learning") return st === "learning";
    if (show === "learned") return st === "learned";
    return true;
  });

  const current = cases.find((c) => c.id === selected) ?? cases[0];
  const learnedCount = cases.filter((c) => status(c.id) === "learned").length;

  const byGroup = groups
    ? groups.map((g) => ({ g, items: visible.filter((c) => c.group === g) })).filter((x) => x.items.length)
    : [{ g: "", items: visible }];

  const thumbOf = (id: string) =>
    thumb === "top" ? (
      <TopView state={states.get(id)!} mask={mask} arrows={arrows} className="w-full" />
    ) : (
      <IsoView state={states.get(id)!} mask={mask} className="w-full" />
    );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <div className="min-w-0">
        {filters && (
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(learnedCount / cases.length) * 100}%` }} />
              </div>
              <span>
                {learnedCount}/{cases.length} learned
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "todo", "learning", "learned"] as const).map((s) => (
                <Chip key={s} on={show === s} onClick={() => setShow(s)}>
                  {s === "all" ? "All" : s === "todo" ? "Not started" : s === "learning" ? "Learning" : "Learned"}
                </Chip>
              ))}
              {groups && (
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="ml-auto h-8 rounded-full border border-white/10 bg-zinc-900 px-3 text-xs text-zinc-200"
                  aria-label="Filter by shape"
                >
                  <option>All</option>
                  {groups.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {byGroup.map(({ g, items }) => (
          <section key={g} className="mb-6">
            {g && groups && <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">{g}</h3>}
            <div className={`grid gap-3 ${columns ?? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"}`}>
              {items.map((c) => {
                const st = status(c.id);
                const active = c.id === current.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelected(c.id);
                      setOpen(true);
                    }}
                    className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-left transition ${
                      active ? "border-amber-400/70 bg-amber-400/[0.07]" : "border-white/[0.07] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    {st && <span className={`absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full ${STATUS_STYLE[st]}`} title={st} />}
                    <div className="w-full max-w-[150px]">
                      {thumbOf(c.id)}
                    </div>
                    <div className="w-full">
                      <div className="text-sm font-semibold text-zinc-100">{c.title}</div>
                      <div className="mt-0.5 line-clamp-2 font-mono text-[11px] leading-snug text-zinc-400">
                        {c.display ?? c.alg}
                        {c.auf ? ` (+${c.auf})` : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {visible.length === 0 && <p className="text-sm text-zinc-500">No cases match this filter.</p>}
      </div>

      {/* Detail panel: sticky column on desktop, full-screen sheet on mobile */}
      <div
        className={`${open ? "fixed flex" : "hidden"} inset-0 z-50 items-end bg-black/70 p-2 backdrop-blur-sm lg:static lg:block lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div className="max-h-[94vh] w-full overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-4 lg:sticky lg:top-20 lg:max-h-none lg:overflow-visible lg:bg-zinc-900/60">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500">{current.group}</div>
              <h3 className="text-xl font-bold text-white">{current.title}</h3>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full bg-white/5 px-3 py-1 text-sm text-zinc-300 lg:hidden">
              Close
            </button>
          </div>

          <CubePlayer key={current.id} alg={current.alg} auf={current.auf} mask={mask} autoPlay loop />

          <div className="mt-4 grid grid-cols-[80px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
            {thumbOf(current.id)}
            <div className="space-y-2 text-sm">
              {current.details?.map((d) => (
                <div key={d.label}>
                  <span className="text-zinc-500">{d.label}: </span>
                  <span className="text-zinc-200">{d.value}</span>
                </div>
              ))}
              <p className="text-zinc-400">Hold your cube exactly like the picture, then do the moves.</p>
              {current.auf && (
                <p className="text-zinc-400">
                  The dashed <span className="font-mono text-zinc-200">+{current.auf}</span> is the final U turn (AUF) that lines up the top layer.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {(["learning", "learned"] as const).map((s) => {
              const on = status(current.id) === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(current.id, on ? null : s)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    on
                      ? s === "learned"
                        ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-300"
                        : "border-amber-400/60 bg-amber-400/15 text-amber-300"
                      : "border-white/10 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {s === "learning" ? "Learning" : "Learned"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-full px-3 text-xs font-medium transition ${on ? "bg-white text-black" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}
