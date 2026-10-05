import type { Metadata } from "next";
import CaseBrowser from "@/components/CaseBrowser";
import CubePlayer from "@/components/cube/CubePlayer";
import { Alg, NextStage, PageHeader, Section, Tip } from "@/components/ui";
import { F2L_CASES, F2L_GROUPS } from "@/data/algs";

export const metadata: Metadata = { title: "Stage 2: F2L" };

export default function F2LPage() {
  const cases = F2L_CASES.map((c) => ({
    id: `f2l-${c.id}`,
    title: c.name,
    group: F2L_GROUPS.find((g) => g.id === c.group)!.title,
    alg: c.alg,
    details: [
      { label: "Corner", value: c.corner },
      { label: "Edge", value: c.edge },
    ],
  }));

  return (
    <>
      <PageHeader step="Stage 2" title="F2L: First Two Layers">
        <p>
          Pair one white corner with its matching middle-layer edge, then insert both into a slot together. Most fast solvers learn F2L
          intuitively first: <strong>bring the pair together on top, then drop it in</strong> with one of the basic inserts.
        </p>
      </PageHeader>

      <Section title="How to read the pictures">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-4 text-zinc-400">
            <p className="leading-relaxed">
              Every case inserts into the <strong className="text-zinc-100">front-right slot</strong>, where the green front and orange right faces
              meet. Only the pair you&apos;re inserting and the already-solved pieces are colored; everything on top that doesn&apos;t matter is grey.
            </p>
            <p className="leading-relaxed">
              &ldquo;Front-color&rdquo; means the edge sticker that matches the front center (green). For the other slots, turn U to bring pieces into
              place or rotate the cube with <Alg>y</Alg>.
            </p>
            <Tip title="Stuck pieces">
              If a corner or edge is stuck in the wrong slot, pop it out with a basic insert (like <Alg>R U R&apos;</Alg>) and treat it as a fresh case.
            </Tip>
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="mb-2 text-sm text-zinc-400">Basic 1: the pair is lined up on top, <Alg>R U R&apos;</Alg> drops it in.</div>
            <CubePlayer alg="R U R'" mask="f2l" autoPlay loop />
          </div>
        </div>
      </Section>

      <Section title="All 17 cases" kicker="Tap a case to watch it">
        <CaseBrowser cases={cases} mask="f2l" thumb="iso" groups={F2L_GROUPS.map((g) => g.title)} filters />
        <p className="mt-2 text-sm text-zinc-500">Learning all 41 official cases comes later, once intuitive F2L feels comfortable.</p>
      </Section>

      <NextStage href="/oll" label="OLL" />
    </>
  );
}
