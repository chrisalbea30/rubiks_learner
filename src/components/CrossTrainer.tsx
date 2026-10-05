"use client";

import { useState } from "react";
import CubePlayer from "./cube/CubePlayer";
import { NetView } from "./cube/Diagrams";
import { SOLVED, applyAlg, parseAlg, randomScramble } from "@/lib/cube";
import { solveCross } from "@/lib/crossSolver";
import { useIsClient } from "@/lib/useIsClient";

export default function CrossTrainer() {
  // Scrambles are random, so only render once we are on the client (avoids a hydration mismatch).
  return useIsClient() ? <Trainer /> : <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />;
}

function Trainer() {
  const [scramble, setScramble] = useState(() => randomScramble(18));
  const [solution, setSolution] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [onlyCross, setOnlyCross] = useState(true);

  const next = () => {
    setScramble(randomScramble(18));
    setSolution(null);
    setRevealed(false);
  };

  const reveal = () => {
    // Let the button paint its pressed state before the (one-time) table build.
    setTimeout(() => {
      setSolution(solveCross(applyAlg(SOLVED, scramble)));
      setRevealed(true);
    }, 10);
  };

  const moves = solution ? parseAlg(solution).length : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Scramble (yellow on top, green in front)</div>
          <div className="alg mt-1 text-lg leading-relaxed text-amber-100">{scramble}</div>
        </div>
        <NetView state={applyAlg(SOLVED, scramble)} mask={onlyCross ? "cross" : "full"} className="w-full max-w-md" />
        <div className="flex flex-wrap gap-2">
          <button onClick={next} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">
            New scramble
          </button>
          <button
            onClick={() => setOnlyCross((v) => !v)}
            className={`rounded-full px-4 py-2 text-sm ${onlyCross ? "bg-sky-500/20 text-sky-300" : "bg-white/5 text-zinc-300"}`}
          >
            {onlyCross ? "Showing white edges only" : "Showing all colours"}
          </button>
          {!revealed && (
            <button onClick={reveal} className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300">
              Show the best cross
            </button>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          Scramble your real cube, take 15 seconds to plan the cross in your head, solve it, then compare with the shortest solution.
        </p>
      </div>
      <div>
        {revealed && solution !== null ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="text-lg font-semibold text-white">Shortest cross</div>
              <div className="font-mono text-sm text-amber-300">{moves} moves</div>
            </div>
            {moves === 0 ? (
              <p className="text-zinc-400">The cross is already solved. Lucky!</p>
            ) : (
              <CubePlayer alg={solution} setup={scramble} mask={onlyCross ? "cross" : "full"} view="bottom" autoPlay />
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-72 items-center justify-center rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">
            Plan your cross first. The animated solution appears here.
          </div>
        )}
      </div>
    </div>
  );
}
