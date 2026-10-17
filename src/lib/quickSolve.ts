// Shortest-ish solution for any cube state (Kociemba's two-phase algorithm, ~20 moves).
// Unlike solver.ts this follows no method: it just finds a short sequence of face turns.
import { STICKERS, type CubeState } from "./cube";

/** cubejs expects 54 face letters in URFDLB order, each face read row by row: the same layout as cube.ts. */
export const toFacelets = (state: CubeState) => state.map((h) => STICKERS[h].face).join("");

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (s: string) => void; reject: (e: Error) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./quickSolve.worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<{ id: number; solution?: string; error?: string }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.error !== undefined) p.reject(new Error(e.data.error));
      else p.resolve((e.data.solution ?? "").trim());
    };
  }
  return worker;
}

export function quickSolve(state: CubeState): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, facelets: toFacelets(state) });
  });
}
