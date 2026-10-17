"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CubePlayer from "../cube/CubePlayer";
import { NetView } from "../cube/Diagrams";
import { parseAlg, type CubeState } from "@/lib/cube";
import { paletteOf, type Scheme } from "@/lib/cubeInput";
import { quickSolve } from "@/lib/quickSolve";

export default function QuickSolution({ state, scheme, onEdit }: { state: CubeState; scheme: Scheme; onEdit: () => void }) {
  const [result, setResult] = useState<{ alg?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    quickSolve(state).then(
      (alg) => live && setResult({ alg }),
      (e: Error) => live && setResult({ error: e.message }),
    );
    return () => {
      live = false;
    };
  }, [state]);

  const palette = paletteOf(scheme);
  const moves = result?.alg ? parseAlg(result.alg) : [];
  // Group moves in fives so they're easier to follow on a real cube.
  const groups: string[][] = [];
  moves.forEach((m, i) => (i % 5 === 0 ? groups.push([m.token]) : groups[groups.length - 1].push(m.token)));

  return (
    <div className="space-y-5">
      <button onClick={onEdit} className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
        ← Edit my cube
      </button>

      {!result && (
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 text-zinc-300" aria-live="polite">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          Finding a short solution… (the first one takes a second)
        </div>
      )}

      {result?.error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          Couldn&apos;t solve this cube: {result.error}. Please double-check the colours you entered.
        </div>
      )}

      {result?.alg !== undefined && !result.error && (
        moves.length === 0 ? (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-8 text-center text-2xl font-bold text-emerald-300">
            Your cube is already solved!
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">Quick solve</div>
              <h2 className="text-2xl font-bold text-white">{moves.length} moves to solved</h2>
              <p className="mt-2 leading-relaxed text-zinc-300">
                Hold your cube with <b className="text-white">{scheme.D}</b> on the bottom and <b className="text-white">{scheme.F}</b> facing you, then do
                these turns in order. This follows no method; it&apos;s simply a very short way from your cube to solved.
              </p>
              <div className="mt-4 space-y-1.5">
                {groups.map((g, k) => (
                  <div key={k} className="flex items-baseline gap-3 rounded-xl bg-black/30 px-3 py-2">
                    <span className="w-5 shrink-0 font-mono text-xs text-zinc-500">{k * 5 + 1}</span>
                    <span className="alg break-words text-lg text-amber-100">{g.join(" ")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(result.alg!).then(() => setCopied(true), () => {});
                  }}
                  className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
                >
                  {copied ? "Copied ✓" : "Copy moves"}
                </button>
                <Link href="/notation" className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
                  What do the letters mean?
                </Link>
              </div>
              <div className="mt-5">
                <div className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Your cube now</div>
                <NetView state={state} palette={palette} className="w-full max-w-xs" />
              </div>
            </div>
            <div className="min-w-0">
              <CubePlayer alg={result.alg!} startState={state} palette={palette} hotkeys />
              <p className="mt-2 text-xs text-zinc-500">
                Press play, or step through one move at a time (<kbd>Space</kbd> plays / pauses). Tap any move to replay just that turn.
              </p>
            </div>
          </section>
        )
      )}
    </div>
  );
}
