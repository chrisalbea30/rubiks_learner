// A teaching CFOP solver: it solves the way the guide teaches, one stage at a time, and uses the
// guide's own algorithms and case names wherever they apply.
//
// All work happens in the "held" frame (base colour on D). Whole-cube rotations (y) are allowed
// between steps; after every step the state is re-described from the new holding via normalizeHeld,
// and the colour scheme travels with it so instructions can name real colours.
import {
  SOLVED, STICKERS, applyAlg, normalizeHeld, parseAlg, pieceKind, slotAt, NORMALS,
  type CubeState, type Face, type Mask, type Move, type Vec3,
} from "./cube";
import { solveCross } from "./crossSolver";
import type { Color, Scheme } from "./cubeInput";
import {
  F2L_CASES, OLL_CASES, OLL_CORNER_CASES, OLL_EDGE_CASES, PLL_CASES, PLL_CORNER_CASES, PLL_EDGE_CASES,
} from "@/data/algs";

export type Stage = "cross" | "f2l" | "oll" | "pll";
export type Method = "2look" | "full";

export interface Step {
  stage: Stage;
  title: string;
  /** What to look for / why, in plain words with the user's real colours. */
  detail: string;
  /** Moves to do, including any whole-cube rotation at the start. */
  alg: string;
  caseName?: string;
  /** Learn more link on the stage pages. */
  learnHref?: string;
  mask: Mask;
  start: CubeState;
  scheme: Scheme;
  moves: number;
}

export interface Solution {
  steps: Step[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers

const U_TURNS = ["", "U", "U'", "U2"];

/** Merge neighbouring turns of the same layer: "R' R" disappears, "U U2" becomes "U'". */
export function simplify(alg: string): string {
  const out: Move[] = [];
  for (const m of parseAlg(alg)) {
    const last = out[out.length - 1];
    if (last && last.base === m.base) {
      const q = (x: Move) => (x.turns === 2 ? 2 : x.prime ? 3 : 1);
      const total = (q(last) + q(m)) % 4;
      out.pop();
      if (total) out.push({ base: m.base, turns: total === 2 ? 2 : 1, prime: total === 3, token: m.base + (total === 2 ? "2" : total === 3 ? "'" : "") });
    } else out.push(m);
  }
  return out.map((m) => m.token).join(" ");
}

const countMoves = (alg: string) => parseAlg(alg).filter((m) => !"xyz".includes(m.base)).length;
const join = (...parts: string[]) => parts.filter(Boolean).join(" ");
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function home(state: CubeState, slot: number) {
  return state[slot] === slot;
}

function positionSolved(state: CubeState, pos: Vec3) {
  return STICKERS.every((s) => !(s.pos[0] === pos[0] && s.pos[1] === pos[1] && s.pos[2] === pos[2]) || home(state, s.index));
}

// ---------------------------------------------------------------------------
// Cross

function crossSolved(state: CubeState) {
  return [[0, -1, 1], [1, -1, 0], [0, -1, -1], [-1, -1, 0]].every((p) => positionSolved(state, p as Vec3));
}

// ---------------------------------------------------------------------------
// F2L: every pair is solved in the front-right slot after turning the cube with y.
//
// The pair moves only with "basic inserts" (R U R', F' U' F and friends) plus U turns. Each of
// these touches just the top layer and the front-right slot, so they never disturb the cross or
// finished pairs. A shortest-path table over the pair's possible spots (top layer or the
// front-right slot) gives the best combination; the guide's case algorithm is used when it fits.

const MACROS = ["U", "U'", "U2", "R U R'", "R U' R'", "R U2 R'", "F' U F", "F' U' F", "F' U2 F"];
const MACRO_DEST = MACROS.map((m) => {
  const s = applyAlg(SOLVED, m);
  const d = new Array<number>(54);
  s.forEach((src, dest) => (d[src] = dest));
  return d;
});
const MACRO_COST = MACROS.map(countMoves);
const CORNER_ID = slotAt([1, -1, 1], NORMALS.D); // white sticker of the front-right corner
const EDGE_ID = slotAt([1, 0, 1], NORMALS.F); // front-colour sticker of the front-right edge
const pairKey = (c: number, e: number) => c * 54 + e;

let pairTable: { dist: Float64Array; next: Int8Array } | null = null;

function buildPairTable() {
  const dist = new Float64Array(54 * 54).fill(Infinity);
  const next = new Int8Array(54 * 54).fill(-1);
  const inverse = MACROS.map((m) => MACROS.indexOf(simplify(parseAlg(m).reverse().map((x) => (x.turns === 2 ? x.token : x.prime ? x.base : `${x.base}'`)).join(" "))));
  const start = pairKey(CORNER_ID, EDGE_ID);
  dist[start] = 0;
  const open = [start];
  while (open.length) {
    open.sort((a, b) => dist[b] - dist[a]);
    const y = open.pop()!;
    const c = Math.floor(y / 54);
    const e = y % 54;
    // States X with macro m taking X to Y: X = inverse(m) applied to Y.
    MACROS.forEach((_, m) => {
      const inv = MACRO_DEST[inverse[m]];
      const x = pairKey(inv[c], inv[e]);
      const d = dist[y] + MACRO_COST[m];
      if (d < dist[x]) {
        dist[x] = d;
        next[x] = m;
        open.push(x);
      }
    });
  }
  return { dist, next };
}

/** Shortest basic-insert solution for the front-right pair, or null if the pieces aren't reachable. */
function pairSolution(state: CubeState): string | null {
  pairTable ??= buildPairTable();
  let c = state.indexOf(CORNER_ID);
  let e = state.indexOf(EDGE_ID);
  if (!Number.isFinite(pairTable.dist[pairKey(c, e)])) return null;
  const parts: string[] = [];
  while (pairKey(c, e) !== pairKey(CORNER_ID, EDGE_ID)) {
    const m = pairTable.next[pairKey(c, e)];
    parts.push(MACROS[m]);
    c = MACRO_DEST[m][c];
    e = MACRO_DEST[m][e];
  }
  return simplify(parts.join(" "));
}

const f2lPositions = STICKERS.filter((s) => s.pos[1] <= 0 && pieceKind(s.pos) !== "center").map((s) => s.index);
const frSlots = new Set(STICKERS.filter((s) => s.pos[0] === 1 && s.pos[2] === 1 && s.pos[1] <= 0).map((s) => s.index));

/** The guide's F2L algorithm for this case (with a U turn first if needed), if one solves it cleanly. */
function guidePairAlg(state: CubeState): { alg: string; name: string } | null {
  let best: { alg: string; name: string } | null = null;
  for (const k of U_TURNS) {
    for (const c of F2L_CASES) {
      const alg = join(k, c.alg);
      const t = applyAlg(state, alg);
      const ok = f2lPositions.every((s) => (frSlots.has(s) ? home(t, s) : t[s] === state[s]));
      if (ok && (!best || countMoves(alg) < countMoves(best.alg))) best = { alg: simplify(alg), name: c.name };
    }
  }
  return best;
}

interface Slot {
  name: string;
  corner: Vec3;
  edge: Vec3;
  sides: [Face, Face];
  rotation: string;
}

const SLOTS: Slot[] = [
  { name: "front-right", corner: [1, -1, 1], edge: [1, 0, 1], sides: ["F", "R"], rotation: "" },
  { name: "back-right", corner: [1, -1, -1], edge: [1, 0, -1], sides: ["R", "B"], rotation: "y" },
  { name: "back-left", corner: [-1, -1, -1], edge: [-1, 0, -1], sides: ["B", "L"], rotation: "y2" },
  { name: "front-left", corner: [-1, -1, 1], edge: [-1, 0, 1], sides: ["L", "F"], rotation: "y'" },
];

const slotSolved = (state: CubeState, s: Slot) => positionSolved(state, s.corner) && positionSolved(state, s.edge);

/** Where a piece whose home is `homePos` currently sits. */
function whereIs(state: CubeState, homePos: Vec3): Vec3 {
  const id = STICKERS.find((s) => s.pos.every((v, i) => v === homePos[i]))!.index;
  return STICKERS[state.indexOf(id)].pos;
}

const samePos = (a: Vec3, b: Vec3) => a.every((v, i) => v === b[i]);

function pairReachable(state: CubeState, s: Slot) {
  const c = whereIs(state, s.corner);
  const e = whereIs(state, s.edge);
  return (c[1] === 1 || samePos(c, s.corner)) && (e[1] === 1 || samePos(e, s.edge));
}

// ---------------------------------------------------------------------------
// Last layer checks

const U_EDGE_SLOTS = STICKERS.filter((s) => s.face === "U" && pieceKind(s.pos) === "edge").map((s) => s.index);
const U_CORNER_POS = STICKERS.filter((s) => s.face === "U" && pieceKind(s.pos) === "corner").map((s) => s.pos);
const isUSticker = (state: CubeState, slot: number) => STICKERS[state[slot]].face === "U";

const edgesOriented = (s: CubeState) => U_EDGE_SLOTS.every((i) => isUSticker(s, i));
const llOriented = (s: CubeState) => STICKERS.every((x) => x.face !== "U" || isUSticker(s, x.index));
const cornersPlaced = (s: CubeState) => U_CORNER_POS.every((p) => positionSolved(s, p));
/** The U turn ("" for none) after which `test` passes, or undefined if no turn works. */
const anyAuf = (s: CubeState, test: (t: CubeState) => boolean) => U_TURNS.find((a) => test(applyAlg(s, a)));
const hasAuf = (s: CubeState, test: (t: CubeState) => boolean) => anyAuf(s, test) !== undefined;

// ---------------------------------------------------------------------------

/**
 * Plan a CFOP solve. `state` must be a reachable cube state held with the base colour on D;
 * `scheme` gives the real colour of each held face.
 */
export function solve(start: CubeState, startScheme: Scheme, method: Method = "2look"): Solution {
  const steps: Step[] = [];
  let state = start;
  let scheme = startScheme;
  const base = scheme.D;
  const top = scheme.U;

  const push = (step: Omit<Step, "start" | "scheme" | "moves">) => {
    steps.push({ ...step, start: state, scheme, moves: countMoves(step.alg) });
    const n = normalizeHeld(applyAlg(state, step.alg), scheme);
    state = n.state;
    scheme = n.palette as Scheme;
  };

  // Cross
  if (!crossSolved(state)) {
    const alg = solveCross(state);
    push({
      stage: "cross",
      title: `Make the ${base} cross`,
      detail: `Bring the four ${base} edges to the bottom so each one's other colour matches the center beside it. This is the shortest way (${countMoves(alg)} moves). Grey stickers don't matter yet.`,
      alg,
      mask: "cross",
      learnHref: "/cross",
    });
  }

  // F2L
  for (let guard = 0; guard < 12; guard++) {
    const open = SLOTS.filter((s) => !slotSolved(state, s));
    if (!open.length) break;
    let best: { slot: Slot; alg: string; name?: string; cost: number } | null = null;
    for (const s of open) {
      if (!pairReachable(state, s)) continue;
      const rotated = normalizeHeld(applyAlg(state, s.rotation), scheme).state;
      const alg = pairSolution(rotated);
      if (alg === null) continue;
      const guide = guidePairAlg(rotated);
      const pick = guide && countMoves(guide.alg) <= countMoves(alg) + 2 ? guide : { alg, name: undefined };
      const cost = countMoves(pick.alg) + (s.rotation ? 0.5 : 0);
      if (!best || cost < best.cost) best = { slot: s, alg: pick.alg, name: pick.name, cost };
    }
    const pairNo = 4 - open.length + 1;
    if (best) {
      const [a, b] = best.slot.sides.map((f) => scheme[f]) as [Color, Color];
      const turn = best.slot.rotation
        ? `First turn the whole cube (${best.slot.rotation}) so the ${a}/${b} slot is at the front-right. `
        : `The ${a}/${b} slot is already at the front-right. `;
      push({
        stage: "f2l",
        title: `Pair ${pairNo}: ${base}-${a}-${b} corner + ${a}-${b} edge`,
        detail: `${turn}Find the ${base}-${a}-${b} corner and the ${a}-${b} edge, pair them up on top, then drop them into the slot together.`,
        alg: join(best.slot.rotation, best.alg),
        caseName: best.name,
        mask: "full",
        learnHref: "/f2l",
      });
      continue;
    }
    // Every open pair has a piece stuck in another slot: pop one out with a basic insert.
    const stuck = open.find((s) =>
      open.some((o) => o !== s && (samePos(whereIs(state, o.corner), s.corner) || samePos(whereIs(state, o.edge), s.edge))),
    ) ?? open[0];
    const [a, b] = stuck.sides.map((f) => scheme[f]);
    push({
      stage: "f2l",
      title: `Free a stuck piece from the ${a}/${b} slot`,
      detail: `A piece you need is stuck in the ${a}/${b} slot. ${stuck.rotation ? `Turn the cube (${stuck.rotation}) so that slot is front-right, then pop` : "Pop"} it out to the top with a basic insert. Now it's a normal case.`,
      alg: join(stuck.rotation, "R U R'"),
      mask: "full",
      learnHref: "/f2l",
    });
  }
  if (SLOTS.some((s) => !slotSolved(state, s))) return { steps, error: "Couldn't finish F2L. Please double-check the colours you entered." };

  // OLL
  if (!llOriented(state)) {
    if (method === "2look") {
      if (!edgesOriented(state)) {
        const found = pickCase(state, OLL_EDGE_CASES.map((c) => ({ name: c.name, alg: c.alg })), edgesOriented);
        if (!found) return { steps, error: "Couldn't make the top cross. Some edge stickers may be wrong." };
        push({
          stage: "oll",
          title: `OLL step 1: make a ${top} cross`,
          detail: `Look only at the ${top} edges on top: you have the ${found.name.toLowerCase()} shape. ${found.pre ? `Turn the top (${found.pre}) to hold it like the picture, then` : "Hold it like the picture and"} do the algorithm.`,
          alg: found.alg,
          caseName: found.name,
          mask: "oll-edges",
          learnHref: "/oll",
        });
      }
      if (!llOriented(state)) {
        const found = pickCase(state, OLL_CORNER_CASES.map((c) => ({ name: c.name, alg: c.alg })), llOriented);
        if (!found) return { steps, error: "Couldn't orient the top corners. A corner may be twisted; check the corner stickers." };
        push({
          stage: "oll",
          title: `OLL step 2: finish the ${top} top (${found.name.replace(/^\d+ /, "")})`,
          detail: `Now orient the corners. Count the ${top} stickers facing up and on the sides to recognise the case. ${found.pre ? `Turn the top (${found.pre}) first so it matches the picture.` : ""}`,
          alg: found.alg,
          caseName: `OLL ${found.name}`,
          mask: "oll",
          learnHref: "/oll",
        });
      }
    } else {
      const found = pickCase(state, OLL_CASES.map((c) => ({ name: `OLL ${c.num}${c.name ? ` ${c.name}` : ""}`, alg: c.alg })), llOriented);
      if (!found) return { steps, error: "Couldn't orient the top layer. A sticker may be wrong." };
      push({
        stage: "oll",
        title: `OLL: make the whole top ${top}`,
        detail: `This is ${found.name}. ${found.pre ? `Turn the top (${found.pre}) so it matches the picture, then` : "Hold it like the picture and"} do the algorithm.`,
        alg: found.alg,
        caseName: found.name,
        mask: "oll",
        learnHref: "/oll",
      });
    }
  }

  // PLL
  const solvedLL = (t: CubeState) => U_CORNER_POS.every((p) => positionSolved(t, p)) && STICKERS.every((x) => x.pos[1] !== 1 || home(t, x.index));
  if (!hasAuf(state, solvedLL)) {
    if (method === "2look") {
      if (!hasAuf(state, cornersPlaced)) {
        const found = pickCase(state, PLL_CORNER_CASES.map((c) => ({ name: c.name, alg: c.alg })), (t) => hasAuf(t, cornersPlaced));
        if (!found) return { steps, error: "Couldn't place the top corners. Two pieces may be swapped in what you entered." };
        const t = found.name.startsWith("Headlights");
        push({
          stage: "pll",
          title: `PLL step 1: solve the corners (${t ? "T perm" : "Y perm"})`,
          detail: t
            ? `Look for headlights: two corners on one side with the same side colour. ${found.pre ? `Turn the top (${found.pre}) to put the headlights on the left, then` : "They're on the left, so"} do the T perm.`
            : "There are no headlights on any side, so do the Y perm from any angle.",
          alg: found.alg,
          caseName: t ? "T perm" : "Y perm",
          mask: "pll-corners",
          learnHref: "/pll",
        });
      }
      if (!hasAuf(state, solvedLL)) {
        const found = pickCase(state, PLL_EDGE_CASES.map((c) => ({ name: c.name, alg: c.alg })), (t) => hasAuf(t, solvedLL));
        if (!found) return { steps, error: "Couldn't finish the top edges. Two pieces may be swapped in what you entered." };
        const short = found.name.split(" ")[0];
        push({
          stage: "pll",
          title: `PLL step 2: solve the edges (${short} perm)`,
          detail: `Corners are done; now cycle the edges. ${found.pre ? `Turn the top (${found.pre}) so it matches the picture, then` : "Hold it like the picture and"} do the ${short} perm.`,
          alg: found.alg,
          caseName: `${short} perm`,
          mask: "full",
          learnHref: "/pll",
        });
      }
    } else {
      const found = pickCase(state, PLL_CASES.map((c) => ({ name: `${c.name} perm`, alg: c.alg })), (t) => hasAuf(t, solvedLL));
      if (!found) return { steps, error: "Couldn't finish the last layer. Two pieces may be swapped in what you entered." };
      push({
        stage: "pll",
        title: `PLL: ${found.name}`,
        detail: `${found.pre ? `Turn the top (${found.pre}) so it matches the picture, then` : "Hold it like the picture and"} do the ${found.name}.`,
        alg: found.alg,
        caseName: found.name,
        mask: "full",
        learnHref: "/pll",
      });
    }
  }
  const auf = anyAuf(state, (t) => t.every((v, i) => v === i));
  if (auf === undefined) return { steps, error: "Something didn't add up at the end. Please double-check the colours you entered." };
  if (auf) {
    push({
      stage: "pll",
      title: "Final turn",
      detail: `Turn the top (${auf}) to line it up. Solved!`,
      alg: auf,
      mask: "full",
      learnHref: "/pll",
    });
  }
  return { steps };
}

const NO_COLORS = { U: 0, D: 0, F: 0, B: 0, R: 0, L: 0 };

/** Try every case algorithm with each U turn first; return the shortest one that passes `test`. */
function pickCase(state: CubeState, cases: { name: string; alg: string }[], test: (s: CubeState) => boolean) {
  let best: { name: string; alg: string; pre: string } | null = null;
  for (const pre of U_TURNS) {
    for (const c of cases) {
      const alg = join(pre, c.alg);
      if (!best || countMoves(alg) < countMoves(best.alg)) {
        // Re-hold after algorithms that contain a cube rotation (the V perm has a y).
        const after = normalizeHeld(applyAlg(state, alg), NO_COLORS).state;
        if (test(after)) best = { name: c.name, alg, pre };
      }
    }
  }
  return best;
}

export const STAGE_LABEL: Record<Stage, string> = { cross: "Cross", f2l: "F2L", oll: "OLL", pll: "PLL" };
export { cap };
