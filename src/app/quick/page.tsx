import type { Metadata } from "next";
import MyCube from "@/components/solve/MyCube";
import Link from "next/link";
import QuickTabs from "@/components/solve/QuickTabs";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Quick solve" };

export default function QuickPage() {
  return (
    <>
      <QuickTabs />
      <PageHeader step="Just solve it" title="Quick solve">
        <p>
          Enter your scrambled cube (tap in the colours or take a photo of each side) and get one short solution, usually around 20 moves.
          No method, no stages: just the turns from your cube to solved. Want to learn instead? Use{" "}
          <Link href="/solve" className="text-sky-300 underline underline-offset-2">My Cube</Link>.
        </p>
      </PageHeader>
      <MyCube variant="quick" />
    </>
  );
}
