"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STICKERS, type Face } from "@/lib/cube";
import {
  COLORS, COLOR_HEX, COLOR_KEY, MODES, buildState, defaultFront, frontOptions, isLocked, schemeFor,
  startingStickers, stickersFromState, type Color, type Mode, type Scheme, type Stickers,
} from "@/lib/cubeInput";
import type { RGB } from "@/lib/colorDetect";
import { solve, type Method } from "@/lib/solver";
import { exampleState } from "@/lib/solveExamples";
import { useIsClient } from "@/lib/useIsClient";
import CubePreview from "./CubePreview";
import FaceCapture from "./FaceCapture";
import SolutionView from "./SolutionView";
import { FACE_NAME, NEIGHBORS, editableOrder, faceSlots, facesFor, holdHint } from "./faces";

const KEY = "cfop-mycube-v1";
const EMPTY = "#262a33";

interface Saved {
  mode: Mode;
  base: Color;
  front: Color;
  stickers: Stickers;
  method: Method;
}

function loadSaved(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    return s && Array.isArray(s.stickers) && s.stickers.length === 54 ? s : null;
  } catch {
    return null;
  }
}

const darkText = (c: Color | null) => c === "white" || c === "yellow";

export default function MyCube() {
  // Uses saved progress from this browser, so render only on the client.
  return useIsClient() ? <Editor /> : <div className="h-[32rem] animate-pulse rounded-3xl bg-white/[0.03]" />;
}

function Editor() {
  const [initial] = useState(() => {
    const saved = loadSaved();
    if (saved) return saved;
    return { mode: "scratch" as Mode, base: "white" as Color, front: "green" as Color, stickers: startingStickers("scratch", schemeFor("white", "green")), method: "2look" as Method };
  });
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [base, setBase] = useState<Color>(initial.base);
  const [front, setFront] = useState<Color>(initial.front);
  const [stickers, setStickers] = useState<Stickers>(initial.stickers);
  const [method, setMethod] = useState<Method>(initial.method);
  const scheme = useMemo(() => schemeFor(base, front), [base, front]);

  const order = useMemo(() => editableOrder(mode), [mode]);
  const firstEmpty = (st: Stickers, from = -1) => {
    const start = order.indexOf(from) + 1;
    for (let k = 0; k < order.length; k++) {
      const slot = order[(start + k) % order.length];
      if (st[slot] === null) return slot;
    }
    return null;
  };

  const [cursor, setCursor] = useState<number | null>(() => {
    const o = editableOrder(initial.mode);
    return o.find((i) => initial.stickers[i] === null) ?? o[0] ?? null;
  });
  const [face, setFace] = useState<Face>(() => (cursor !== null ? STICKERS[cursor].face : facesFor(initial.mode)[0]));
  const [view, setView] = useState<"edit" | "solve">("edit");
  const [capture, setCapture] = useState<Face | null>(null);
  const [calibration, setCalibration] = useState<Partial<Record<Color, RGB>>>({});

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ mode, base, front, stickers, method }));
    } catch {
      // storage unavailable; the editor still works for this visit
    }
  }, [mode, base, front, stickers, method]);

  const result = useMemo(() => buildState(stickers, scheme), [stickers, scheme]);
  const errorSlots = useMemo(() => new Set(result.issues.flatMap((i) => i.slots)), [result]);
  const counts = useMemo(() => Object.fromEntries(COLORS.map((c) => [c, stickers.filter((s) => s === c).length])) as Record<Color, number>, [stickers]);
  const filled = order.filter((i) => stickers[i] !== null).length;

  const moveCursor = (slot: number | null) => {
    setCursor(slot);
    if (slot !== null) setFace(STICKERS[slot].face);
  };

  const fill = useCallback(
    (color: Color | null) => {
      if (cursor === null || isLocked(mode, cursor)) return;
      const next = stickers.slice();
      next[cursor] = color;
      setStickers(next);
      if (color) {
        // Always step to the very next sticker (wrapping to the next face), filled or not,
        // so correcting a sticker flows on just like entering a fresh one.
        const k = order.indexOf(cursor);
        if (k >= 0 && order.length > 1) moveCursor(order[(k + 1) % order.length]);
      }
    },
    [cursor, mode, stickers, order],
  );

  // Keyboard: W Y G B R O to fill, Backspace to clear, arrows to move.
  useEffect(() => {
    if (view !== "edit" || capture) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.metaKey || e.ctrlKey) return;
      const c = COLOR_KEY[e.key.toLowerCase()];
      if (c) {
        e.preventDefault();
        fill(c);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        fill(null);
      } else if (cursor !== null && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const slots = faceSlots(face);
        const k = slots.indexOf(cursor);
        if (k < 0) return;
        const r = Math.floor(k / 3);
        const col = k % 3;
        const [nr, nc] =
          e.key === "ArrowUp" ? [Math.max(0, r - 1), col] : e.key === "ArrowDown" ? [Math.min(2, r + 1), col] : e.key === "ArrowLeft" ? [r, Math.max(0, col - 1)] : [r, Math.min(2, col + 1)];
        const target = slots[nr * 3 + nc];
        if (!isLocked(mode, target)) setCursor(target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fill, cursor, face, mode, view, capture]);

  const reset = (m: Mode, sc: Scheme, keep: Stickers | null) => {
    const next = startingStickers(m, sc);
    if (keep) for (const i of editableOrder(m)) if (!isLocked(mode, i) && keep[i]) next[i] = keep[i];
    setStickers(next);
    const o = editableOrder(m);
    const c = o.find((i) => next[i] === null) ?? o[0] ?? null;
    setCursor(c);
    setFace(c !== null ? STICKERS[c].face : facesFor(m)[0]);
    setView("edit");
  };

  const hasEntries = order.some((i) => stickers[i] !== null);
  const confirmLoss = () => !hasEntries || window.confirm("Changing colours clears the stickers you've entered. Continue?");

  const changeMode = (m: Mode) => {
    if (m === mode) return;
    reset(m, scheme, stickers);
    setMode(m);
  };
  const changeBase = (b: Color) => {
    if (b === base || !confirmLoss()) return;
    const f = frontOptions(b).includes(front) ? front : defaultFront(b);
    setBase(b);
    setFront(f);
    reset(mode, schemeFor(b, f), null);
  };
  const changeFront = (f: Color) => {
    if (f === front || !confirmLoss()) return;
    setFront(f);
    reset(mode, schemeFor(base, f), null);
  };

  const loadExample = () => {
    const st = exampleState(mode);
    const colors = stickersFromState(st, scheme);
    setStickers(colors);
    setCursor(order[0] ?? null);
    setFace(facesFor(mode)[0]);
  };

  const applyPhoto = (f: Face, colors: Color[], samples: RGB[]) => {
    const slots = faceSlots(f);
    const next = stickers.slice();
    slots.forEach((slot, k) => {
      if (!isLocked(mode, slot)) next[slot] = colors[k];
    });
    setStickers(next);
    setCalibration((c) => ({ ...c, [scheme[f]]: samples[4] }));
    setCapture(null);
    // Move on to the next face that still has blanks
    const n = firstEmpty(next, slots[slots.length - 1]);
    if (n !== null) moveCursor(n);
  };

  const solution = useMemo(() => (result.state ? solve(result.state, scheme, method) : null), [result.state, scheme, method]);

  if (view === "solve" && solution) {
    return (
      <SolutionView
        solution={solution}
        method={method}
        onMethod={setMethod}
        onEdit={() => setView("edit")}
        mode={mode}
      />
    );
  }

  const faces = facesFor(mode);
  const previewColors = stickers.map((c) => (c ? COLOR_HEX[c] : EMPTY));
  const faceDone = (f: Face) => faceSlots(f).every((i) => stickers[i] !== null);
  const blocking = result.issues.filter((i) => i.level === "error");

  return (
    <div className="space-y-6">
      {/* 1. Where are you in the solve, and how are you holding the cube? */}
      <section className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">1 · Where are you?</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => changeMode(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-2xl border p-3 text-left transition ${mode === m.id ? "border-amber-400/70 bg-amber-400/10" : "border-white/[0.07] hover:bg-white/[0.05]"}`}
            >
              <div className="font-semibold text-white">{m.label}</div>
              <div className="mt-0.5 text-xs leading-snug text-zinc-400">{m.assumes}</div>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorChoice label="Base (bottom) colour" value={base} options={COLORS} onChange={changeBase} />
          <ColorChoice label="Front colour" value={front} options={frontOptions(base)} onChange={changeFront} />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Hold your cube with <b className="text-zinc-100">{base}</b> on the bottom and <b className="text-zinc-100">{front}</b> facing you.{" "}
          {mode !== "scratch" && <>The parts that are already solved are filled in for you.</>}
        </p>
      </section>

      {/* 2. Enter the colours */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">2 · Enter your colours</h2>
            <span className="font-mono text-xs text-zinc-500">
              {filled}/{order.length} stickers
            </span>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Faces">
            {faces.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={face === f}
                onClick={() => {
                  setFace(f);
                  const slot = faceSlots(f).find((i) => !isLocked(mode, i) && stickers[i] === null) ?? faceSlots(f).find((i) => !isLocked(mode, i));
                  setCursor(slot ?? null);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-sm transition ${face === f ? "border-white/40 bg-white/10 text-white" : "border-white/[0.07] text-zinc-400 hover:text-white"}`}
              >
                <MiniFace slots={faceSlots(f)} stickers={stickers} />
                <span>{FACE_NAME[f]}</span>
                {faceDone(f) && <span className="text-emerald-400">✓</span>}
              </button>
            ))}
          </div>

          <p className="mt-3 min-h-10 text-sm text-zinc-300">{holdHint(face, scheme)}</p>

          <FaceGrid
            face={face}
            stickers={stickers}
            scheme={scheme}
            mode={mode}
            cursor={cursor}
            errors={errorSlots}
            onSelect={(slot) => setCursor(slot)}
          />

          {/* Colour picker: one tight row right under the grid, same width, so your thumb barely moves */}
          <div className="mx-auto mt-2 grid w-full max-w-[340px] grid-cols-[18px_minmax(0,1fr)_18px] gap-1.5">
            <div />
            <div className="grid grid-cols-6 gap-1 rounded-2xl bg-[#15171d] p-1">
              {COLORS.map((c) => {
                const over = counts[c] > 9;
                return (
                  <button
                    key={c}
                    onClick={() => fill(c)}
                    disabled={cursor === null}
                    className="flex flex-col items-center gap-0.5 rounded-xl p-0.5 transition hover:bg-white/[0.08] active:scale-90 disabled:opacity-40"
                    aria-label={`Fill ${c}`}
                    title={`${c} (${c[0].toUpperCase()})`}
                  >
                    <span className="aspect-square w-full rounded-lg border border-black/30" style={{ background: COLOR_HEX[c] }} />
                    <span className={`font-mono text-[10px] leading-tight ${over ? "font-bold text-red-400" : counts[c] === 9 ? "text-emerald-400" : "text-zinc-500"}`}>
                      {counts[c]}/9
                    </span>
                  </button>
                );
              })}
            </div>
            <div />
          </div>
          {/* On phones the issue panel is below the fold, so surface the first problem right here */}
          {blocking[0] && (
            <div className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300 lg:hidden" aria-live="polite">
              {blocking[0].message}
              {blocking.length > 1 && <span className="text-red-300/70"> (+{blocking.length - 1} more below)</span>}
            </div>
          )}
          <p className="mt-2 hidden text-xs text-zinc-500 sm:block">
            Shortcut: press <kbd>W</kbd> <kbd>Y</kbd> <kbd>G</kbd> <kbd>B</kbd> <kbd>R</kbd> <kbd>O</kbd> to fill, <kbd>Backspace</kbd> to clear, arrows to move.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setCapture(face)} className="rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/25">
              📷 Photo of this face
            </button>
            <button onClick={() => fill(null)} disabled={cursor === null} className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-40">
              Erase sticker
            </button>
            <button
              onClick={() => {
                const next = stickers.slice();
                for (const i of faceSlots(face)) if (!isLocked(mode, i)) next[i] = null;
                setStickers(next);
                setCursor(faceSlots(face).find((i) => !isLocked(mode, i)) ?? null);
              }}
              className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
            >
              Clear face
            </button>
            <button
              onClick={() => (!hasEntries || window.confirm("Clear every sticker you've entered?")) && reset(mode, scheme, null)}
              className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
            >
              Clear all
            </button>
            <button onClick={loadExample} className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">
              Try an example
            </button>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-4">
            {blocking.length === 0 && result.state ? (
              <div className="rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-300">Looks good! Your cube can be solved.</div>
            ) : blocking.length ? (
              <ul className="space-y-2" aria-live="polite">
                {blocking.map((iss, k) => (
                  <li key={k} className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">
                    {iss.message}
                    {iss.slots.length > 0 && (
                      <button onClick={() => moveCursor(iss.slots.find((s) => !isLocked(mode, s)) ?? iss.slots[0])} className="ml-2 underline underline-offset-2">
                        Show
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400">
                {order.length - filled} sticker{order.length - filled === 1 ? "" : "s"} left. Mistakes show up here as you go.
              </p>
            )}
            <button
              onClick={() => setView("solve")}
              disabled={!result.state}
              className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
            >
              Show me how to solve it →
            </button>
          </div>
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Your cube so far</div>
            <CubePreview colors={previewColors} face={face} />
            <p className="mt-2 text-xs text-zinc-500">Drag sideways to spin. Dark stickers are still blank.</p>
          </div>
        </aside>
      </section>

      {capture && (
        <FaceCapture
          title={`${FACE_NAME[capture]} face (${scheme[capture]} center)`}
          hint={holdHint(capture, scheme)}
          centerColor={scheme[capture]}
          calibration={calibration}
          onUse={(colors, samples) => applyPhoto(capture, colors, samples)}
          onClose={() => setCapture(null)}
        />
      )}
    </div>
  );
}

function ColorChoice({ label, value, options, onChange }: { label: string; value: Color; options: Color[]; onChange: (c: Color) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-zinc-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-pressed={value === c}
            aria-label={c}
            title={c}
            className={`h-10 w-10 rounded-xl border-2 transition ${value === c ? "scale-110 border-white" : "border-transparent opacity-70 hover:opacity-100"}`}
            style={{ background: COLOR_HEX[c] }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniFace({ slots, stickers }: { slots: number[]; stickers: Stickers }) {
  return (
    <span className="grid h-6 w-6 grid-cols-3 gap-px rounded bg-[#15171d] p-px" aria-hidden>
      {slots.map((s) => (
        <span key={s} className="rounded-[1px]" style={{ background: stickers[s] ? COLOR_HEX[stickers[s]!] : EMPTY }} />
      ))}
    </span>
  );
}

function FaceGrid({
  face,
  stickers,
  scheme,
  mode,
  cursor,
  errors,
  onSelect,
}: {
  face: Face;
  stickers: Stickers;
  scheme: Scheme;
  mode: Mode;
  cursor: number | null;
  errors: Set<number>;
  onSelect: (slot: number) => void;
}) {
  const n = NEIGHBORS[face];
  const bar = (f: Face, vertical = false) => (
    <div
      className={`flex items-center justify-center rounded-md text-[10px] font-semibold uppercase tracking-wider ${vertical ? "[writing-mode:vertical-rl]" : ""} ${darkText(scheme[f]) ? "text-black/70" : "text-white/85"}`}
      style={{ background: COLOR_HEX[scheme[f]] }}
      title={`${FACE_NAME[f]} side (${scheme[f]})`}
    >
      {scheme[f]}
    </div>
  );
  return (
    <div className="mx-auto mt-3 grid w-full max-w-[340px] grid-cols-[18px_minmax(0,1fr)_18px] grid-rows-[18px_auto_18px] gap-1.5">
      <div />
      {bar(n.top)}
      <div />
      {bar(n.left, true)}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#15171d] p-1.5">
        {faceSlots(face).map((slot) => {
          const c = stickers[slot];
          const locked = isLocked(mode, slot);
          const isCenter = slot === faceSlots(face)[4];
          const active = cursor === slot;
          return (
            <button
              key={slot}
              onClick={() => !locked && onSelect(slot)}
              disabled={locked}
              aria-label={`${FACE_NAME[face]} sticker ${faceSlots(face).indexOf(slot) + 1}: ${c ?? "empty"}${locked ? " (locked)" : ""}`}
              className={`relative aspect-square rounded-xl transition ${active ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-[#15171d]" : ""} ${errors.has(slot) ? "outline outline-[3px] outline-red-500" : ""} ${locked && !isCenter ? "opacity-50" : ""}`}
              style={{ background: c ? COLOR_HEX[c] : EMPTY }}
            >
              {!c && <span className="text-lg text-zinc-600">?</span>}
              {isCenter && <span className={`absolute inset-x-0 bottom-1 text-[9px] font-semibold uppercase ${darkText(c) ? "text-black/50" : "text-white/60"}`}>center</span>}
              {locked && !isCenter && <span className={`absolute right-1 top-1 text-[10px] ${darkText(c) ? "text-black/60" : "text-white/70"}`}>🔒</span>}
            </button>
          );
        })}
      </div>
      {bar(n.right, true)}
      <div />
      {bar(n.bottom)}
      <div />
    </div>
  );
}
