import Link from "next/link";

export function PageHeader({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <header className="mb-10 max-w-3xl">
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">{step}</div>
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
      <div className="prose-cube mt-4 text-lg">{children}</div>
    </header>
  );
}

export function Section({ title, kicker, children, id }: { title: string; kicker?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      {kicker && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">{kicker}</div>}
      <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export function Tip({ title = "Tip", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4 text-sm leading-relaxed text-zinc-300">
      <div className="mb-1 font-semibold text-sky-300">{title}</div>
      {children}
    </div>
  );
}

export function Alg({ children }: { children: React.ReactNode }) {
  return <code className="alg rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[0.92em] text-amber-200">{children}</code>;
}

export function NextStage({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-12 flex justify-end">
      <Link href={href} className="rounded-full bg-amber-400 px-5 py-2.5 font-semibold text-black hover:bg-amber-300">
        Next: {label} →
      </Link>
    </div>
  );
}
