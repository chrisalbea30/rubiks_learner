"use client";

import { useState } from "react";
import CubePlayer from "./cube/CubePlayer";
import { TopView } from "./cube/Diagrams";
import { OLL_CASES, PLL_CASES } from "@/data/algs";
import { bestAuf, caseState } from "@/lib/cube";
import { useProgress } from "@/lib/progress";
import { useIsClient } from "@/lib/useIsClient";

type DrillSet = "pll" | "oll" | "2look";
type Pool = "all" | "mine";

interface DrillCase {
  id: string;
  name: string;
  alg: string;
  auf: string;
  kind: "oll" | "pll";
}

const ALL: DrillCase[] = [
  ...OLL_CASES.map((c) => ({ id: c.id, name: `OLL ${c.num}${c.name ? ` ·${c.name}` : ""}`, alg: c.alg, auf: "", kind: "oll" as const })),
  ...PLL_CASES.map((c) => ({ id: c.id, name: `${c.name} perm`, alg: c.alg, auf: bestAuf(c.alg), kind: "pll" as const })),
];
const TWO_LOOK = new Set(["oll-21", "oll-22", "oll-23", "oll-24", "oll-25", "oll-26", "oll-27", "pll-T", "pll-Y", "pll-Ua", "pll-Ub", "pll-H", "pll-Z"]);
const PRE = ["", "U", "U2", "U'"];

// Show the case from a random angle, like a real solve, so you practice recognizing it.
const pick = (cases: DrillCase[]) => ({
  c: cases[Math.floor(Math.random() * cases.length)],
  pre: PRE[Math.floor(Math.random() * 4)],
});

export default function Drill() {
  // Cases are random, so only render once we are on the client (avoids a hydration mismatch).
  return useIsClient() ? <DrillInner /> : <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />;
}

function DrillInner() {
  const [set, setSetRaw] = useState<DrillSet>("pll");
  const [pool, setPoolRaw] = useState<Pool>("all");
  const { status } = useProgress();

  const casesFor = (s: DrillSet, p: Pool) => {
    let list = ALL.filter((c) => (s === "2look" ? TWO_LOOK.has(c.id) : c.kind === s));
    if (p === "mine") {
      const mine = list.filter((c) => status(c.id));
      if (mine.length) list = mine;
    }
    return list;
  };

  const [current, setCurrent] = useState(() => pick(casesFor("pll", "all")));
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const next = (s = set, p = pool) => {
    setCurrent(pick(casesFor(s, p)));
    setRevealed(false);
  };
  const setSet = (s: DrillSet) => {
    setSetRaw(s);
    next(s, pool);
  };
  const setPool = (p: Pool) => {
    setPoolRaw(p);
    next(set, p);
  };

  const grade = (ok: boolean) => {
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    next();
  };

  const state = current ? caseState(`${current.pre} ${current.c.alg} ${current.c.auf}`) : null;
  const mineCount = ALL.filter((c) => (set === "2look" ? TWO_LOOK.has(c.id) : c.kind === set) && status(c.id)).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["pll", "PLL (21)"],
              ["oll", "OLL (57)"],
              ["2look", "2-look only"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSet(k)}
              className={`h-9 rounded-full px-4 text-sm font-medium ${set === k ? "bg-white text-black" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`}
            >
              {l}
            </button>
          ))}
          <select
            value={pool}
            onChange={(e) => setPool(e.target.value as Pool)}
            className="h-9 w-full rounded-full border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200 sm:ml-auto sm:w-auto"
            aria-label="Which cases"
          >
            <option value="all">All cases</option>
            <option value="mine">Only ones I&apos;m learning / learned ({mineCount})</option>
          </select>
        </div>

        {current && state && (
          <div className="flex flex-col items-center rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
            <div className="mb-1 text-sm text-zinc-400">What case is this? What&apos;s the algorithm?</div>
            <div className="mb-4 text-xs text-zinc-600">The case may be turned; you might need a U turn first.</div>
            <TopView state={state} mask={current.c.kind === "oll" ? "oll" : "full"} className="w-full max-w-[260px]" />
            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="mt-6 rounded-full bg-amber-400 px-6 py-2.5 font-semibold text-black hover:bg-amber-300">
                Reveal
              </button>
            ) : (
              <div className="mt-5 w-full text-center">
                <div className="text-2xl font-bold text-white">{current.c.name}</div>
                <div className="alg mt-1 text-amber-200">
                  {current.pre && <span className="text-zinc-400">({current.pre}) </span>}
                  {current.c.alg}
                  {current.c.auf && <span className="text-zinc-400"> (+{current.c.auf})</span>}
                </div>
                <div className="mt-5 flex justify-center gap-2">
                  <button onClick={() => grade(false)} className="rounded-full border border-red-400/40 px-5 py-2 text-red-300 hover:bg-red-400/10">
                    Missed it
                  </button>
                  <button onClick={() => grade(true)} className="rounded-full bg-emerald-400 px-5 py-2 font-semibold text-black hover:bg-emerald-300">
                    Got it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="text-center text-sm text-zinc-500">
          Score: <span className="font-mono text-zinc-200">{score.right}/{score.total}</span>
          {score.total > 0 && ` (${Math.round((score.right / score.total) * 100)}%)`}
        </div>
      </div>

      <div>
        {revealed && current ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <CubePlayer
              key={`${current.c.id}-${current.pre}`}
              alg={`${current.pre} ${current.c.alg}`.trim()}
              auf={current.c.auf}
              mask={current.c.kind === "oll" ? "oll" : "full"}
              autoPlay
            />
          </div>
        ) : (
          <div className="flex h-full min-h-72 items-center justify-center rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
            Name the case and do it on your real cube, then reveal to check.
          </div>
        )}
      </div>
    </div>
  );
}
