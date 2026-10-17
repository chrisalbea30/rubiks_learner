"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/quick", label: "Solve my cube" },
  { href: "/quick/tutorial", label: "Tutorial" },
];

/** Switches between the Quick solve tool and its tutorial. */
export default function QuickTabs() {
  const path = usePathname();
  return (
    <nav className="mb-6 flex w-fit rounded-full bg-white/5 p-1" aria-label="Quick solve">
      {TABS.map((t) => {
        const on = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${on ? "bg-white text-black" : "text-zinc-300 hover:text-white"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
