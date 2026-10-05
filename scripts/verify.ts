// Run with: npm run verify
// Checks the cube engine and every algorithm in src/data/algs.ts.
import {
  SOLVED, STICKERS, applyAlg, caseState, invertAlg, parseAlg, f2lSolved, lastLayerOriented,
  isSolved, isSolvedAnyOrientation, slotAt, NORMALS, pieceKind, solvedLastLayerPieces,
} from "../src/lib/cube";
import type { Vec3 } from "../src/lib/cube";
import { F2L_CASES, OLL_CASES, PLL_CASES, OLL_EDGE_CASES } from "../src/data/algs";

let failures = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) {
    failures++;
    console.log("FAIL:", msg);
  }
};

// Engine sanity
for (const m of ["R", "L", "U", "D", "F", "B", "M", "E", "S", "r", "l", "u", "d", "f", "b", "x", "y", "z"]) {
  check(isSolved(applyAlg(SOLVED, `${m} ${m} ${m} ${m}`)), `${m}x4`);
  check(isSolved(applyAlg(SOLVED, `${m} ${m}'`)), `${m} ${m}'`);
  check(isSolved(applyAlg(SOLVED, `${m}2 ${m}2`)), `${m}2 ${m}2`);
}
check(isSolved(applyAlg(SOLVED, "R U R' U' ".repeat(6))), "sexy x6");
check(!isSolved(applyAlg(SOLVED, "R U R' U' ".repeat(3))), "sexy x3 not solved");
check(isSolved(applyAlg(SOLVED, "r M")) === false, "r M");
check(isSolved(applyAlg(SOLVED, "r M R'")), "r = R M'");
check(isSolved(applyAlg(SOLVED, "x L r'")), "x = r L'");
check(isSolved(applyAlg(SOLVED, "y D u'")), "y = u D'");
check(isSolved(applyAlg(SOLVED, "z B f'")), "z = f B'");
// R moves the front-right column up: the F sticker at front-right goes to U
{
  const s = applyAlg(SOLVED, "R");
  const home = STICKERS[s[slotAt([1, 1, 0], NORMALS.U)]];
  check(home.face === "F", "R moves front stickers up");
  const u = applyAlg(SOLVED, "U");
  check(STICKERS[u[slotAt([-1, 1, 0], NORMALS.L)]].face === "F", "U moves front stickers to the left");
}

const centersFixed = (alg: string) =>
  STICKERS.every((s) => pieceKind(s.pos) !== "center" || applyAlg(SOLVED, alg)[s.index] === s.index);

const U = ["", "U", "U2", "U'"];
const key = (s: number[]) => s.join(",");

// OLL
const ollKeys = new Set<string>();
for (const c of OLL_CASES) {
  const s = caseState(c.alg);
  check(f2lSolved(s), `OLL ${c.num} keeps F2L`);
  check(!lastLayerOriented(s), `OLL ${c.num} is an actual case`);
  check(centersFixed(c.alg), `OLL ${c.num} centers`);
  // Orientation pattern up to U rotation
  const pats = U.map((a) => {
    const t = applyAlg(s, a);
    return STICKERS.filter((x) => x.pos[1] === 1).map((x) => (STICKERS[t[x.index]].face === "U" ? 1 : 0)).join("");
  });
  ollKeys.add(pats.sort()[0]);
}
check(ollKeys.size === 57, `57 distinct OLLs (got ${ollKeys.size})`);

// PLL
const pllKeys = new Set<string>();
for (const c of PLL_CASES) {
  const s = caseState(c.alg);
  check(f2lSolved(s), `PLL ${c.name} keeps F2L (centers fixed: ${centersFixed(c.alg)})`);
  check(lastLayerOriented(s), `PLL ${c.name} keeps top yellow`);
  const variants: string[] = [];
  for (const a of U) for (const b of U) variants.push(key(applyAlg(applyAlg(applyAlg(SOLVED, a), invertAlg(parseAlg(c.alg))), b)));
  pllKeys.add(variants.sort()[0]);
  // AUF report
  const best = U.map((a) => ({ a, n: solvedLastLayerPieces(caseState(`${c.alg} ${a}`)) }));
  const top = best.reduce((p, q) => (q.n > p.n ? q : p));
  if (top.a) console.log(`  PLL ${c.name}: best ending AUF "${top.a}" (${top.n} pieces solved vs ${best[0].n})`);
}
check(pllKeys.size === 21, `21 distinct PLLs (got ${pllKeys.size})`);

// 2-look OLL edges
for (const c of OLL_EDGE_CASES) {
  const s = caseState(c.alg);
  check(f2lSolved(s), `${c.name} keeps F2L`);
  const up = (p: Vec3) => STICKERS[s[slotAt(p, NORMALS.U)]].face === "U";
  const e = { back: up([0, 1, -1]), left: up([-1, 1, 0]), right: up([1, 1, 0]), front: up([0, 1, 1]) };
  console.log(`  ${c.name}: oriented edges ->`, Object.entries(e).filter(([, v]) => v).map(([k]) => k).join(", ") || "none");
}

// F2L
const where = (p: Vec3) => {
  const [x, y, z] = p;
  if (y <= 0) return x === 1 && z === 1 ? "In slot" : "Wrong slot";
  const parts = [x === 0 && z === -1 ? "back" : "", z === 1 && x === 0 ? "front" : "", x === -1 && z === 0 ? "left" : "", x === 1 && z === 0 ? "right" : ""];
  if (pieceKind(p) === "corner") return `Top-${z === 1 ? "front" : "back"}-${x === 1 ? "right" : "left"}`;
  return `Top-${parts.join("")}`;
};
const facing = (n: Vec3) =>
  n[1] === 1 ? "up" : n[1] === -1 ? "down" : n[0] === 1 ? "right" : n[0] === -1 ? "left" : n[2] === 1 ? "front" : "back";

for (const c of F2L_CASES) {
  const s = caseState(c.alg);
  const ok = STICKERS.every((x) => {
    const isPair = (x.pos[0] === 1 && x.pos[2] === 1 && x.pos[1] <= 0);
    if (x.pos[1] > 0 || isPair) return true;
    return s[x.index] === x.index;
  });
  check(ok, `F2L ${c.id} only disturbs the FR pair + top layer`);
  const cornerHome = slotAt([1, -1, 1], NORMALS.D);
  const edgeHome = slotAt([1, 0, 1], NORMALS.F);
  const cs = STICKERS[s.indexOf(cornerHome)];
  const es = STICKERS[s.indexOf(edgeHome)];
  console.log(`  F2L ${c.id.padEnd(3)} corner: ${where(cs.pos)}, white facing ${facing(cs.normal)} | edge: ${where(es.pos)}, front-color facing ${facing(es.normal)}`);
  console.log(`           guide: ${c.corner} | ${c.edge}`);
}

for (const c of [...F2L_CASES, ...OLL_CASES, ...PLL_CASES, ...OLL_EDGE_CASES]) {
  check(isSolvedAnyOrientation(applyAlg(caseState(c.alg), c.alg)), `${c.id} solves its own case`);
}

console.log(failures ? `\n${failures} failures` : "\nAll checks passed");
