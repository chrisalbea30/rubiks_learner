// Sticker-level Rubik's cube model.
//
// Coordinates: x points Right, y points Up, z points toward the viewer (Front).
// Every cubie sits at a position in {-1, 0, 1}^3. A sticker is a (position, normal) pair.
// The cube state is an array of 54 numbers: state[slot] = the "home" sticker now in that slot.
// The solved state is the identity. Keeping the home id lets us colour or grey out any
// sticker by what piece it belongs to (used for the OLL / PLL / F2L stickering masks).

export type Face = "U" | "R" | "F" | "D" | "L" | "B";
export type Vec3 = [number, number, number];
export type Axis = 0 | 1 | 2;
export type CubeState = number[];

export const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];

export const NORMALS: Record<Face, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

// Standard (Western) colour scheme held with yellow on top and green in front.
export const FACE_COLORS: Record<Face, string> = {
  U: "#ffd500", // yellow
  D: "#ffffff", // white
  F: "#009b48", // green
  B: "#0046ad", // blue
  R: "#ff5800", // orange
  L: "#b71234", // red
};

export const FACE_COLOR_NAMES: Record<Face, string> = {
  U: "yellow",
  D: "white",
  F: "green",
  B: "blue",
  R: "orange",
  L: "red",
};

export const GREY = "#4b5263";

export interface Sticker {
  index: number;
  face: Face;
  row: number;
  col: number;
  pos: Vec3;
  normal: Vec3;
}

// Each face is laid out as it looks on a standard unfolded net.
function gridToPos(face: Face, row: number, col: number): Vec3 {
  switch (face) {
    case "U":
      return [col - 1, 1, row - 1];
    case "D":
      return [col - 1, -1, 1 - row];
    case "F":
      return [col - 1, 1 - row, 1];
    case "B":
      return [1 - col, 1 - row, -1];
    case "R":
      return [1, 1 - row, 1 - col];
    case "L":
      return [-1, 1 - row, col - 1];
  }
}

const vkey = (p: Vec3, n: Vec3) => `${p.join(",")}|${n.join(",")}`;

export const STICKERS: Sticker[] = [];
const SLOT_BY_KEY = new Map<string, number>();
FACES.forEach((face, f) => {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = f * 9 + row * 3 + col;
      const pos = gridToPos(face, row, col);
      const normal = NORMALS[face];
      STICKERS.push({ index, face, row, col, pos, normal });
      SLOT_BY_KEY.set(vkey(pos, normal), index);
    }
  }
});

export function slotAt(pos: Vec3, normal: Vec3): number {
  const s = SLOT_BY_KEY.get(vkey(pos, normal));
  if (s === undefined) throw new Error(`No sticker at ${vkey(pos, normal)}`);
  return s;
}

export const SOLVED: CubeState = STICKERS.map((s) => s.index);

export const pieceKind = (p: Vec3) => {
  const n = p.filter((c) => c !== 0).length;
  return n === 1 ? "center" : n === 2 ? "edge" : "corner";
};

// ---------------------------------------------------------------------------
// Moves

interface MoveDef {
  axis: Axis;
  // Quarter-turn direction of the clockwise move, as a right-hand rotation sign about +axis.
  dir: 1 | -1;
  inLayer: (p: Vec3) => boolean;
}

const MOVE_DEFS: Record<string, MoveDef> = {
  R: { axis: 0, dir: -1, inLayer: (p) => p[0] === 1 },
  L: { axis: 0, dir: 1, inLayer: (p) => p[0] === -1 },
  U: { axis: 1, dir: -1, inLayer: (p) => p[1] === 1 },
  D: { axis: 1, dir: 1, inLayer: (p) => p[1] === -1 },
  F: { axis: 2, dir: -1, inLayer: (p) => p[2] === 1 },
  B: { axis: 2, dir: 1, inLayer: (p) => p[2] === -1 },
  M: { axis: 0, dir: 1, inLayer: (p) => p[0] === 0 },
  E: { axis: 1, dir: 1, inLayer: (p) => p[1] === 0 },
  S: { axis: 2, dir: -1, inLayer: (p) => p[2] === 0 },
  r: { axis: 0, dir: -1, inLayer: (p) => p[0] >= 0 },
  l: { axis: 0, dir: 1, inLayer: (p) => p[0] <= 0 },
  u: { axis: 1, dir: -1, inLayer: (p) => p[1] >= 0 },
  d: { axis: 1, dir: 1, inLayer: (p) => p[1] <= 0 },
  f: { axis: 2, dir: -1, inLayer: (p) => p[2] >= 0 },
  b: { axis: 2, dir: 1, inLayer: (p) => p[2] <= 0 },
  x: { axis: 0, dir: -1, inLayer: () => true },
  y: { axis: 1, dir: -1, inLayer: () => true },
  z: { axis: 2, dir: -1, inLayer: () => true },
};

export interface Move {
  token: string; // normalised text, e.g. "R'", "r2", "M"
  base: string; // key of MOVE_DEFS
  turns: 1 | 2;
  prime: boolean;
}

function rotate(v: Vec3, axis: Axis, q: number): Vec3 {
  // q = +1 or -1 quarter turn (right-hand rule about +axis)
  const [x, y, z] = v;
  if (axis === 0) return [x, -z * q, y * q];
  if (axis === 1) return [z * q, y, -x * q];
  return [-y * q, x * q, z];
}

// perm[i] = destination slot of the sticker currently in slot i, for one clockwise quarter turn.
const QUARTER_PERMS: Record<string, number[]> = {};
for (const [base, def] of Object.entries(MOVE_DEFS)) {
  QUARTER_PERMS[base] = STICKERS.map((s) => {
    if (!def.inLayer(s.pos)) return s.index;
    return slotAt(rotate(s.pos, def.axis, def.dir), rotate(s.normal, def.axis, def.dir));
  });
}

function permute(state: CubeState, perm: number[]): CubeState {
  const out = new Array<number>(54);
  for (let i = 0; i < 54; i++) out[perm[i]] = state[i];
  return out;
}

export function applyMove(state: CubeState, m: Move): CubeState {
  const perm = QUARTER_PERMS[m.base];
  const n = m.turns === 2 ? 2 : m.prime ? 3 : 1;
  let s = state;
  for (let i = 0; i < n; i++) s = permute(s, perm);
  return s;
}

const TOKEN_RE = /^([URFDLBMESxyzurfdlb])(w?)(\d?)('?)$/;

export function parseMove(raw: string): Move {
  const t = raw.replace(/[’`´]/g, "'");
  const m = TOKEN_RE.exec(t);
  if (!m) throw new Error(`Bad move "${raw}"`);
  let base = m[1];
  if (m[2] === "w") {
    if (!"URFDLB".includes(base)) throw new Error(`Bad move "${raw}"`);
    base = base.toLowerCase();
  }
  const amount = m[3] ? Number(m[3]) % 4 : 1;
  let prime = m[4] === "'";
  let turns: 1 | 2 = 1;
  if (amount === 2) turns = 2;
  else if (amount === 3) prime = !prime;
  else if (amount === 0) throw new Error(`Bad move "${raw}"`);
  const token = base + (turns === 2 ? "2" : "") + (prime ? "'" : "");
  return { token, base, turns, prime };
}

export function parseAlg(alg: string): Move[] {
  return alg
    .replace(/[(),\[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(parseMove);
}

export function invertMove(m: Move): Move {
  const prime = m.turns === 2 ? m.prime : !m.prime;
  return { ...m, prime, token: m.base + (m.turns === 2 ? "2" : "") + (prime ? "'" : "") };
}

export function invertAlg(moves: Move[]): Move[] {
  return moves.slice().reverse().map(invertMove);
}

export function applyAlg(state: CubeState, moves: Move[] | string): CubeState {
  const ms = typeof moves === "string" ? parseAlg(moves) : moves;
  return ms.reduce(applyMove, state);
}

export const algToString = (moves: Move[]) => moves.map((m) => m.token).join(" ");

const ROTATIONS = ["", "y", "y2", "y'"].flatMap((a) => ["", "x", "x2", "x'", "z", "z'"].map((b) => `${a} ${b}`.trim()));
const CENTER_SLOTS = STICKERS.filter((s) => pieceKind(s.pos) === "center").map((s) => s.index);
const centersKey = (s: CubeState) => CENTER_SLOTS.map((i) => s[i]).join(",");

/** The whole-cube rotation an algorithm leaves you in (e.g. "y" for an alg containing a y). */
export function netRotation(moves: Move[]): string {
  const k = centersKey(applyAlg(SOLVED, moves));
  return ROTATIONS.find((r) => centersKey(applyAlg(SOLVED, r)) === k) ?? "";
}

/**
 * The state an algorithm solves, held with the standard orientation (yellow up, green front).
 * For algorithms containing cube rotations the cube ends solved but rotated, as it would in your hands.
 */
export function caseState(alg: string): CubeState {
  const moves = parseAlg(alg);
  return applyAlg(applyAlg(SOLVED, netRotation(moves)), invertAlg(moves));
}

/** Solved up to holding the cube in a different orientation. */
export function isSolvedAnyOrientation(state: CubeState): boolean {
  return ROTATIONS.some((r) => applyAlg(SOLVED, r).every((v, i) => v === state[i]));
}

/** Geometry needed to animate a move: which axis, how far, and which cubies turn. */
export function moveGeometry(m: Move) {
  const def = MOVE_DEFS[m.base];
  const quarters = (m.turns === 2 ? 2 : 1) * (m.prime ? -1 : 1) * def.dir;
  return { axis: def.axis, angle: (quarters * Math.PI) / 2, inLayer: def.inLayer };
}

// ---------------------------------------------------------------------------
// Stickering masks: which stickers are shown in colour vs grey.

export type Mask = "full" | "cross" | "f2l" | "oll" | "oll-edges" | "pll-corners";

export function isVisible(mask: Mask, home: number): boolean {
  const s = STICKERS[home];
  const kind = pieceKind(s.pos);
  if (kind === "center") return true;
  switch (mask) {
    case "full":
      return true;
    case "cross":
      return kind === "edge" && s.pos[1] === -1;
    case "f2l":
      return s.pos[1] <= 0;
    case "oll":
      return s.pos[1] <= 0 || s.face === "U";
    case "oll-edges":
      return s.pos[1] <= 0 || (s.face === "U" && kind === "edge");
    case "pll-corners":
      return s.pos[1] <= 0 || s.face === "U" || kind === "corner";
  }
}

export function stickerColor(state: CubeState, slot: number, mask: Mask = "full"): string {
  const home = state[slot];
  return isVisible(mask, home) ? FACE_COLORS[STICKERS[home].face] : GREY;
}

// ---------------------------------------------------------------------------
// 2D view helpers

export interface TopViewData {
  u: string[][]; // [row][col], row 0 = back
  back: string[]; // left -> right as seen from above
  front: string[];
  left: string[]; // back -> front (top -> bottom of picture)
  right: string[];
}

export function topView(state: CubeState, mask: Mask = "full"): TopViewData {
  const c = (pos: Vec3, n: Vec3) => stickerColor(state, slotAt(pos, n), mask);
  const idx = [-1, 0, 1];
  return {
    u: idx.map((z) => idx.map((x) => c([x, 1, z], NORMALS.U))),
    back: idx.map((x) => c([x, 1, -1], NORMALS.B)),
    front: idx.map((x) => c([x, 1, 1], NORMALS.F)),
    left: idx.map((z) => c([-1, 1, z], NORMALS.L)),
    right: idx.map((z) => c([1, 1, z], NORMALS.R)),
  };
}

export interface Arrow {
  from: [number, number]; // [col, row] on the top grid
  to: [number, number];
  both: boolean; // two-way swap
}

/** Arrows showing where each last-layer piece has to travel (for PLL pictures). */
export function pllArrows(state: CubeState): Arrow[] {
  const moves: { from: [number, number]; to: [number, number] }[] = [];
  for (const s of STICKERS) {
    if (s.face !== "U" || pieceKind(s.pos) === "center") continue;
    const home = STICKERS[state[s.index]];
    if (home.pos[1] !== 1) continue;
    const from: [number, number] = [s.pos[0] + 1, s.pos[2] + 1];
    const to: [number, number] = [home.pos[0] + 1, home.pos[2] + 1];
    if (from[0] !== to[0] || from[1] !== to[1]) moves.push({ from, to });
  }
  const same = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
  const out: Arrow[] = [];
  const used = new Set<number>();
  moves.forEach((m, i) => {
    if (used.has(i)) return;
    const j = moves.findIndex((o, k) => k !== i && !used.has(k) && same(o.from, m.to) && same(o.to, m.from));
    if (j >= 0) {
      used.add(j);
      out.push({ ...m, both: true });
    } else out.push({ ...m, both: false });
    used.add(i);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Checks used by the verifier and the trainer

/** True if every sticker in the first two layers (and every center) is home. */
export function f2lSolved(state: CubeState): boolean {
  return STICKERS.every((s) => (s.pos[1] <= 0 || pieceKind(s.pos) === "center" ? state[s.index] === s.index : true));
}

export function lastLayerOriented(state: CubeState): boolean {
  return STICKERS.every((s) => s.face !== "U" || STICKERS[state[s.index]].face === "U");
}

export function isSolved(state: CubeState): boolean {
  return state.every((v, i) => v === i);
}

/** Number of last-layer pieces (corners + edges) already in their home spot. */
export function solvedLastLayerPieces(state: CubeState): number {
  let n = 0;
  for (const s of STICKERS) {
    if (s.face !== "U" || pieceKind(s.pos) === "center") continue;
    const h = STICKERS[state[s.index]];
    if (h.pos.every((v, i) => v === s.pos[i]) && h.face === "U") n++;
  }
  return n;
}

/**
 * The final U turn (AUF) that makes a PLL case picture look canonical: the ending turn that
 * leaves the most last-layer pieces already in place before you start. "" when none is needed.
 */
export function bestAuf(alg: string): string {
  let best = "";
  let bestN = -1;
  for (const a of ["", "U", "U'", "U2"]) {
    const n = solvedLastLayerPieces(caseState(`${alg} ${a}`));
    if (n > bestN) {
      best = a;
      bestN = n;
    }
  }
  return best;
}

const SCRAMBLE_FACES = ["U", "D", "R", "L", "F", "B"];
const AXIS_OF: Record<string, number> = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };

export function randomScramble(length = 20): string {
  const out: string[] = [];
  let last = "";
  let lastAxis = -1;
  let axisCount = 0;
  while (out.length < length) {
    const f = SCRAMBLE_FACES[Math.floor(Math.random() * 6)];
    if (f === last) continue;
    const ax = AXIS_OF[f];
    if (ax === lastAxis && axisCount >= 2) continue;
    axisCount = ax === lastAxis ? axisCount + 1 : 1;
    lastAxis = ax;
    last = f;
    out.push(f + ["", "'", "2"][Math.floor(Math.random() * 3)]);
  }
  return out.join(" ");
}
