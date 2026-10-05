import type { Metadata } from "next";
import MyCube from "@/components/solve/MyCube";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "My Cube: what do I do next?" };

export default function SolvePage() {
  return (
    <>
      <PageHeader step="Stuck? Start here" title="My cube">
        <p>
          Tell me what your cube looks like and I&apos;ll show you exactly what to do next, stage by stage. Start from scratch, or skip ahead
          if your cross, first two layers or top face are already done. Tap in the colours or take a photo of each side.
        </p>
      </PageHeader>
      <MyCube />
    </>
  );
}
