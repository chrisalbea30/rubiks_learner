// Optimal white-cross solver (cross on the bottom). Breadth-first search over the positions of
// the four white edge stickers: 24^4 table, about 190k reachable states, built once on demand.
import { NORMALS, SOLVED, STICKERS, applyMove, parseMove, pieceKind, slotAt, type CubeState, type Move } from "./cube";

const MOVES: Move[] = ["U", "D", "R", "L", "F", "B"].flatMap((f) => [f, `${f}'`, `${f}2`].map(parseMove));

const EDGE_SLOTS = STICKERS.filter((s) => pieceKind(s.pos) === "edge").map((s) => s.index);
const EDGE_INDEX = new Map(EDGE_SLOTS.map((s, i) => [s, i]));
const WHITE = [
  slotAt([0, -1, 1], NORMALS.D),
  slotAt([1, -1, 0], NORMALS.D),
  slotAt([0, -1, -1], NORMALS.D),
  slotAt([-1, -1, 0], NORMALS.D),
];

// destOf[m][slot] = where the sticker in `slot` goes after move m
const DEST: number[][] = MOVES.map((m) => {
  const s = applyMove(SOLVED, m);
  const d = new Array<number>(54);
  s.forEach((src, dest) => (d[src] = dest));
  return d;
});

const enc = (p: number[]) =>
  ((EDGE_INDEX.get(p[0])! * 24 + EDGE_INDEX.get(p[1])!) * 24 + EDGE_INDEX.get(p[2])!) * 24 + EDGE_INDEX.get(p[3])!;

let table: Int8Array | null = null;

function build() {
  const dist = new Int8Array(24 ** 4).fill(-1);
  let frontier: number[][] = [WHITE.slice()];
  dist[enc(WHITE)] = 0;
  for (let depth = 0; frontier.length; depth++) {
    const next: number[][] = [];
    for (const p of frontier) {
      for (const d of DEST) {
        const q = p.map((s) => d[s]);
        const k = enc(q);
        if (dist[k] === -1) {
          dist[k] = depth + 1;
          next.push(q);
        }
      }
    }
    frontier = next;
  }
  return dist;
}

/** Shortest move sequence that solves the white cross on the bottom from `state`. */
export function solveCross(state: CubeState): string {
  table ??= build();
  let p = WHITE.map((h) => state.indexOf(h));
  const out: string[] = [];
  while (table[enc(p)] > 0) {
    const cur = table[enc(p)];
    const i = DEST.findIndex((d) => table![enc(p.map((s) => d[s]))] === cur - 1);
    p = p.map((s) => DEST[i][s]);
    out.push(MOVES[i].token);
  }
  return out.join(" ");
}
