"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SOLVED, applyAlg, applyMove, caseState, invertMove, moveGeometry, parseAlg,
  type CubeState, type Mask, type Palette,
} from "@/lib/cube";
import { CubeScene, type CameraView } from "./CubeScene";

export interface CubePlayerProps {
  alg: string;
  /**
   * Where the animation starts. By default it starts from the case the algorithm solves.
   * Pass "" to start from a solved cube, or any algorithm to apply to a solved cube first.
   */
  setup?: string;
  mask?: Mask;
  autoPlay?: boolean;
  loop?: boolean;
  labels?: boolean;
  view?: CameraView;
  /** Hide the transport controls (for small looping demos). */
  minimal?: boolean;
  className?: string;
  /** Extra moves shown after the algorithm, e.g. a final AUF. Rendered as a separate chip. */
  auf?: string;
  /** Exact starting state (overrides setup), e.g. a step of a solve. */
  startState?: CubeState;
  /** Colours of the cube being shown (defaults to the standard scheme). */
  palette?: Palette;
}

const BASE_MS = 420;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CubePlayer({
  alg,
  setup,
  mask = "full",
  autoPlay = false,
  loop = false,
  labels = false,
  view = "standard",
  minimal = false,
  className = "",
  auf = "",
  startState,
  palette,
}: CubePlayerProps) {
  const holder = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);

  const fullAlg = auf ? `${alg} ${auf}` : alg;
  const { moves, states, error } = useMemo(() => {
    try {
      const moves = parseAlg(fullAlg);
      const start: CubeState = startState ?? (setup === undefined ? caseState(fullAlg) : applyAlg(SOLVED, setup));
      const states = [start];
      moves.forEach((m, i) => states.push(applyMove(states[i], m)));
      return { moves, states, error: null };
    } catch (e) {
      return { moves: [], states: [SOLVED], error: (e as Error).message };
    }
  }, [fullAlg, setup, startState]);
  const algLen = useMemo(() => {
    try {
      return parseAlg(alg).length;
    } catch {
      return 0;
    }
  }, [alg]);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [looping, setLooping] = useState(loop);
  const [showLabels, setShowLabels] = useState(labels);
  const [camView, setCamView] = useState<CameraView>(view);
  const [animating, setAnimating] = useState<number | null>(null);

  const [runId, setRunId] = useState(0);

  const stepRef = useRef(0);
  const busy = useRef(false);
  const gen = useRef(0);
  const speedRef = useRef(speed);
  const loopRef = useRef(looping);
  const statesRef = useRef(states);
  const movesRef = useRef(moves);
  useEffect(() => {
    speedRef.current = speed;
    loopRef.current = looping;
    statesRef.current = states;
    movesRef.current = moves;
  });

  // Create the WebGL scene once.
  useEffect(() => {
    if (!holder.current) return;
    const scene = new CubeScene(holder.current, statesRef.current[0]);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current?.setMask(mask), [mask]);
  useEffect(() => {
    if (palette) sceneRef.current?.setPalette(palette);
  }, [palette]);
  useEffect(() => sceneRef.current?.setLabels(showLabels), [showLabels]);
  useEffect(() => sceneRef.current?.setView(camView), [camView]);

  const jump = useCallback((i: number) => {
    gen.current++;
    busy.current = false;
    stepRef.current = i;
    setStep(i);
    setAnimating(null);
    sceneRef.current?.setState(statesRef.current[i]);
  }, []);

  // New algorithm: reset React state during render, then sync the scene in an effect.
  const [prevStates, setPrevStates] = useState(states);
  if (prevStates !== states) {
    setPrevStates(states);
    setStep(0);
    setAnimating(null);
    setPlaying(autoPlay);
    setRunId((r) => r + 1);
  }
  useEffect(() => {
    gen.current++;
    busy.current = false;
    stepRef.current = 0;
    statesRef.current = states;
    sceneRef.current?.setState(states[0]);
  }, [states]);

  const duration = (i: number) => {
    const m = movesRef.current[i];
    return (BASE_MS * (m.turns === 2 ? 1.45 : 1)) / speedRef.current;
  };

  const forward = useCallback(async () => {
    const scene = sceneRef.current;
    const i = stepRef.current;
    if (!scene || busy.current || i >= movesRef.current.length) return false;
    busy.current = true;
    const my = gen.current;
    setAnimating(i);
    await scene.animate(moveGeometry(movesRef.current[i]), duration(i), statesRef.current[i + 1]);
    if (my !== gen.current) return false;
    busy.current = false;
    stepRef.current = i + 1;
    setStep(i + 1);
    setAnimating(null);
    return true;
  }, []);

  const backward = useCallback(async () => {
    const scene = sceneRef.current;
    const i = stepRef.current;
    if (!scene || busy.current || i <= 0) return;
    busy.current = true;
    const my = gen.current;
    setAnimating(i - 1);
    await scene.animate(moveGeometry(invertMove(movesRef.current[i - 1])), duration(i - 1), statesRef.current[i - 1]);
    if (my !== gen.current) return;
    busy.current = false;
    stepRef.current = i - 1;
    setStep(i - 1);
    setAnimating(null);
  }, []);

  // Playback loop
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    (async () => {
      if (stepRef.current >= movesRef.current.length) {
        jump(0);
        await sleep(450);
      }
      const runGen = gen.current;
      while (!cancelled && runGen === gen.current) {
        if (stepRef.current >= movesRef.current.length) {
          if (!loopRef.current) {
            setPlaying(false);
            return;
          }
          await sleep(1300);
          if (cancelled || runGen !== gen.current) return;
          sceneRef.current?.setState(statesRef.current[0]);
          stepRef.current = 0;
          setStep(0);
          await sleep(700);
          continue;
        }
        const ok = await forward();
        if (!ok && runGen !== gen.current) return;
        await sleep(90 / speedRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playing, runId, forward, jump]);

  const pause = () => setPlaying(false);
  const n = moves.length;

  const clickMove = async (i: number) => {
    setPlaying(false);
    jump(i);
    await sleep(60);
    forward();
  };

  if (error) {
    return <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">Could not read algorithm: {error}</div>;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative">
        <div
          ref={holder}
          className={`relative w-full overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--color-stage-1),_var(--color-stage-2))] ${minimal ? "aspect-square" : "aspect-[4/3]"}`}
          aria-label={`3D cube animating ${fullAlg}`}
        />
        {animating !== null && moves[animating] && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/55 px-3 py-1.5 font-mono text-2xl font-bold text-white backdrop-blur">
            {moves[animating].token}
          </div>
        )}
        {!minimal && (
          <>
            <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/40 px-2 py-0.5 font-mono text-xs text-zinc-300">
              {step}/{n}
            </div>
            <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-white/45">drag sideways to spin</div>
          </>
        )}
        {minimal && (
          <button
            onClick={() => (playing ? pause() : setPlaying(true))}
            className="absolute inset-0"
            aria-label={playing ? "Pause" : "Play"}
          />
        )}
      </div>

      {!minimal && (
        <>
          <div className="flex flex-wrap gap-1.5 font-mono text-sm" aria-label="Algorithm moves">
            {moves.map((m, i) => {
              const isAuf = i >= algLen;
              const state = animating === i ? "now" : i < step ? "done" : "todo";
              return (
                <button
                  key={i}
                  onClick={() => clickMove(i)}
                  title={isAuf ? "Final U turn to line up the top layer (AUF)" : `Play move ${i + 1}`}
                  className={`rounded-md px-2 py-1 transition-colors ${
                    state === "now"
                      ? "bg-amber-400 text-black"
                      : state === "done"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/5 text-zinc-200 hover:bg-white/10"
                  } ${isAuf ? "border border-dashed border-white/25" : ""}`}
                >
                  {isAuf && i === algLen ? "+" : ""}
                  {m.token}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
            <Ctrl label="Restart" onClick={() => { setPlaying(false); jump(0); }}>
              <path d="M6 5v14M18 5l-9 7 9 7z" />
            </Ctrl>
            <Ctrl label="Step back" onClick={() => { setPlaying(false); backward(); }} disabled={step === 0}>
              <path d="M15 5l-8 7 8 7z" />
            </Ctrl>
            <button
              onClick={() => (playing ? pause() : setPlaying(true))}
              className="flex h-9 min-w-[96px] items-center sm:h-10 justify-center gap-2 rounded-full bg-amber-400 px-4 font-semibold text-black hover:bg-amber-300 sm:px-5"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                {playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4l13 8-13 8z" />}
              </svg>
              {playing ? "Pause" : step >= n ? "Replay" : "Play"}
            </button>
            <Ctrl label="Step forward" onClick={() => { setPlaying(false); forward(); }} disabled={step >= n}>
              <path d="M9 5l8 7-8 7z" />
            </Ctrl>
            <Ctrl label="Jump to end" onClick={() => { setPlaying(false); jump(n); }}>
              <path d="M18 5v14M6 5l9 7-9 7z" />
            </Ctrl>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="h-8 rounded-md border border-white/10 bg-zinc-900 px-2 text-xs text-zinc-200"
                aria-label="Speed"
              >
                <option value={0.35}>0.35× slow</option>
                <option value={0.6}>0.6×</option>
                <option value={1}>1×</option>
                <option value={1.6}>1.6×</option>
                <option value={2.5}>2.5× fast</option>
              </select>
              <Toggle on={looping} onClick={() => setLooping((v) => !v)}>Loop</Toggle>
              <Toggle on={showLabels} onClick={() => setShowLabels((v) => !v)}>Face letters</Toggle>
              <Toggle on={camView === "bottom"} onClick={() => setCamView((v) => (v === "bottom" ? "standard" : "bottom"))}>
                See bottom
              </Toggle>
              <button
                onClick={() => sceneRef.current?.resetView()}
                className="h-8 rounded-md px-2 text-xs text-zinc-400 hover:text-zinc-100"
              >
                Reset view
              </button>
          </div>
        </>
      )}
    </div>
  );
}

function Ctrl({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center sm:h-10 sm:w-10 justify-center rounded-full bg-white/5 text-zinc-200 hover:bg-white/10 disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current stroke-current" strokeWidth={2} strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`h-8 rounded-md px-2.5 text-xs transition-colors ${on ? "bg-sky-500/20 text-sky-300" : "bg-white/5 text-zinc-400 hover:text-zinc-100"}`}
    >
      {children}
    </button>
  );
}
