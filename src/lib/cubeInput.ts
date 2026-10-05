// Turning the colours a user paints onto a net into a cube state, and checking it can exist.
//
// Everything here is in the "held" frame: the user holds their base colour on the bottom (D)
// and their chosen front colour toward them (F). Slots are the same 54 sticker slots as cube.ts.
import {
  FACES, NORMALS, STICKERS, findRotation, mul, pieceKind, slotAt,
  type CubeState, type Face, type Palette, type Vec3,
} from "./cube";

export type Color = "white" | "yellow" | "green" | "blue" | "red" | "orange";
export const COLORS: Color[] = ["white", "yellow", "green", "blue", "red", "orange"];

export const COLOR_HEX: Record<Color, string> = {
  white: "#ffffff",
  yellow: "#ffd500",
  green: "#009b48",
  blue: "#0046ad",
  red: "#b71234",
  orange: "#ff5800",
};

export const COLOR_KEY: Record<string, Color> = { w: "white", y: "yellow", g: "green", b: "blue", r: "red", o: "orange" };

export const OPPOSITE: Record<Color, Color> = {
  white: "yellow",
  yellow: "white",
  green: "blue",
  blue: "green",
  red: "orange",
  orange: "red",
};

// The standard (Western) scheme as cube.ts draws it: yellow up, green front, orange right.
const CANONICAL: Record<Face, Color> = { U: "yellow", D: "white", F: "green", B: "blue", R: "orange", L: "red" };
const CANONICAL_FACE = Object.fromEntries(Object.entries(CANONICAL).map(([f, c]) => [c, f])) as Record<Color, Face>;

export type Scheme = Record<Face, Color>;

/** Front colours that are possible with a given base colour (the four side colours). */
export const frontOptions = (base: Color) => COLORS.filter((c) => c !== base && c !== OPPOSITE[base]);

export function defaultFront(base: Color): Color {
  const opts = frontOptions(base);
  return opts.includes("green") ? "green" : opts.includes("red") ? "red" : opts[0];
}

/** Colour of every face when the cube is held with `base` on the bottom and `front` facing you. */
export function schemeFor(base: Color, front: Color): Scheme {
  const m = findRotation(NORMALS[CANONICAL_FACE[base]], NORMALS.D, NORMALS[CANONICAL_FACE[front]], NORMALS.F);
  if (!m) throw new Error(`${front} can't be in front when ${base} is on the bottom`);
  const scheme = {} as Scheme;
  for (const f of FACES) {
    const target = mul(m, NORMALS[f]);
    const held = FACES.find((h) => NORMALS[h].every((v, i) => v === target[i]))!;
    scheme[held] = CANONICAL[f];
  }
  return scheme;
}

export const paletteOf = (scheme: Scheme): Palette =>
  Object.fromEntries(FACES.map((f) => [f, COLOR_HEX[scheme[f]]])) as Palette;

// ---------------------------------------------------------------------------
// Modes: which stickers are already known (locked) because earlier stages are done.

export type Mode = "scratch" | "f2l" | "oll" | "pll";

export const MODES: { id: Mode; label: string; short: string; assumes: string }[] = [
  { id: "scratch", label: "From scratch", short: "Scratch", assumes: "Enter the whole cube" },
  { id: "f2l", label: "F2L", short: "F2L", assumes: "Your cross is done" },
  { id: "oll", label: "OLL", short: "OLL", assumes: "Your first two layers are done" },
  { id: "pll", label: "PLL", short: "PLL", assumes: "Your top face is all one colour" },
];

export function isLocked(mode: Mode, slot: number): boolean {
  const s = STICKERS[slot];
  if (pieceKind(s.pos) === "center") return true;
  switch (mode) {
    case "scratch":
      return false;
    case "f2l":
      return pieceKind(s.pos) === "edge" && s.pos[1] === -1;
    case "oll":
      return s.pos[1] <= 0;
    case "pll":
      return s.pos[1] <= 0 || s.face === "U";
  }
}

export type Stickers = (Color | null)[];

/** A sticker array with locked stickers filled in as solved and the rest blank. */
export function startingStickers(mode: Mode, scheme: Scheme): Stickers {
  return STICKERS.map((s) => (isLocked(mode, s.index) ? scheme[s.face] : null));
}

/** Colours of a full cube state (for random examples and solver steps). */
export function stickersFromState(state: CubeState, scheme: Scheme): Stickers {
  return state.map((h) => scheme[STICKERS[h].face]);
}

// ---------------------------------------------------------------------------
// Validation

export interface Issue {
  /** "error" blocks solving; "warn" is shown but not blocking. */
  level: "error" | "warn";
  message: string;
  slots: number[];
}

const PIECES: Map<string, number[]> = new Map(); // position key -> sticker slots
for (const s of STICKERS) {
  if (pieceKind(s.pos) === "center") continue;
  const k = s.pos.join(",");
  PIECES.set(k, [...(PIECES.get(k) ?? []), s.index]);
}

const posName = (p: Vec3) => {
  const parts: string[] = [];
  if (p[1] === 1) parts.push("top");
  if (p[1] === -1) parts.push("bottom");
  if (p[2] === 1) parts.push("front");
  if (p[2] === -1) parts.push("back");
  if (p[0] === -1) parts.push("left");
  if (p[0] === 1) parts.push("right");
  return parts.join("-");
};

const pieceName = (colors: Color[]) => colors.join("-");

export interface BuildResult {
  issues: Issue[];
  complete: boolean;
  /** Present when every sticker is filled in and the cube can be solved. */
  state?: CubeState;
}

/**
 * Check the painted colours. Count and per-piece problems are reported as soon as they appear,
 * so the user gets feedback while still filling in; solvability is checked once complete.
 */
export function buildState(stickers: Stickers, scheme: Scheme): BuildResult {
  const issues: Issue[] = [];
  const faceOf = Object.fromEntries(FACES.map((f) => [scheme[f], f])) as Record<Color, Face>;

  // 1. Colour counts
  for (const c of COLORS) {
    const slots = stickers.flatMap((v, i) => (v === c ? [i] : []));
    if (slots.length > 9) {
      const editable = slots.filter((i) => pieceKind(STICKERS[i].pos) !== "center");
      issues.push({ level: "error", message: `${slots.length} ${c} stickers. A cube has only 9 of each colour.`, slots: editable });
    }
  }

  // 2. Each fully-entered piece must be a real piece, in a real orientation, and appear once
  const state: number[] = new Array(54).fill(-1);
  for (const s of STICKERS) if (pieceKind(s.pos) === "center") state[s.index] = s.index;
  const seen = new Map<string, string>(); // home position -> where it was found
  let complete = true;

  for (const [key, slots] of PIECES) {
    const colors = slots.map((i) => stickers[i]);
    if (colors.some((c) => c === null)) {
      complete = false;
      continue;
    }
    const cs = colors as Color[];
    const pos = STICKERS[slots[0]].pos;
    const where = `The ${posName(pos)} ${slots.length === 2 ? "edge" : "corner"}`;

    if (new Set(cs).size !== cs.length) {
      issues.push({ level: "error", message: `${where} has two ${cs.find((c, i) => cs.indexOf(c) !== i)} stickers. No piece has the same colour twice.`, slots });
      continue;
    }
    const opp = cs.find((c) => cs.includes(OPPOSITE[c]));
    if (opp) {
      issues.push({ level: "error", message: `${where} has ${opp} and ${OPPOSITE[opp]}. Those are opposite colours, so they're never on the same piece.`, slots });
      continue;
    }

    // The faces these colours belong to tell us which piece it is; its home position:
    const faces = cs.map((c) => faceOf[c]);
    const homePos = [0, 1, 2].map((ax) => faces.reduce((sum, f) => sum + NORMALS[f][ax], 0)) as Vec3;
    // A real piece can be rotated so each sticker lands on the face of its colour.
    const normals = slots.map((i) => STICKERS[i].normal);
    const m = findRotation(normals[0], NORMALS[faces[0]], normals[1], NORMALS[faces[1]]);
    const ok = m && slots.every((_, j) => NORMALS[faces[j]].every((v, ax) => v === mul(m, normals[j])[ax]));
    if (!ok) {
      issues.push({ level: "error", message: `${where} (${pieceName(cs)}) has its colours in a mirrored order, which a real corner can't have. Check those stickers.`, slots });
      continue;
    }
    const homeKey = homePos.join(",");
    if (seen.has(homeKey)) {
      const other = PIECES.get(seen.get(homeKey)!)!;
      issues.push({ level: "error", message: `The ${pieceName(cs)} piece appears twice. Each piece exists only once.`, slots: [...slots, ...other] });
      continue;
    }
    seen.set(homeKey, key);
    slots.forEach((slot, j) => (state[slot] = slotAt(homePos, NORMALS[faces[j]])));
  }

  if (!complete || issues.some((i) => i.level === "error")) return { issues, complete };

  // 3. Solvability: corner twist, edge flip, permutation parity
  const solv = solvability(state);
  if (solv) {
    issues.push({ level: "error", message: solv, slots: [] });
    return { issues, complete };
  }
  return { issues, complete, state };
}

function parity(perm: number[]) {
  let p = 0;
  const seen = new Array(perm.length).fill(false);
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let len = 0;
    for (let j = i; !seen[j]; j = perm[j]) {
      seen[j] = true;
      len++;
    }
    p += len - 1;
  }
  return p % 2;
}

/** Returns a human message if the state can't be reached by turning a real cube, else null. */
export function solvability(state: CubeState): string | null {
  const corners = [...PIECES.entries()].filter(([, s]) => s.length === 3);
  const edges = [...PIECES.entries()].filter(([, s]) => s.length === 2);
  const cornerIdx = new Map(corners.map(([k], i) => [k, i]));
  const edgeIdx = new Map(edges.map(([k], i) => [k, i]));

  let twist = 0;
  const cperm: number[] = [];
  corners.forEach(([, slots], i) => {
    const homes = slots.map((s) => STICKERS[state[s]]);
    cperm[i] = cornerIdx.get(homes[0].pos.join(","))!;
    // Which of this position's stickers holds the piece's top/bottom-coloured sticker?
    const j = homes.findIndex((h) => h.face === "U" || h.face === "D");
    const n = slots.map((s) => STICKERS[s].normal);
    const ud = n.findIndex((v) => v[1] !== 0);
    if (j === ud) return;
    // Clockwise neighbour of the U/D sticker, seen from outside the corner
    const others = [0, 1, 2].filter((x) => x !== ud);
    const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const cw = others.find((o) => {
      const third = others.find((x) => x !== o)!;
      const c = cross(n[ud], n[o]);
      return c[0] * n[third][0] + c[1] * n[third][1] + c[2] * n[third][2] === -1;
    })!;
    twist += j === cw ? 1 : 2;
  });

  let flip = 0;
  const eperm: number[] = [];
  edges.forEach(([, slots], i) => {
    const homes = slots.map((s) => STICKERS[state[s]]);
    eperm[i] = edgeIdx.get(homes[0].pos.join(","))!;
    // Primary sticker: U/D if the piece has one, else F/B. Same rule for the position.
    const prim = (fs: Face[]) => {
      const a = fs.findIndex((f) => f === "U" || f === "D");
      return a >= 0 ? a : fs.findIndex((f) => f === "F" || f === "B");
    };
    const pieceP = prim(homes.map((h) => h.face));
    const posP = prim(slots.map((s) => STICKERS[s].face));
    if (pieceP !== posP) flip++;
  });

  if (twist % 3 !== 0) return "One corner is twisted, so this cube can't be solved as entered. Usually a corner sticker is wrong; re-check your corners.";
  if (flip % 2 !== 0) return "One edge is flipped, so this cube can't be solved as entered. Usually an edge sticker is wrong; re-check your edges.";
  if (parity(cperm) !== parity(eperm)) return "Two pieces look swapped, so this cube can't be solved as entered. Check that you entered every sticker in the right spot.";
  return null;
}
