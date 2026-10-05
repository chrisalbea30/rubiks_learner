// Algorithms from "CFOP Speedcubing Guide.md". Every case picture in the app is generated
// from the algorithm itself (solved cube + inverse algorithm), so the picture always matches.

export interface F2LCase {
  id: string;
  name: string;
  group: "basic" | "top" | "white-up" | "stuck";
  corner: string;
  edge: string;
  alg: string;
}

export const F2L_GROUPS: { id: F2LCase["group"]; title: string; blurb: string }[] = [
  { id: "basic", title: "The three basic inserts", blurb: "The pair is already lined up. These are the moves every other case reduces to." },
  { id: "top", title: "Both pieces on top", blurb: "Set the pieces up into a basic insert, then drop the pair in." },
  { id: "white-up", title: "Corner with white facing up", blurb: "Hide the corner, bring the edge over, then pair them." },
  { id: "stuck", title: "Pieces stuck in the slot", blurb: "Pop the pieces out with a basic insert and solve them as a fresh case." },
];

export const F2L_CASES: F2LCase[] = [
  { id: "B1", name: "Basic 1", group: "basic", corner: "Top-front-right, white facing right", edge: "Top-back, front-color on top", alg: "R U R'" },
  { id: "B2", name: "Basic 2", group: "basic", corner: "Top-front-right, white facing front", edge: "Top-left, front-color facing left", alg: "F' U' F" },
  { id: "B3", name: "Basic 3", group: "basic", corner: "Top-front-right, white facing front", edge: "Top-right, front-color on top", alg: "U R U' R'" },
  { id: "B4", name: "Basic 4", group: "basic", corner: "Top-front-right, white facing right", edge: "Top-front, front-color facing front", alg: "U' F' U F" },
  { id: "5", name: "Case 5", group: "top", corner: "White facing front", edge: "Top-back, front-color on top", alg: "U' R U R' U2 R U' R'" },
  { id: "6", name: "Case 6", group: "top", corner: "White facing right", edge: "Top-left, front-color facing left", alg: "U F' U' F U2 F' U F" },
  { id: "7", name: "Case 7", group: "top", corner: "White facing front", edge: "Top-left, front-color on top", alg: "U' R U2 R' U2 R U' R'" },
  { id: "8", name: "Case 8", group: "top", corner: "White facing right", edge: "Top-back, front-color facing back", alg: "U F' U2 F U2 F' U F" },
  { id: "9", name: "Case 9", group: "top", corner: "White facing right", edge: "Top-right, front-color on top", alg: "U' R U' R' U R U R'" },
  { id: "10", name: "Case 10", group: "top", corner: "White facing front", edge: "Top-front, front-color facing front", alg: "U F' U F U' F' U' F" },
  { id: "11", name: "Case 11", group: "white-up", corner: "White facing up", edge: "Top-right, front-color on top", alg: "R U2 R' U' R U R'" },
  { id: "12", name: "Case 12", group: "white-up", corner: "White facing up", edge: "Top-front, front-color facing front", alg: "F' U2 F U F' U' F" },
  { id: "13", name: "Case 13", group: "white-up", corner: "White facing up", edge: "Top-back, front-color on top", alg: "U R U2 R' U R U' R'" },
  { id: "14", name: "Case 14", group: "white-up", corner: "White facing up", edge: "Top-left, front-color facing left", alg: "U' F' U2 F U' F' U F" },
  { id: "15", name: "Case 15", group: "stuck", corner: "In slot, white facing front", edge: "Top-right, front-color on top", alg: "R U' R' U R U' R'" },
  { id: "16", name: "Case 16", group: "stuck", corner: "Top, white facing up", edge: "In slot, correct", alg: "R U R' U' R U R' U' R U R'" },
  { id: "17", name: "Case 17", group: "stuck", corner: "In slot, white facing front", edge: "In slot, correct", alg: "R U' R' U' R U R' U' R U2 R'" },
];

export interface OLLCase {
  id: string;
  num: number;
  group: string;
  alg: string;
  name?: string;
  recognition?: string;
}

const OLL_RAW: [number, string, string][] = [
  [1, "Dot", "R U2 R2 F R F' U2 R' F R F'"],
  [2, "Dot", "F R U R' U' F' f R U R' U' f'"],
  [3, "Dot", "f R U R' U' f' U' F R U R' U' F'"],
  [4, "Dot", "f R U R' U' f' U F R U R' U' F'"],
  [5, "Square", "r' U2 R U R' U r"],
  [6, "Square", "r U2 R' U' R U' r'"],
  [7, "Lightning", "r U R' U R U2 r'"],
  [8, "Lightning", "l' U' L U' L' U2 l"],
  [9, "Fish", "R U R' U' R' F R2 U R' U' F'"],
  [10, "Fish", "R U R' U R' F R F' R U2 R'"],
  [11, "Lightning", "r U R' U R' F R F' R U2 r'"],
  [12, "Lightning", "M' R' U' R U' R' U2 R U' M"],
  [13, "Knight move", "F U R U' R2 F' R U R U' R'"],
  [14, "Knight move", "R' F R U R' F' R F U' F'"],
  [15, "Knight move", "r' U' r R' U' R U r' U r"],
  [16, "Knight move", "r U r' R U R' U' r U' r'"],
  [17, "Dot", "R U R' U R' F R F' U2 R' F R F'"],
  [18, "Dot", "r U R' U R U2 r2 U' R U' R' U2 r"],
  [19, "Dot", "M U R U R' U' M' R' F R F'"],
  [20, "Dot", "r U R' U' M2 U R U' R' U' M'"],
  [21, "Cross", "R U2 R' U' R U R' U' R U' R'"],
  [22, "Cross", "R U2 R2 U' R2 U' R2 U2 R"],
  [23, "Cross", "R2 D' R U2 R' D R U2 R"],
  [24, "Cross", "r U R' U' r' F R F'"],
  [25, "Cross", "F' r U R' U' r' F R"],
  [26, "Cross", "R U2 R' U' R U' R'"],
  [27, "Cross", "R U R' U R U2 R'"],
  [28, "Corners oriented", "r U R' U' M U R U' R'"],
  [29, "Awkward", "R U R' U' R U' R' F' U' F R U R'"],
  [30, "Awkward", "F R' F R2 U' R' U' R U R' F2"],
  [31, "P shape", "R' U' F U R U' R' F' R"],
  [32, "P shape", "L U F' U' L' U L F L'"],
  [33, "T shape", "R U R' U' R' F R F'"],
  [34, "C shape", "R U R2 U' R' F R U R U' F'"],
  [35, "Fish", "R U2 R2 F R F' R U2 R'"],
  [36, "W shape", "L' U' L U' L' U L U L F' L' F"],
  [37, "Fish", "F R' F' R U R U' R'"],
  [38, "W shape", "R U R' U R U' R' U' R' F R F'"],
  [39, "Lightning", "L F' L' U' L U F U' L'"],
  [40, "Lightning", "R' F R U R' U' F' U R"],
  [41, "Awkward", "R U R' U R U2 R' F R U R' U' F'"],
  [42, "Awkward", "R' U' R U' R' U2 R F R U R' U' F'"],
  [43, "P shape", "F' U' L' U L F"],
  [44, "P shape", "F U R U' R' F'"],
  [45, "T shape", "F R U R' U' F'"],
  [46, "C shape", "R' U' R' F R F' U R"],
  [47, "L shape", "R' U' R' F R F' R' F R F' U R"],
  [48, "L shape", "F R U R' U' R U R' U' F'"],
  [49, "L shape", "r U' r2 U r2 U r2 U' r"],
  [50, "L shape", "r' U r2 U' r2 U' r2 U r'"],
  [51, "Line (I)", "F U R U' R' U R U' R' F'"],
  [52, "Line (I)", "R U R' U R U' B U' B' R'"],
  [53, "L shape", "l' U2 L U L' U' L U L' U l"],
  [54, "L shape", "r U2 R' U' R U R' U' R U' r'"],
  [55, "Line (I)", "R' F R U R U' R2 F' R2 U' R' U R U R'"],
  [56, "Line (I)", "r' U' r U' R' U R U' R' U R r' U r"],
  [57, "Corners oriented", "R U R' U' M' U R U' r'"],
];

const OLL_CORNER_NAMES: Record<number, [string, string]> = {
  21: ["H", "No corners up; yellow sides on front and back (two each)"],
  22: ["Pi", "No corners up; two yellow on the left side, one each on front and back"],
  23: ["Headlights", "Two front corners up; two yellow on the back side"],
  24: ["Chameleon (T)", "Two right corners up; yellow on front and back"],
  25: ["Bowtie (L)", "Back-right and front-left corners up; yellow on front and left"],
  26: ["Antisune", "One corner up, held at back-right"],
  27: ["Sune", "One corner up, held at front-left"],
};

export const OLL_CASES: OLLCase[] = OLL_RAW.map(([num, group, alg]) => ({
  id: `oll-${num}`,
  num,
  group,
  alg,
  name: OLL_CORNER_NAMES[num]?.[0],
  recognition: OLL_CORNER_NAMES[num]?.[1],
}));

export const OLL_GROUP_ORDER = [
  "Cross",
  "T shape",
  "P shape",
  "L shape",
  "Square",
  "C shape",
  "W shape",
  "Fish",
  "Lightning",
  "Knight move",
  "Awkward",
  "Line (I)",
  "Corners oriented",
  "Dot",
];

export interface TwoLookCase {
  id: string;
  name: string;
  hold: string;
  alg: string;
  /** Text shown instead of the raw algorithm when the demo combines steps. */
  display?: string;
}

export const OLL_EDGE_CASES: TwoLookCase[] = [
  { id: "eo-line", name: "Line", hold: "Line horizontal (left to right)", alg: "F R U R' U' F'" },
  { id: "eo-l", name: "L shape", hold: "L in the back-left (edges at left and back)", alg: "F U R U' R' F'" },
  {
    id: "eo-dot",
    name: "Dot",
    hold: "Any way",
    alg: "F R U R' U' F' U2 F U R U' R' F'",
    display: "F R U R' U' F', then (U2) do the L-shape case",
  },
];

export const OLL_CORNER_CASES: TwoLookCase[] = [21, 22, 23, 24, 25, 26, 27].map((n) => {
  const c = OLL_CASES[n - 1];
  return { id: `oc-${n}`, name: `${n} ${c.name}`, hold: c.recognition ?? "", alg: c.alg };
});

export interface PLLCase {
  id: string;
  name: string;
  type: "Corners only" | "Edges only" | "Adjacent corner swap" | "Diagonal corner swap";
  alg: string;
}

export const PLL_CASES: PLLCase[] = (
  [
    ["Aa", "Corners only", "x R' U R' D2 R U' R' D2 R2 x'"],
    ["Ab", "Corners only", "x R2 D2 R U R' D2 R U' R x'"],
    ["E", "Corners only", "x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
    ["H", "Edges only", "M2 U M2 U2 M2 U M2"],
    ["Ua", "Edges only", "M2 U M U2 M' U M2"],
    ["Ub", "Edges only", "M2 U' M U2 M' U' M2"],
    ["Z", "Edges only", "M' U M2 U M2 U M' U2 M2"],
    ["T", "Adjacent corner swap", "R U R' U' R' F R2 U' R' U' R U R' F'"],
    ["F", "Adjacent corner swap", "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
    ["Ja", "Adjacent corner swap", "L' U' L F L' U' L U L F' L2 U L"],
    ["Jb", "Adjacent corner swap", "R U R' F' R U R' U' R' F R2 U' R'"],
    ["Ra", "Adjacent corner swap", "R U' R' U' R U R D R' U' R D' R' U2 R'"],
    ["Rb", "Adjacent corner swap", "R2 F R U R U' R' F' R U2 R' U2 R"],
    ["Ga", "Adjacent corner swap", "R2 U R' U R' U' R U' R2 U' D R' U R D'"],
    ["Gb", "Adjacent corner swap", "R' U' R U D' R2 U R' U R U' R U' R2 D"],
    ["Gc", "Adjacent corner swap", "R2 U' R U' R U R' U R2 U D' R U' R' D"],
    ["Gd", "Adjacent corner swap", "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
    ["Y", "Diagonal corner swap", "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
    ["V", "Diagonal corner swap", "R' U R' U' y R' F' R2 U' R' U R' F R F"],
    ["Na", "Diagonal corner swap", "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
    ["Nb", "Diagonal corner swap", "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ] as [string, PLLCase["type"], string][]
).map(([name, type, alg]) => ({ id: `pll-${name}`, name, type, alg }));

export const PLL_TYPE_ORDER: PLLCase["type"][] = [
  "Edges only",
  "Corners only",
  "Adjacent corner swap",
  "Diagonal corner swap",
];

export const PLL_CORNER_CASES: TwoLookCase[] = [
  { id: "pc-t", name: "Headlights on one side", hold: "Headlights on the left (T perm)", alg: PLL_CASES[7].alg },
  { id: "pc-y", name: "No headlights anywhere", hold: "Any way (Y perm)", alg: PLL_CASES[17].alg },
];

export const PLL_EDGE_CASES: TwoLookCase[] = [
  { id: "pe-ua", name: "Ua (3 edges cycle)", hold: "Solved side at the back", alg: PLL_CASES[4].alg },
  { id: "pe-ub", name: "Ub (3 edges cycle the other way)", hold: "Solved side at the back", alg: PLL_CASES[5].alg },
  { id: "pe-h", name: "H (opposite edges swap)", hold: "Any way", alg: PLL_CASES[3].alg },
  { id: "pe-z", name: "Z (adjacent edges swap)", hold: "Front edge swapped with left, back with right", alg: PLL_CASES[6].alg },
];

export interface NotationMove {
  move: string;
  meaning: string;
  group: "face" | "prime" | "double" | "wide" | "slice" | "rotation";
}

export const NOTATION: NotationMove[] = [
  { move: "R", meaning: "Right face, clockwise", group: "face" },
  { move: "L", meaning: "Left face, clockwise", group: "face" },
  { move: "U", meaning: "Up (top) face, clockwise", group: "face" },
  { move: "D", meaning: "Down (bottom) face, clockwise", group: "face" },
  { move: "F", meaning: "Front face, clockwise", group: "face" },
  { move: "B", meaning: "Back face, clockwise", group: "face" },
  { move: "R'", meaning: "Prime = counter-clockwise", group: "prime" },
  { move: "U'", meaning: "Up face, counter-clockwise", group: "prime" },
  { move: "F'", meaning: "Front face, counter-clockwise", group: "prime" },
  { move: "R2", meaning: "Half turn (180°), direction doesn't matter", group: "double" },
  { move: "U2", meaning: "Up face half turn", group: "double" },
  { move: "r", meaning: "Wide: R face + middle layer (also Rw)", group: "wide" },
  { move: "l", meaning: "Wide: L face + middle layer", group: "wide" },
  { move: "u", meaning: "Wide: U face + middle layer", group: "wide" },
  { move: "f", meaning: "Wide: F face + middle layer", group: "wide" },
  { move: "M", meaning: "Middle slice (between L and R), turns like L", group: "slice" },
  { move: "E", meaning: "Equator slice (between U and D), turns like D", group: "slice" },
  { move: "S", meaning: "Standing slice (between F and B), turns like F", group: "slice" },
  { move: "x", meaning: "Rotate the whole cube like R", group: "rotation" },
  { move: "y", meaning: "Rotate the whole cube like U", group: "rotation" },
  { move: "z", meaning: "Rotate the whole cube like F", group: "rotation" },
];

export const TRIGGERS = [
  { name: "Sexy move", alg: "R U R' U'", note: "The most common chunk in cubing. Repeat it 6 times and the cube returns to where it started." },
  { name: "Sledgehammer", alg: "R' F R F'", note: "The second most common chunk. Shows up in many OLL algorithms." },
];
