"use client";

import { useEffect, useState } from "react";
import CubePlayer from "../cube/CubePlayer";
import { NetView } from "../cube/Diagrams";
import { applyAlg, parseAlg, type CubeState } from "@/lib/cube";
import { quickSolve, splitPhases } from "@/lib/quickSolve";
import { exampleState } from "@/lib/solveExamples";
import { useIsClient } from "@/lib/useIsClient";

interface Demo {
  start: CubeState;
  mid: CubeState;
  phase1: string;
  phase2: string;
}

/** A random scramble solved live, shown as its two phases. */
export default function QuickTutorialDemo() {
  return useIsClient() ? <DemoInner /> : <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />;
}

function DemoInner() {
  const [start, setStart] = useState(() => exampleState("scratch"));
  const [demo, setDemo] = useState<Demo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    quickSolve(start).then(
      (alg) => {
        if (!live) return;
        const { phase1, phase2 } = splitPhases(alg);
        setDemo({ start, mid: applyAlg(start, phase1), phase1, phase2 });
      },
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [start]);

  const count = (a: string) => (a ? parseAlg(a).length : 0);

  if (error) return <p className="text-sm text-red-300">Couldn&apos;t run the example: {error}</p>;
  if (!demo)
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 text-zinc-300">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        Solving an example scramble…
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-zinc-400">
          Total: <b className="text-white">{count(demo.phase1) + count(demo.phase2)} moves</b> = {count(demo.phase1)} in phase 1 + {count(demo.phase2)} in phase 2
        </div>
        <button
          onClick={() => {
            setDemo(null);
            setStart(exampleState("scratch"));
          }}
          className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
        >
          New example
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PhaseCard
          n={1}
          title="Phase 1: sort the colours"
          text="Any turns allowed. The goal isn't solved; it's a cube where the top and bottom faces show only yellow and white, and the middle-layer edges are back in the middle layer. Watch the top fill up with yellow and white."
          alg={demo.phase1}
          start={demo.start}
          before="Scrambled"
          end={demo.mid}
          after="After phase 1: only yellow and white on top and bottom"
        />
        <PhaseCard
          n={2}
          title="Phase 2: finish with gentle moves"
          text="Only U and D turns plus half turns (R2, L2, F2, B2). These moves never mess up what phase 1 sorted, so the cube can be finished without undoing it."
          alg={demo.phase2}
          start={demo.mid}
          before="Start of phase 2"
          end={applyAlg(demo.mid, demo.phase2)}
          after="Solved"
        />
      </div>
    </div>
  );
}

function PhaseCard({
  n,
  title,
  text,
  alg,
  start,
  before,
  end,
  after,
}: {
  n: number;
  title: string;
  text: string;
  alg: string;
  start: CubeState;
  before: string;
  end: CubeState;
  after: string;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">Phase {n}</div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
      <div className="alg mt-3 break-words rounded-xl bg-black/30 p-3 text-amber-100">{alg || "(nothing needed)"}</div>
      <div className="mt-4">
        {alg ? <CubePlayer alg={alg} startState={start} /> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <figure>
          <NetView state={start} className="w-full" />
          <figcaption className="mt-1 text-xs text-zinc-500">{before}</figcaption>
        </figure>
        <figure>
          <NetView state={end} className="w-full" />
          <figcaption className="mt-1 text-xs text-zinc-500">{after}</figcaption>
        </figure>
      </div>
    </section>
  );
}
