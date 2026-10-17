import Link from "next/link";
import CubePlayer from "@/components/cube/CubePlayer";
import { IsoView, TopView } from "@/components/cube/Diagrams";
import Checklist from "@/components/Checklist";
import { Tip } from "@/components/ui";
import { SOLVED, applyAlg, caseState } from "@/lib/cube";

const STAGES = [
  {
    href: "/notation",
    step: "Start here",
    title: "Notation",
    text: "Learn to read moves like R U R' U'. Every letter is animated on a 3D cube.",
    thumb: <IsoView state={applyAlg(SOLVED, "R")} />,
    count: "18 moves",
  },
  {
    href: "/cross",
    step: "Stage 1",
    title: "Cross",
    text: "Four white edges on the bottom, solved by intuition. Includes an optimal-cross trainer.",
    thumb: <IsoView state={applyAlg(SOLVED, "F2 R U")} mask="cross" from="bottom" />,
    count: "Intuitive",
  },
  {
    href: "/f2l",
    step: "Stage 2",
    title: "F2L",
    text: "Pair a corner with its edge and insert them together. 17 core cases.",
    thumb: <IsoView state={caseState("U' R U R' U2 R U' R'")} mask="f2l" />,
    count: "17 cases",
  },
  {
    href: "/oll",
    step: "Stage 3",
    title: "OLL",
    text: "Make the whole top yellow. Start with 2-look (9 algs), grow to all 57.",
    thumb: <TopView state={caseState("R U R' U R U2 R'")} mask="oll" />,
    count: "57 cases",
  },
  {
    href: "/pll",
    step: "Stage 4",
    title: "PLL",
    text: "Move the yellow pieces to their spots. 2-look (6 algs), then all 21.",
    thumb: <TopView state={caseState("R U R' U' R' F R2 U' R' U' R U R' F'")} arrows />,
    count: "21 cases",
  },
  {
    href: "/practice",
    step: "Daily",
    title: "Practice",
    text: "Timer with scrambles and averages, plus flash-card drills for OLL and PLL.",
    thumb: <TopView state={caseState("M2 U M U2 M' U M2")} arrows />,
    count: "Timer + drills",
  },
];

export default function Home() {
  return (
    <div>
      <section className="grid grid-cols-1 items-center gap-10 pb-16 pt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-amber-300">The CFOP method</div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Learn to speedsolve, <span className="text-amber-300">one move at a time.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
            Every algorithm here plays on a 3D cube you can spin around, slow down and step through move by move. Every case picture is
            generated from its algorithm, so what you see is exactly what you&apos;ll hold.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/notation" className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-black hover:bg-amber-300">
              Start with notation
            </Link>
            <Link href="/practice" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/5">
              Open the timer
            </Link>
          </div>
          <div className="mt-8 flex gap-6 font-mono text-sm text-zinc-500">
            <span><b className="text-zinc-200">C</b>ross</span>
            <span><b className="text-zinc-200">F</b>2L</span>
            <span><b className="text-zinc-200">O</b>LL</span>
            <span><b className="text-zinc-200">P</b>LL</span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md">
          <CubePlayer alg="R U R' U' R' F R2 U' R' U' R U R' F'" minimal autoPlay loop />
          <p className="mt-2 text-center text-xs text-zinc-500">The T perm, playing on loop. Tap to pause, drag to spin.</p>
        </div>
      </section>

      <Link
        href="/solve"
        className="mb-16 flex flex-col gap-4 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.12] to-transparent p-5 transition hover:border-amber-400/60 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="w-20 shrink-0 sm:w-24">
          <TopView state={caseState("R U R' U' R' F R F'")} mask="oll" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">Stuck mid-solve?</div>
          <div className="text-xl font-bold text-white sm:text-2xl">Show me my cube and tell me what to do next</div>
          <p className="mt-1 text-sm text-zinc-400">Tap in your colours or snap a photo of each side. Get the next step, or the whole solution, animated.</p>
        </div>
        <span className="self-start rounded-full bg-amber-400 px-5 py-2.5 font-semibold text-black sm:self-center">Open My Cube →</span>
      </Link>
      <p className="-mt-12 mb-16 text-sm text-zinc-500">
        Just want it solved?{" "}
        <Link href="/quick" className="text-sky-300 underline underline-offset-2">
          Quick solve
        </Link>{" "}
        gives you one short solution (about 20 moves) for any scramble.
      </p>

      <section className="mb-16">
        <h2 className="mb-5 text-2xl font-bold text-white">The four stages</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 transition hover:border-amber-400/40 hover:bg-white/[0.05]"
            >
              <div className="w-24 shrink-0 transition group-hover:scale-105">{s.thumb}</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.step}</div>
                <div className="text-xl font-bold text-white">{s.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.text}</p>
                <div className="mt-2 font-mono text-xs text-amber-300/80">{s.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-white">Learning path</h2>
          <p className="mb-4 text-zinc-400">Learn in this order. Each step is a big jump in speed without overwhelming your memory.</p>
          <ol className="space-y-3">
            {[
              ["Cross + intuitive F2L + 2-look OLL + 2-look PLL", "Only 15 algorithms. This gets most people under 1 minute, then toward 30 seconds."],
              ["Full PLL (21)", "PLL comes up every solve and is easy to recognize. Learn 2–3 per week."],
              ["Full OLL (57)", "Start with the groups you see most often, like the T, P, and L shapes."],
              ["Advanced F2L", "Learn the remaining cases, insert into back slots without rotating, and practice lookahead."],
              ["Inspection", "Use the full 15 seconds to plan the cross, then try to plan the first F2L pair too."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 font-mono text-sm text-amber-300">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-zinc-100">{t}</div>
                  <div className="text-sm text-zinc-400">{d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4">
          <h2 className="mb-4 text-2xl font-bold text-white">Your checklist</h2>
          <Checklist />
          <Tip title="Practice tips">
            Drill new algorithms slowly until they&apos;re smooth, then speed them up. Use finger tricks (flicking U with your index finger) instead of
            whole-hand turns. Slow, steady solves with no pauses beat fast, jerky ones.
          </Tip>
        </div>
      </section>
    </div>
  );
}
