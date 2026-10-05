import type { Metadata } from "next";
import CubePlayer from "@/components/cube/CubePlayer";
import CrossTrainer from "@/components/CrossTrainer";
import { Alg, NextStage, PageHeader, Section, Tip } from "@/components/ui";

export const metadata: Metadata = { title: "Stage 1: Cross" };

const STEPS = [
  {
    n: 1,
    title: "Find a white edge",
    text: "Look for an edge piece with white on it. Note its second color. Here it's the white-green edge, sitting on top.",
  },
  {
    n: 2,
    title: "Line it up above its center",
    text: "Turn the top until the edge sits right above the green center. Here that's one U'.",
  },
  {
    n: 3,
    title: "Turn that face twice",
    text: "F2 drops the edge into the bottom layer, white facing down. Repeat for the other three edges.",
  },
];

export default function CrossPage() {
  return (
    <>
      <PageHeader step="Stage 1" title="The cross">
        <p>
          No algorithms to memorize; the cross is solved by intuition. The goal: <strong>four white edges on the bottom</strong>, each one also
          matching the center color on its side. Grey stickers in the pictures don&apos;t matter yet.
        </p>
      </PageHeader>

      <Section title="Placing an edge" kicker="Steps 1–3">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <ol className="space-y-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 font-mono text-amber-300">{s.n}</span>
                <div>
                  <div className="font-semibold text-white">{s.title}</div>
                  <p className="text-sm leading-relaxed text-zinc-400">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <CubePlayer alg="U' F2" mask="cross" autoPlay loop />
          </div>
        </div>
      </Section>

      <Section title="If an edge lands flipped" kicker="Step 4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-4">
            <p className="leading-relaxed text-zinc-400">
              Sometimes the edge drops in with white facing sideways instead of down. Hold it at the front of the bottom layer and do{" "}
              <Alg>F&apos; D R&apos; D&apos;</Alg>. The player starts from below so you can see the white sticker facing you on the front.
            </p>
            <Tip>Use &ldquo;See bottom&rdquo; to flip the camera, or drag the cube to look underneath.</Tip>
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <CubePlayer alg="F' D R' D'" mask="cross" view="bottom" autoPlay loop />
          </div>
        </div>
      </Section>

      <Section title="Cross trainer" kicker="Practice inspection">
        <CrossTrainer />
      </Section>

      <Section title="Getting faster">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Tip title="Solve it on the bottom">
            Solve the cross on the bottom from the start, not on top then flip. You won&apos;t have to rotate the cube and you can see F2L pieces sooner.
          </Tip>
          <Tip title="8 moves or fewer">
            Every cross can be solved in 8 moves or fewer. Use your 15-second inspection to plan the whole cross before turning. The trainer above
            shows you the shortest one.
          </Tip>
          <Tip title="Color neutral, later">
            Practice &ldquo;dual color&rdquo; (white or yellow) crosses later; it lets you pick the easier cross each solve.
          </Tip>
        </div>
      </Section>

      <NextStage href="/f2l" label="F2L" />
    </>
  );
}
