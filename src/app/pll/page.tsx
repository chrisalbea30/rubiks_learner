import type { Metadata } from "next";
import CaseBrowser from "@/components/CaseBrowser";
import { NextStage, PageHeader, Section, Tip } from "@/components/ui";
import { PLL_CASES, PLL_CORNER_CASES, PLL_EDGE_CASES, PLL_TYPE_ORDER } from "@/data/algs";
import { bestAuf } from "@/lib/cube";

export const metadata: Metadata = { title: "Stage 4: PLL" };

export default function PLLPage() {
  const corners = PLL_CORNER_CASES.map((c) => ({
    id: c.id,
    title: c.name,
    group: "Step 1: solve the corners",
    alg: c.alg,
    details: [{ label: "Hold", value: c.hold }],
  }));
  const edges = PLL_EDGE_CASES.map((c) => ({
    id: c.id,
    title: c.name,
    group: "Step 2: solve the edges",
    alg: c.alg,
    auf: bestAuf(c.alg) || undefined,
    details: [{ label: "Hold", value: c.hold }],
  }));
  const full = PLL_CASES.map((c) => ({
    id: c.id,
    title: `${c.name} perm`,
    group: c.type,
    alg: c.alg,
    auf: bestAuf(c.alg) || undefined,
  }));

  return (
    <>
      <PageHeader step="Stage 4" title="PLL: Permute Last Layer">
        <p>
          PLL moves the yellow pieces into their correct spots <strong>without un-yellowing the top</strong>. Start with 2-look PLL (6
          algorithms), then learn all 21. You may need one final U turn (called AUF) after any PLL.
        </p>
      </PageHeader>

      <Section title="Reading the pictures">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Tip title="Arrows">
            Arrows show where each piece needs to go. Two-headed arrows mean two pieces swap.
          </Tip>
          <Tip title="Headlights">
            Two corners on the same side whose side stickers are the same color. They&apos;re the key to recognizing most PLLs.
          </Tip>
          <Tip title="+U labels">
            A dashed <span className="alg">+U</span> or <span className="alg">+U&apos;</span> chip at the end of an algorithm is the final turn that lines
            up the top layer.
          </Tip>
        </div>
      </Section>

      <Section title="2-look PLL, step 1: solve the corners" kicker="2 cases">
        <p className="mb-4 text-zinc-400">
          Edges are greyed out in these pictures so you can focus on the corners. If you see headlights on all four sides, the corners are done;
          go to step 2.
        </p>
        <CaseBrowser cases={corners} mask="pll-corners" thumb="top" arrows columns="grid-cols-2" />
      </Section>

      <Section title="2-look PLL, step 2: solve the edges" kicker="4 cases">
        <p className="mb-4 text-zinc-400">
          Not sure whether it&apos;s Ua or Ub? Try one; if the edges cycle the wrong way, the other one will finish it.
        </p>
        <CaseBrowser cases={edges} mask="full" thumb="top" arrows columns="grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4" />
      </Section>

      <Section title="Full PLL: all 21 cases" kicker="Track your progress">
        <CaseBrowser cases={full} mask="full" thumb="top" arrows groups={PLL_TYPE_ORDER} filters />
      </Section>

      <NextStage href="/practice" label="Practice" />
    </>
  );
}
