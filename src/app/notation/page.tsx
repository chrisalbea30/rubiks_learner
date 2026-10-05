import type { Metadata } from "next";
import NotationLab from "@/components/NotationLab";
import { NextStage, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Notation" };

export default function NotationPage() {
  return (
    <>
      <PageHeader step="Start here" title="Notation">
        <p>
          Hold the cube with one face toward you (<strong>Front</strong>) and one face on top (<strong>Up</strong>). A letter alone means turn
          that face 90° clockwise, as if you were looking straight at it. Click any move to watch it.
        </p>
      </PageHeader>
      <NotationLab />
      <NextStage href="/cross" label="The cross" />
    </>
  );
}
