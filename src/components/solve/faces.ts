import { STICKERS, type Face } from "@/lib/cube";
import { isLocked, type Mode, type Scheme } from "@/lib/cubeInput";

/** The order a person naturally photographs or fills a held cube: around the sides, then top and bottom. */
export const FACE_ORDER: Face[] = ["F", "R", "B", "L", "U", "D"];

export const FACE_NAME: Record<Face, string> = { F: "Front", R: "Right", B: "Back", L: "Left", U: "Top", D: "Bottom" };

/** Which held face sits on each side of a face when you look straight at it (matches the net layout in cube.ts). */
export const NEIGHBORS: Record<Face, { top: Face; bottom: Face; left: Face; right: Face }> = {
  F: { top: "U", bottom: "D", left: "L", right: "R" },
  R: { top: "U", bottom: "D", left: "F", right: "B" },
  B: { top: "U", bottom: "D", left: "R", right: "L" },
  L: { top: "U", bottom: "D", left: "B", right: "F" },
  U: { top: "B", bottom: "F", left: "L", right: "R" },
  D: { top: "F", bottom: "B", left: "L", right: "R" },
};

/** How to hold the cube to look at a face, using the cube's real colours. */
export function holdHint(face: Face, s: Scheme): string {
  switch (face) {
    case "F":
      return `Hold ${s.D} on the bottom and ${s.F} facing you.`;
    case "R":
      return `Turn the whole cube to the left so ${s.R} faces you. Keep ${s.D} on the bottom.`;
    case "B":
      return `Turn it left again so ${s.B} faces you.`;
    case "L":
      return `Once more: ${s.L} faces you, ${s.D} still on the bottom.`;
    case "U":
      return `With ${s.F} in front, tip the top toward you so ${s.U} faces you and ${s.F} is at the bottom.`;
    case "D":
      return `With ${s.F} in front, tip the bottom up toward you so ${s.D} faces you and ${s.F} is at the top.`;
  }
}

/** Sticker slots of a face in reading order (row by row, as you see the face). */
export const faceSlots = (face: Face) =>
  STICKERS.filter((s) => s.face === face)
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((s) => s.index);

/** Every editable slot in fill order for a mode. */
export const editableOrder = (mode: Mode) => FACE_ORDER.flatMap((f) => faceSlots(f).filter((i) => !isLocked(mode, i)));

export const facesFor = (mode: Mode) => FACE_ORDER.filter((f) => faceSlots(f).some((i) => !isLocked(mode, i)));
