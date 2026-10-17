"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const STAGES = [
  { href: "/notation", label: "Notation", short: "Moves", step: "0" },
  { href: "/cross", label: "Cross", short: "Cross", step: "1" },
  { href: "/f2l", label: "F2L", short: "F2L", step: "2" },
  { href: "/oll", label: "OLL", short: "OLL", step: "3" },
  { href: "/pll", label: "PLL", short: "PLL", step: "4" },
  { href: "/solve", label: "My Cube", short: "Solve", step: "?" },
  { href: "/quick", label: "Quick solve", short: "Quick", step: "⚡" },
  { href: "/practice", label: "Practice", short: "Timer", step: "⏱" },
];

export default function Nav() {
  const path = usePathname();
  const current = STAGES.find((s) => path.startsWith(s.href));
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0c10]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-white">
            <Logo />
            <span>CubeSchool</span>
          </Link>
          {/* Phones: the page name here, stage links in the bottom bar */}
          {current && <span className="ml-auto truncate text-sm text-zinc-400 lg:hidden">{current.label}</span>}
          <nav className="hidden min-w-0 flex-1 gap-1 lg:flex" aria-label="Stages">
            {STAGES.map((s) => {
              const active = path.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                    active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className={`font-mono text-[10px] ${active ? "text-amber-300" : "text-zinc-600"}`}>{s.step}</span>
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0b0c10]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Stages"
      >
        <div className="grid grid-cols-8">
          {STAGES.map((s) => {
            const active = path.startsWith(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex min-w-0 flex-col items-center gap-0.5 py-2 ${active ? "text-white" : "text-zinc-500"}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${
                    active ? "bg-amber-400 text-black" : "bg-white/[0.06]"
                  }`}
                >
                  {s.step}
                </span>
                <span className="w-full truncate text-center text-[10px] leading-tight">{s.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function Logo() {
  const c = ["#ffd500", "#009b48", "#ff5800", "#b71234", "#ffd500", "#0046ad", "#009b48", "#ffffff", "#ff5800"];
  return (
    <svg viewBox="0 0 31 31" className="h-6 w-6" aria-hidden>
      <rect width="31" height="31" rx="5" fill="#15171d" />
      {c.map((fill, i) => (
        <rect key={i} x={1.5 + (i % 3) * 9.5} y={1.5 + Math.floor(i / 3) * 9.5} width="9" height="9" rx="2" fill={fill} />
      ))}
    </svg>
  );
}
