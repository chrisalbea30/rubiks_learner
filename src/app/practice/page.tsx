import type { Metadata } from "next";
import Drill from "@/components/Drill";
import Timer from "@/components/Timer";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <>
      <PageHeader step="Daily practice" title="Practice">
        <p>
          Time full solves to track your average, and drill recognition: seeing a case and knowing its algorithm instantly is where most of
          the time goes.
        </p>
      </PageHeader>
      <Section title="Solve timer" kicker="Hold space, release to start">
        <Timer />
      </Section>
      <Section title="Recognition drill" kicker="Flash cards">
        <Drill />
      </Section>
    </>
  );
}
