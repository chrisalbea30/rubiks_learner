// Runs the two-phase solver off the main thread: building its tables takes about a second.
import Cube from "cubejs";

let ready = false;

self.onmessage = (e: MessageEvent<{ id: number; facelets: string }>) => {
  const { id, facelets } = e.data;
  try {
    if (!ready) {
      Cube.initSolver();
      ready = true;
    }
    self.postMessage({ id, solution: Cube.fromString(facelets).solve() });
  } catch (err) {
    self.postMessage({ id, error: (err as Error).message });
  }
};
