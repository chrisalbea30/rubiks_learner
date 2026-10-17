import type { Metadata } from "next";
import Link from "next/link";
import CubePlayer from "@/components/cube/CubePlayer";
import { IsoView } from "@/components/cube/Diagrams";
import QuickTabs from "@/components/solve/QuickTabs";
import QuickTutorialDemo from "@/components/solve/QuickTutorialDemo";
import { Alg, PageHeader, Section, Tip } from "@/components/ui";
import { SOLVED } from "@/lib/cube";

export const metadata: Metadata = { title: "Quick solve tutorial" };

const STEPS = [
  {
    title: "Hold the cube the right way",
    text: "Pick a bottom colour (white by default) and a front colour. Keep holding the cube exactly like that for the whole solve: every move in the solution assumes it.",
  },
  {
    title: "Enter your cube",
    text: "Go face by face. Tap a sticker, then tap its colour; the cursor moves on by itself. Or tap “Photo of this face” and line the grid up with the stickers. Each face screen tells you how to turn the cube to see that side.",
  },
  {
    title: "Fix anything flagged in red",
    text: "Too many of one colour, a piece that can't exist, a twisted corner: the page tells you, and “Show” jumps to the sticker. A single wrong sticker makes a cube unsolvable, so this check matters.",
  },
  {
    title: "Press “Solve it”",
    text: "You get about 20 moves, shown in groups of five. Every letter is one face turn (see the reminder below).",
  },
  {
    title: "Follow along, five at a time",
    text: "Do one group on your real cube, then compare with the animated cube (step forward with ▶, or press Space). If they match, do the next group. Going slowly beats starting over.",
  },
];

export default function QuickTutorialPage() {
  return (
    <>
      <QuickTabs />
      <PageHeader step="Quick solve" title="Tutorial">
        <p>
          How to use Quick solve, and what&apos;s happening behind the scenes. Quick solve doesn&apos;t teach a method like CFOP: a computer
          finds a very short route from your cube to solved, and you follow it move by move.
        </p>
      </PageHeader>

      <Section title="Using Quick solve, step by step" kicker="5 steps">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 font-mono text-amber-300">{i + 1}</span>
                <div>
                  <div className="font-semibold text-white">{s.title}</div>
                  <p className="text-sm leading-relaxed text-zinc-400">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
              <div className="mb-2 text-sm text-zinc-400">Holding it: white on the bottom, green facing you, yellow on top.</div>
              <div className="mx-auto w-40">
                <IsoView state={SOLVED} />
              </div>
            </div>
            <Link href="/quick" className="block rounded-2xl bg-amber-400 px-5 py-3 text-center font-semibold text-black hover:bg-amber-300">
              Try it on my cube →
            </Link>
          </div>
        </div>
      </Section>

      <Section title="Reading the moves" kicker="Notation in 30 seconds">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-3 text-zinc-400">
            <p className="leading-relaxed">
              Each letter is a face: <b className="text-zinc-100">U</b>p, <b className="text-zinc-100">D</b>own, <b className="text-zinc-100">R</b>ight,{" "}
              <b className="text-zinc-100">L</b>eft, <b className="text-zinc-100">F</b>ront, <b className="text-zinc-100">B</b>ack. A letter alone means turn that
              face a quarter turn clockwise, as if you were looking straight at it.
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Alg>R</Alg> clockwise · <Alg>R&apos;</Alg> (prime) counter-clockwise · <Alg>R2</Alg> half turn
              </li>
              <li>
                <Alg>B</Alg> and <Alg>D</Alg> are the tricky ones: &ldquo;clockwise&rdquo; is from the back and from below, so they feel backwards when you look
                from the front.
              </li>
            </ul>
            <p className="text-sm">
              Quick solve only uses these 18 face turns: no slices, wide moves or rotations. Full details on the{" "}
              <Link href="/notation" className="text-sky-300 underline underline-offset-2">
                Notation page
              </Link>
              .
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="mb-2 text-sm text-zinc-400">B and D from the front: watch which way they go.</div>
            <CubePlayer alg="B B' D D'" setup="" labels autoPlay loop />
          </div>
        </div>
      </Section>

      <Section title="How it works: two phases" kicker="Live example">
        <p className="mb-5 max-w-3xl leading-relaxed text-zinc-400">
          Quick solve uses <b className="text-zinc-100">Kociemba&apos;s two-phase algorithm</b>, the method behind most cube-solving computers. Searching
          all 43 quintillion positions directly is impossible, so it splits the job in two. Here is a random scramble solved right now, split
          at the point where phase 2 begins:
        </p>
        <QuickTutorialDemo />
      </Section>

      <Section title="Good to know">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Tip title="Why about 20 moves?">
            Every cube position can be solved in 20 moves or fewer (&ldquo;God&apos;s number&rdquo;, proven in 2010). Quick solve stops at a very short
            solution, usually 19–22, rather than spending ages proving the shortest.
          </Tip>
          <Tip title="Can I learn this method?">
            Not really: it relies on huge lookup tables a computer searches in milliseconds. To solve without help, learn CFOP with the{" "}
            <Link href="/cross" className="text-sky-200 underline underline-offset-2">
              stage lessons
            </Link>{" "}
            and{" "}
            <Link href="/solve" className="text-sky-200 underline underline-offset-2">
              My Cube
            </Link>
            .
          </Tip>
          <Tip title="Lost your place?">
            Don&apos;t try to undo. Enter the cube again as it is now and press Solve: you&apos;ll get a fresh short solution from where you are.
          </Tip>
        </div>
      </Section>
    </>
  );
}
