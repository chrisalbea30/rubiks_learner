// Reading sticker colours from a photo of one face.
//
// Each of the 9 cells is sampled in its middle (avoiding the black plastic and glare at the edges)
// using the per-channel median. Colours are compared in CIE Lab, against reference colours that are
// calibrated from the centre stickers already photographed: the centre's colour is always known, so
// every photo teaches us what that colour looks like under the user's lighting.
import { COLORS, type Color } from "./cubeInput";

export type RGB = [number, number, number];

// Typical phone-camera readings of each colour, used until a centre has been photographed.
const DEFAULT_RGB: Record<Color, RGB> = {
  white: [215, 218, 220],
  yellow: [220, 205, 45],
  green: [30, 150, 80],
  blue: [25, 75, 170],
  red: [175, 30, 40],
  orange: [235, 110, 35],
};

function toLab([r, g, b]: RGB): RGB {
  const lin = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Median RGB of the middle of each cell of a 3x3 grid covering the whole image data. */
export function sampleGrid(img: ImageData): RGB[] {
  const out: RGB[] = [];
  const cw = img.width / 3;
  const ch = img.height / 3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x0 = Math.floor(col * cw + cw * 0.28);
      const x1 = Math.floor(col * cw + cw * 0.72);
      const y0 = Math.floor(row * ch + ch * 0.28);
      const y1 = Math.floor(row * ch + ch * 0.72);
      const rs: number[] = [];
      const gs: number[] = [];
      const bs: number[] = [];
      const step = Math.max(1, Math.floor((x1 - x0) / 24));
      for (let y = y0; y < y1; y += step) {
        for (let x = x0; x < x1; x += step) {
          const i = (y * img.width + x) * 4;
          rs.push(img.data[i]);
          gs.push(img.data[i + 1]);
          bs.push(img.data[i + 2]);
        }
      }
      const med = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)] ?? 0;
      out.push([med(rs), med(gs), med(bs)]);
    }
  }
  return out;
}

/** Reference Lab colour per sticker colour: calibrated centres where known, defaults otherwise. */
export function references(calibration: Partial<Record<Color, RGB>>): Record<Color, RGB> {
  const refs = {} as Record<Color, RGB>;
  for (const c of COLORS) refs[c] = toLab(calibration[c] ?? DEFAULT_RGB[c]);
  return refs;
}

export function classify(rgb: RGB, refs: Record<Color, RGB>): Color {
  const lab = toLab(rgb);
  let best: Color = "white";
  let bestD = Infinity;
  for (const c of COLORS) {
    const r = refs[c];
    // Weight lightness less: shadows change brightness far more than hue.
    const d = 0.5 * (lab[0] - r[0]) ** 2 + (lab[1] - r[1]) ** 2 + (lab[2] - r[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Crop `rect` (in source pixels) from an image/video into ImageData, scaled to a small working size. */
export function grab(source: CanvasImageSource, rect: { x: number; y: number; size: number }): ImageData {
  const n = 180;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(source, rect.x, rect.y, rect.size, rect.size, 0, 0, n, n);
  return g.getImageData(0, 0, n, n);
}
