// Run with: npm run verify:solver
// Solves many random cubes with every base colour and both methods, and checks that the
// colour-entry validator catches impossible cubes.
import { SOLVED, applyAlg, isSolved, normalizeHeld, randomScramble, slotAt, NORMALS, STICKERS } from "../src/lib/cube";
import { COLORS, buildState, frontOptions, schemeFor, stickersFromState, type Color, type Scheme } from "../src/lib/cubeInput";
import { solve, type Method } from "../src/lib/solver";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log("FAIL:", msg);
};

const CANON = schemeFor("white", "green");

/** A random cube as the user would see it holding `base` down and `front` forward. */
function randomHeld(base: Color, front: Color) {
  const physical = applyAlg(SOLVED, randomScramble(25));
  // Find the whole-cube rotation that puts base on D and front on F, then re-describe.
  for (const r of ["", "x", "x2", "x'", "z", "z'"]) {
    for (const y of ["", "y", "y2", "y'"]) {
      const n = normalizeHeld(applyAlg(physical, `${r} ${y}`), CANON);
      if (n.palette.D === base && n.palette.F === front) return { state: n.state, scheme: n.palette as Scheme };
    }
  }
  throw new Error("no orientation");
}

const stats = { solves: 0, moves: 0, max: 0, steps: 0 };
for (const method of ["2look", "full"] as Method[]) {
  for (const base of COLORS) {
    for (const front of frontOptions(base)) {
      for (let i = 0; i < 6; i++) {
        const { state, scheme } = randomHeld(base, front);
        // Round-trip through colours, as if the user painted them in.
        const expected = schemeFor(base, front);
        const diff = (Object.keys(expected) as (keyof Scheme)[]).filter((f) => expected[f] !== scheme[f]);
        if (diff.length) fail(`scheme mismatch for ${base}/${front}: ${diff.map((f) => `${f} expected ${expected[f]} got ${scheme[f]}`).join(", ")}`);
        const built = buildState(stickersFromState(state, scheme), expected);
        if (!built.state) {
          fail(`valid cube rejected (${base}/${front}): ${built.issues.map((x) => x.message).join("; ")}`);
          continue;
        }
        if (built.state.some((v, j) => v !== state[j])) fail(`round trip changed the cube (${base}/${front})`);
        const sol = solve(built.state, expected, method);
        if (sol.error) {
          fail(`${method} ${base}/${front}: ${sol.error}`);
          continue;
        }
        // Replay every step exactly as the player shows it.
        let s = built.state;
        let sc: Scheme = expected;
        for (const step of sol.steps) {
          if (step.start.some((v, j) => v !== s[j])) fail(`step "${step.title}" starts from the wrong state`);
          const n = normalizeHeld(applyAlg(s, step.alg), sc);
          s = n.state;
          sc = n.palette as Scheme;
        }
        if (!isSolved(s)) fail(`${method} ${base}/${front}: not solved at the end`);
        const total = sol.steps.reduce((a, x) => a + x.moves, 0);
        stats.solves++;
        stats.moves += total;
        stats.steps += sol.steps.length;
        stats.max = Math.max(stats.max, total);
      }
    }
  }
}
console.log(`solved ${stats.solves} cubes · avg ${(stats.moves / stats.solves).toFixed(1)} moves, ${(stats.steps / stats.solves).toFixed(1)} steps · max ${stats.max} moves`);

// Validation catches impossible cubes
const good = stickersFromState(applyAlg(SOLVED, randomScramble(25)), CANON);
const expectError = (name: string, stickers: (Color | null)[], match: RegExp) => {
  const r = buildState(stickers, CANON);
  const msg = r.issues.map((i) => i.message).join(" | ");
  if (r.state || !match.test(msg)) fail(`${name}: expected ${match}, got "${msg || "accepted"}"`);
  else console.log(`  ok  ${name}: ${r.issues[0].message}`);
};
const edgeSlots = [slotAt([0, 1, 1], NORMALS.U), slotAt([0, 1, 1], NORMALS.F)];
const cornerSlots = [slotAt([1, 1, 1], NORMALS.U), slotAt([1, 1, 1], NORMALS.F), slotAt([1, 1, 1], NORMALS.R)];
{
  const s = good.slice();
  [s[edgeSlots[0]], s[edgeSlots[1]]] = [s[edgeSlots[1]], s[edgeSlots[0]]];
  expectError("flipped edge", s, /edge is flipped/);
}
{
  const s = good.slice();
  const [a, b, c] = cornerSlots.map((i) => s[i]);
  [s[cornerSlots[0]], s[cornerSlots[1]], s[cornerSlots[2]]] = [c, a, b];
  expectError("twisted corner", s, /corner is twisted/);
}
{
  const s = good.slice();
  [s[cornerSlots[1]], s[cornerSlots[2]]] = [s[cornerSlots[2]], s[cornerSlots[1]]];
  expectError("mirrored corner", s, /mirrored/);
}
{
  // Swap two whole edges
  const e1 = [slotAt([0, 1, 1], NORMALS.U), slotAt([0, 1, 1], NORMALS.F)];
  const e2 = [slotAt([1, 1, 0], NORMALS.U), slotAt([1, 1, 0], NORMALS.R)];
  const s = good.slice();
  [s[e1[0]], s[e2[0]]] = [s[e2[0]], s[e1[0]]];
  [s[e1[1]], s[e2[1]]] = [s[e2[1]], s[e1[1]]];
  expectError("two swapped edges", s, /swapped/);
}
{
  const s = good.slice();
  const i = STICKERS.findIndex((x, j) => s[j] !== "red" && x.pos.filter(Boolean).length > 1);
  s[i] = "red";
  expectError("ten reds", s, /10 red stickers/);
}
{
  const s = good.slice();
  s[edgeSlots[0]] = "red";
  s[edgeSlots[1]] = "orange";
  expectError("opposite colours on an edge", s, /opposite colours|10|stickers/);
}

console.log(failures ? `\n${failures} failures` : "\nAll solver checks passed");
process.exit(failures ? 1 : 0);
