import type { Metadata } from "next";
import CaseBrowser from "@/components/CaseBrowser";
import { NextStage, PageHeader, Section, Tip } from "@/components/ui";
import { OLL_CASES, OLL_CORNER_CASES, OLL_EDGE_CASES, OLL_GROUP_ORDER } from "@/data/algs";

export const metadata: Metadata = { title: "Stage 3: OLL" };

export default function OLLPage() {
  const edges = OLL_EDGE_CASES.map((c) => ({
    id: c.id,
    title: c.name,
    group: "Step 1: yellow cross",
    alg: c.alg,
    display: c.display,
    details: [{ label: "Hold", value: c.hold }],
  }));
  const corners = OLL_CORNER_CASES.map((c) => ({
    id: c.id,
    title: c.name,
    group: "Step 2: orient corners",
    alg: c.alg,
    details: [{ label: "Recognize", value: c.hold }],
  }));
  const full = OLL_CASES.map((c) => ({
    id: c.id,
    title: c.name ? `OLL ${c.num} · ${c.name}` : `OLL ${c.num}`,
    group: c.group,
    alg: c.alg,
  }));

  return (
    <>
      <PageHeader step="Stage 3" title="OLL: Orient Last Layer">
        <p>
          OLL makes the <strong>entire top face yellow</strong>. Start with 2-look OLL (9 algorithms), then work toward all 57. Before any
          algorithm, turn U until the top matches the picture.
        </p>
      </PageHeader>

      <Section title="Reading the pictures">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Tip title="Top view">
            You&apos;re looking down at the top, with the front face at the bottom of the picture. Yellow squares are yellow stickers facing up; the
            yellow bars around the edge are yellow stickers facing sideways.
          </Tip>
          <Tip title="Grey means &lsquo;ignore&rsquo;">
            OLL only cares where yellow is. All other last-layer colors are greyed out, both in the pictures and on the 3D cube.
          </Tip>
        </div>
      </Section>

      <Section title="2-look OLL, step 1: make a yellow cross" kicker="3 cases">
        <p className="mb-4 text-zinc-400">Only the edges matter here, so the corners are grey too.</p>
        <CaseBrowser cases={edges} mask="oll-edges" thumb="top" columns="grid-cols-3" />
      </Section>

      <Section title="2-look OLL, step 2: orient the corners" kicker="7 cases">
        <p className="mb-4 text-zinc-400">
          These are OLL 21–27 from the full list. &ldquo;Side&rdquo; means yellow stickers showing on the side faces of the top layer.
        </p>
        <CaseBrowser cases={corners} mask="oll" thumb="top" />
      </Section>

      <Section title="Full OLL: all 57 cases" kicker="Track your progress">
        <CaseBrowser cases={full} mask="oll" thumb="top" groups={OLL_GROUP_ORDER} filters />
      </Section>

      <NextStage href="/pll" label="PLL" />
    </>
  );
}
