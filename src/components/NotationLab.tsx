"use client";

import { useState } from "react";
import CubePlayer from "./cube/CubePlayer";
import { NOTATION, TRIGGERS } from "@/data/algs";
import { parseAlg } from "@/lib/cube";

const GROUP_TITLES: Record<string, string> = {
  face: "Face turns (clockwise)",
  prime: "Prime ' = counter-clockwise",
  double: "2 = half turn",
  wide: "Wide moves (lowercase)",
  slice: "Slice moves",
  rotation: "Whole-cube rotations",
};

export default function NotationLab() {
  const [alg, setAlg] = useState("R");
  const [title, setTitle] = useState("R: Right face, clockwise");
  const [custom, setCustom] = useState("R U R' U'");
  const [err, setErr] = useState<string | null>(null);

  const pick = (a: string, t: string) => {
    setAlg(a);
    setTitle(t);
  };

  const groups = Object.keys(GROUP_TITLES);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[440px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="mb-3 text-lg font-semibold text-white">{title}</div>
          <CubePlayer key={alg} alg={alg} setup="" labels autoPlay loop />
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          The floating letters mark each face. Picture yourself looking straight at the face being turned: clockwise is clockwise <em>from
          that side</em>.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((g) => (
          <div key={g}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">{GROUP_TITLES[g]}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {NOTATION.filter((n) => n.group === g).map((n) => {
                const active = alg === n.move;
                return (
                  <button
                    key={n.move}
                    onClick={() => pick(n.move, `${n.move}: ${n.meaning}`)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active ? "border-amber-400/70 bg-amber-400/10" : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="font-mono text-2xl font-bold text-white">{n.move}</div>
                    <div className="mt-1 text-xs leading-snug text-zinc-400">{n.meaning}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Named chunks you&apos;ll use constantly</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TRIGGERS.map((t) => (
              <button
                key={t.name}
                onClick={() => pick(t.alg, `${t.name}: ${t.alg}`)}
                className={`rounded-2xl border p-4 text-left transition ${
                  alg === t.alg ? "border-amber-400/70 bg-amber-400/10" : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="font-semibold text-white">{t.name}</div>
                <div className="alg mt-1 text-lg text-amber-200">{t.alg}</div>
                <div className="mt-1 text-xs text-zinc-400">{t.note}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Algorithm playground</h3>
          <p className="mt-1 text-sm text-zinc-400">Type any algorithm and watch it from a solved cube. Brackets are fine; they&apos;re just for grouping.</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                if (!parseAlg(custom).length) throw new Error("Type at least one move");
                setErr(null);
                pick(custom.trim(), custom.trim());
              } catch (ex) {
                setErr((ex as Error).message);
              }
            }}
          >
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="alg h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-amber-100 outline-none focus:border-amber-400/60"
              spellCheck={false}
              aria-label="Algorithm"
            />
            <button className="h-11 rounded-xl bg-amber-400 px-5 font-semibold text-black hover:bg-amber-300">Play</button>
          </form>
          {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}
