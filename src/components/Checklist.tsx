"use client";

import { useProgress } from "@/lib/progress";

const ITEMS = [
  ["check-notation", "Learn the notation until you can read an algorithm without looking twice"],
  ["check-cross", "Solve the cross on the bottom in 8 moves or fewer"],
  ["check-2look", "Learn 2-look OLL and 2-look PLL"],
  ["check-pll", "Learn all 21 PLLs"],
  ["check-oll", "Learn all 57 OLLs"],
];

export default function Checklist() {
  const { checked, toggle } = useProgress();
  return (
    <ul className="space-y-2">
      {ITEMS.map(([id, text]) => {
        const on = checked(id);
        return (
          <li key={id}>
            <button
              onClick={() => toggle(id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-left hover:bg-white/[0.05]"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm ${
                  on ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/20"
                }`}
              >
                {on ? "✓" : ""}
              </span>
              <span className={on ? "text-zinc-500 line-through" : "text-zinc-200"}>{text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
