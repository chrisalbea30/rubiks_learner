"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CubePlayer from "../cube/CubePlayer";
import { IsoView, TopView } from "../cube/Diagrams";
import { paletteOf, type Mode } from "@/lib/cubeInput";
import { STAGE_LABEL, type Method, type Solution, type Stage } from "@/lib/solver";

const STAGES: Stage[] = ["cross", "f2l", "oll", "pll"];
const FIRST_STAGE: Record<Mode, Stage> = { scratch: "cross", f2l: "f2l", oll: "oll", pll: "pll" };

interface Props {
  solution: Solution;
  method: Method;
  onMethod: (m: Method) => void;
  onEdit: () => void;
  mode: Mode;
}

export default function SolutionView({ solution, method, onMethod, onEdit, mode }: Props) {
  const { steps, error } = solution;
  const [i, setI] = useState(0);
  const [all, setAll] = useState(false);
  const [done, setDone] = useState(false);
  // Player settings carry over from step to step: pausing stops autoplay on the next step,
  // and a chosen speed or loop setting sticks until changed.
  const [prefs, setPrefs] = useState({ autoPlay: true, speed: 1, loop: false });
  const total = steps.reduce((a, s) => a + s.moves, 0);
  const step = steps[Math.min(i, steps.length - 1)];
  const stages = STAGES.slice(STAGES.indexOf(FIRST_STAGE[mode]));

  const go = (k: number, scroll = true) => {
    setDone(false);
    setI(Math.max(0, Math.min(steps.length - 1, k)));
    if (scroll) document.getElementById("step-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Left / right arrow keys: previous / next step. On the last step, right arrow marks it finished.
  const nav = useRef({ i, last: steps.length - 1 });
  useEffect(() => {
    nav.current = { i, last: steps.length - 1 };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = nav.current;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (n.i < n.last) {
          setDone(false);
          setI(n.i + 1);
        } else setDone(true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setDone(false);
        setI(Math.max(0, n.i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onEdit} className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
          ← Edit my cube
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Segmented
            value={all ? "all" : "step"}
            options={[
              ["step", "Step by step"],
              ["all", "Full solution"],
            ]}
            onChange={(v) => setAll(v === "all")}
          />
          <Segmented
            value={method}
            options={[
              ["2look", "2-look OLL/PLL"],
              ["full", "Full OLL/PLL"],
            ]}
            onChange={(v) => {
              onMethod(v as Method);
              setI(0);
              setDone(false);
            }}
          />
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {steps.length === 0 && !error ? (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-8 text-center">
          <div className="text-2xl font-bold text-emerald-300">Your cube is already solved!</div>
          <p className="mt-2 text-zinc-400">Scramble it and try again.</p>
        </div>
      ) : (
        steps.length > 0 && (
          <>
            {/* Stage progress */}
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stages.map((st) => {
                const idx = steps.map((s, k) => (s.stage === st ? k : -1)).filter((k) => k >= 0);
                const state = idx.length === 0 ? "skip" : idx.every((k) => k < i || (done && k <= i)) ? "done" : idx.includes(i) ? "now" : "todo";
                return (
                  <li key={st}>
                    <button
                      onClick={() => idx.length && go(idx[0])}
                      disabled={!idx.length}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        state === "now" ? "border-amber-400/70 bg-amber-400/10" : state === "done" ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "border-white/[0.07] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{STAGE_LABEL[st]}</span>
                        <span className="text-sm">{state === "done" ? "✓" : state === "skip" ? "—" : ""}</span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {state === "skip" ? "Already done" : `${idx.length} step${idx.length > 1 ? "s" : ""} · ${idx.reduce((a, k) => a + steps[k].moves, 0)} moves`}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Current step */}
            <section id="step-card" className="scroll-mt-20 grid grid-cols-1 gap-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold uppercase tracking-wider text-amber-300">{STAGE_LABEL[step.stage]}</span>
                  <span className="text-zinc-500">
                    Step {i + 1} of {steps.length}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">{step.title}</h2>
                <p className="mt-2 leading-relaxed text-zinc-300">{step.detail}</p>
                {step.caseName && (
                  <div className="mt-3 text-sm text-zinc-400">
                    Case: <span className="font-semibold text-zinc-100">{step.caseName}</span>
                    {step.learnHref && (
                      <Link href={step.learnHref} className="ml-2 text-sky-300 underline underline-offset-2">
                        Learn it
                      </Link>
                    )}
                  </div>
                )}
                <div className="mt-4">
                  <div className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Do these moves ({step.moves})</div>
                  <div className="alg break-words rounded-xl bg-black/30 p-3 text-lg leading-relaxed text-amber-100">{step.alg}</div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="w-28 shrink-0 sm:w-32">
                    {step.stage === "oll" || step.stage === "pll" ? (
                      <TopView state={step.start} palette={paletteOf(step.scheme)} mask={step.mask} arrows={step.stage === "pll" && step.mask === "full"} />
                    ) : (
                      <IsoView state={step.start} palette={paletteOf(step.scheme)} mask={step.mask} from={step.stage === "cross" ? "bottom" : "top"} />
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">
                    {step.stage === "oll" || step.stage === "pll"
                      ? "Your top layer before this step, seen from above (front at the bottom)."
                      : step.stage === "cross"
                        ? "Your cube from below, before this step."
                        : "Your cube before this step."}{" "}
                    Hold it with <b className="text-zinc-200">{step.scheme.F}</b> in front and <b className="text-zinc-200">{step.scheme.U}</b> on top.
                  </p>
                </div>
              </div>
              <div className="min-w-0">
                <CubePlayer
                  key={`${method}-${i}`}
                  alg={step.alg}
                  startState={step.start}
                  palette={paletteOf(step.scheme)}
                  mask={step.mask}
                  view={step.stage === "cross" ? "bottom" : "standard"}
                  autoPlay={prefs.autoPlay}
                  speed={prefs.speed}
                  loop={prefs.loop}
                  onPlayIntent={(p) => setPrefs((x) => ({ ...x, autoPlay: p }))}
                  onSpeedChange={(s) => setPrefs((x) => ({ ...x, speed: s }))}
                  onLoopChange={(l) => setPrefs((x) => ({ ...x, loop: l }))}
                  hotkeys
                />
                <p className="mt-2 hidden text-center text-xs text-zinc-500 sm:block">
                  Keys: <kbd>←</kbd> <kbd>→</kbd> previous / next step · <kbd>Space</kbd> play / pause
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:col-span-2">
                <button onClick={() => go(i - 1)} disabled={i === 0} className="rounded-full bg-white/5 px-5 py-2.5 text-sm text-zinc-200 hover:bg-white/10 disabled:opacity-30">
                  ← Previous
                </button>
                {i < steps.length - 1 ? (
                  <button onClick={() => go(i + 1)} className="ml-auto rounded-full bg-amber-400 px-5 py-2.5 font-semibold text-black hover:bg-amber-300">
                    Done, next step →
                  </button>
                ) : (
                  <button onClick={() => setDone(true)} className="ml-auto rounded-full bg-emerald-400 px-5 py-2.5 font-semibold text-black hover:bg-emerald-300">
                    Done, finished! ✓
                  </button>
                )}
              </div>
            </section>

            {done && (
              <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center">
                <div className="text-2xl font-bold text-emerald-300">Solved! 🎉</div>
                <p className="mt-1 text-zinc-400">
                  {steps.length} steps, {total} moves. Scramble again and enter it to practise, or time yourself in{" "}
                  <Link href="/practice" className="text-sky-300 underline underline-offset-2">
                    Practice
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Step list */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">{all ? `Full solution · ${total} moves` : "Your steps"}</h3>
              <ol className="space-y-1.5">
                {steps.map((s, k) => {
                  if (!all && k > i) return null;
                  const newStage = k === 0 || steps[k - 1].stage !== s.stage;
                  return (
                    <li key={k}>
                      {newStage && <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{STAGE_LABEL[s.stage]}</div>}
                      <button
                        onClick={() => go(k)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${k === i ? "border-amber-400/60 bg-amber-400/[0.07]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${k < i || (done && k === i) ? "bg-emerald-400 text-black" : "bg-white/10 text-zinc-300"}`}>
                          {k < i || (done && k === i) ? "✓" : k + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-zinc-100">{s.title}</span>
                          <span className="alg block break-words text-xs text-zinc-400">{s.alg}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-zinc-500">{s.moves}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {!all && i < steps.length - 1 && (
                <p className="mt-2 text-sm text-zinc-500">
                  {steps.length - 1 - i} more step{steps.length - 1 - i > 1 ? "s" : ""} after this.{" "}
                  <button onClick={() => setAll(true)} className="text-sky-300 underline underline-offset-2">
                    Show them all
                  </button>
                </p>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-full bg-white/5 p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${value === v ? "bg-white text-black" : "text-zinc-300 hover:text-white"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
