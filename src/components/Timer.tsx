"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NetView } from "./cube/Diagrams";
import { SOLVED, applyAlg, randomScramble } from "@/lib/cube";
import { useTimes } from "@/lib/progress";
import { useIsClient } from "@/lib/useIsClient";

type Phase = "idle" | "holding" | "ready" | "running";

export const fmt = (ms: number) => {
  const s = ms / 1000;
  if (s < 60) return s.toFixed(2);
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
};

function average(times: number[], n: number): number | null {
  if (times.length < n) return null;
  const last = times.slice(0, n).sort((a, b) => a - b);
  const trimmed = last.slice(1, -1); // drop best and worst
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export default function Timer() {
  // Scrambles are random, so only render once we are on the client (avoids a hydration mismatch).
  return useIsClient() ? <TimerInner /> : <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />;
}

function TimerInner() {
  const { times, add, remove, clear } = useTimes();
  const [scramble, setScramble] = useState(() => randomScramble());
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);
  const phaseRef = useRef<Phase>("idle");

  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };


  const press = useCallback(() => {
    const p = phaseRef.current;
    if (p === "running") {
      cancelAnimationFrame(raf.current);
      const t = performance.now() - start.current;
      setElapsed(t);
      add(t);
      setScramble(randomScramble());
      setP("idle");
      return;
    }
    if (p === "idle") {
      setP("holding");
      holdTimer.current = setTimeout(() => setP("ready"), 350);
    }
  }, [add]);

  const release = useCallback(() => {
    const p = phaseRef.current;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (p === "ready") {
      start.current = performance.now();
      setElapsed(0);
      setP("running");
      const tick = () => {
        setElapsed(performance.now() - start.current);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    } else if (p === "holding") setP("idle");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (phaseRef.current === "running") {
        e.preventDefault();
        press();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) press();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      cancelAnimationFrame(raf.current);
    };
  }, [press, release]);

  const best = times.length ? Math.min(...times) : null;
  const ao5 = average(times, 5);
  const ao12 = average(times, 12);
  const color = phase === "holding" ? "text-red-400" : phase === "ready" ? "text-emerald-400" : "text-white";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Scramble (yellow top, green front)</div>
            <button onClick={() => setScramble(randomScramble())} className="shrink-0 whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:text-white">
              New scramble
            </button>
          </div>
          <div className="alg mt-1 text-xl leading-relaxed text-amber-100">{scramble}</div>
        </div>

        <div
          className="flex min-h-64 select-none flex-col items-center justify-center rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-8"
          onTouchStart={(e) => {
            e.preventDefault();
            press();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            release();
          }}
        >
          <div className={`font-mono text-6xl font-bold tabular-nums sm:text-8xl ${color}`}>{fmt(elapsed)}</div>
          <div className="mt-4 text-sm text-zinc-500">
            {phase === "running"
              ? "Press any key (or tap) to stop"
              : phase === "ready"
                ? "Release to start"
                : "Hold space (or touch here) until green, then release"}
          </div>
        </div>

        {scramble && phase !== "running" && (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">What your cube should look like after scrambling</div>
            <NetView state={applyAlg(SOLVED, scramble)} className="w-full max-w-md" />
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Best", best],
            ["Ao5", ao5],
            ["Ao12", ao12],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
              <div className="text-xs text-zinc-500">{l}</div>
              <div className="font-mono text-lg font-semibold text-white">{v === null ? "–" : fmt(v as number)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Solves ({times.length})</div>
            {times.length > 0 && (
              <button
                onClick={() => confirm("Delete all solve times?") && clear()}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
          <ol className="max-h-96 space-y-1 overflow-y-auto pr-1">
            {times.map((t, i) => (
              <li key={`${i}-${t}`} className="group flex items-center justify-between rounded-lg px-2 py-1 font-mono text-sm hover:bg-white/5">
                <span className="text-zinc-500">{times.length - i}.</span>
                <span className={t === best ? "text-emerald-300" : "text-zinc-200"}>{fmt(t)}</span>
                <button onClick={() => remove(i)} className="text-xs text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100" aria-label="Delete">
                  ✕
                </button>
              </li>
            ))}
            {times.length === 0 && <li className="text-sm text-zinc-500">No solves yet.</li>}
          </ol>
        </div>
        <p className="text-xs text-zinc-500">Ao5 / Ao12: average of your last 5 / 12 solves, dropping the best and worst (the official way).</p>
      </aside>
    </div>
  );
}
