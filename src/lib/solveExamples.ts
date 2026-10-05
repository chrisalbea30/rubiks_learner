import { SOLVED, applyAlg, randomScramble, type CubeState } from "./cube";
import { schemeFor, type Mode } from "./cubeInput";
import { solve, type Stage } from "./solver";

const STAGE_OF: Record<Exclude<Mode, "scratch">, Stage> = { f2l: "f2l", oll: "oll", pll: "pll" };

/**
 * A random cube that matches a mode: fully scrambled, or with the earlier stages already solved
 * (found by solving a scramble and stopping where the requested stage begins).
 */
export function exampleState(mode: Mode): CubeState {
  const scheme = schemeFor("white", "green"); // the state itself doesn't depend on colours
  for (let i = 0; i < 50; i++) {
    const scrambled = applyAlg(SOLVED, randomScramble(25));
    if (mode === "scratch") return scrambled;
    const { steps } = solve(scrambled, scheme, "2look");
    const step = steps.find((s) => s.stage === STAGE_OF[mode]);
    if (step) return step.start;
  }
  return SOLVED;
}
