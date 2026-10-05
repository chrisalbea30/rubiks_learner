import {
  FACES, GREY, NORMALS, STICKERS, pllArrows, stickerColor, topView,
  type CubeState, type Face, type Mask, type Vec3,
} from "@/lib/cube";

const PLASTIC = "#15171d";

// ---------------------------------------------------------------------------
// Top view (OLL / PLL): the U face from above, front at the bottom of the picture.

export function TopView({
  state,
  mask = "full",
  arrows = false,
  className = "",
}: {
  state: CubeState;
  mask?: Mask;
  arrows?: boolean;
  className?: string;
}) {
  const v = topView(state, mask);
  const cell = 10;
  const gap = 1;
  const strip = 3.2;
  const sgap = 1.3;
  const o = strip + sgap;
  const grid = cell * 3 + gap * 2;
  const W = o * 2 + grid;
  const at = (i: number) => o + i * (cell + gap);
  const center = (c: number, r: number): [number, number] => [at(c) + cell / 2, at(r) + cell / 2];

  return (
    <svg viewBox={`-0.5 -0.5 ${W + 1} ${W + 1}`} className={className} role="img" aria-label="Top layer seen from above">
      <rect x={o - 1.2} y={o - 1.2} width={grid + 2.4} height={grid + 2.4} rx={2.4} fill={PLASTIC} />
      {v.u.map((row, r) =>
        row.map((c, col) => <rect key={`u${r}${col}`} x={at(col)} y={at(r)} width={cell} height={cell} rx={1.6} fill={c} />),
      )}
      {v.back.map((c, i) => <rect key={`b${i}`} x={at(i)} y={0} width={cell} height={strip} rx={1} fill={c} />)}
      {v.front.map((c, i) => <rect key={`f${i}`} x={at(i)} y={o + grid + sgap} width={cell} height={strip} rx={1} fill={c} />)}
      {v.left.map((c, i) => <rect key={`l${i}`} x={0} y={at(i)} width={strip} height={cell} rx={1} fill={c} />)}
      {v.right.map((c, i) => <rect key={`r${i}`} x={o + grid + sgap} y={at(i)} width={strip} height={cell} rx={1} fill={c} />)}
      {arrows &&
        pllArrows(state).map((a, i) => {
          const [x1, y1] = center(...a.from);
          const [x2, y2] = center(...a.to);
          return <ArrowLine key={i} x1={x1} y1={y1} x2={x2} y2={y2} both={a.both} />;
        })}
    </svg>
  );
}

function ArrowLine({ x1, y1, x2, y2, both }: { x1: number; y1: number; x2: number; y2: number; both: boolean }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const trim = 2.4;
  const sx = x1 + ux * trim;
  const sy = y1 + uy * trim;
  const ex = x2 - ux * trim;
  const ey = y2 - uy * trim;
  const head = (hx: number, hy: number, dirx: number, diry: number) => {
    const s = 3.1;
    const w = 1.9;
    const bx = hx - dirx * s;
    const by = hy - diry * s;
    return `${hx},${hy} ${bx - diry * w},${by + dirx * w} ${bx + diry * w},${by - dirx * w}`;
  };
  const lineStart = both ? [sx + ux * 2.2, sy + uy * 2.2] : [sx, sy];
  const lineEnd = [ex - ux * 2.2, ey - uy * 2.2];
  return (
    <g>
      <line x1={lineStart[0]} y1={lineStart[1]} x2={lineEnd[0]} y2={lineEnd[1]} stroke="#fff" strokeWidth={2.6} strokeLinecap="round" opacity={0.9} />
      <line x1={lineStart[0]} y1={lineStart[1]} x2={lineEnd[0]} y2={lineEnd[1]} stroke="#111" strokeWidth={1.2} strokeLinecap="round" />
      <polygon points={head(ex, ey, ux, uy)} fill="#111" stroke="#fff" strokeWidth={0.6} strokeLinejoin="round" />
      {both && <polygon points={head(sx, sy, -ux, -uy)} fill="#111" stroke="#fff" strokeWidth={0.6} strokeLinejoin="round" />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Isometric view: three faces of the cube as if you were holding it.

type V3 = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function tangents(n: Vec3): [V3, V3] {
  if (n[1] !== 0) return [[1, 0, 0], [0, 0, 1]];
  if (n[0] !== 0) return [[0, 1, 0], [0, 0, 1]];
  return [[1, 0, 0], [0, 1, 0]];
}

const SHADE: Partial<Record<Face, number>> = { U: 0, D: 0, F: 0.1, R: 0.22 };

export function IsoView({
  state,
  mask = "full",
  from = "top",
  className = "",
  highlight,
}: {
  state: CubeState;
  mask?: Mask;
  from?: "top" | "bottom";
  className?: string;
  /** Slot indices to outline. */
  highlight?: number[];
}) {
  const faces: Face[] = from === "top" ? ["U", "F", "R"] : ["D", "F", "R"];
  const view = norm(from === "top" ? [1, 1.05, 1.25] : [1, -1.05, 1.25]);
  const right = norm(cross([0, 1, 0], view));
  const up = norm(cross(view, right));
  const P = (p: V3) => [dot(p, right) * 10, -dot(p, up) * 10] as const;
  const poly = (pts: V3[]) => pts.map((p) => P(p).join(",")).join(" ");
  const hl = new Set(highlight ?? []);

  const quad = (c: V3, a: V3, b: V3, h: number): V3[] => [
    [c[0] - a[0] * h - b[0] * h, c[1] - a[1] * h - b[1] * h, c[2] - a[2] * h - b[2] * h],
    [c[0] + a[0] * h - b[0] * h, c[1] + a[1] * h - b[1] * h, c[2] + a[2] * h - b[2] * h],
    [c[0] + a[0] * h + b[0] * h, c[1] + a[1] * h + b[1] * h, c[2] + a[2] * h + b[2] * h],
    [c[0] - a[0] * h + b[0] * h, c[1] - a[1] * h + b[1] * h, c[2] - a[2] * h + b[2] * h],
  ];

  return (
    <svg viewBox="-27 -27 54 54" className={className} role="img" aria-label="Cube seen from the front-right">
      {faces.map((f) => {
        const n = NORMALS[f];
        const [a, b] = tangents(n);
        const c: V3 = [n[0] * 1.5, n[1] * 1.5, n[2] * 1.5];
        return <polygon key={f} points={poly(quad(c, a, b, 1.55))} fill={PLASTIC} strokeLinejoin="round" stroke={PLASTIC} strokeWidth={0.8} />;
      })}
      {STICKERS.filter((s) => faces.includes(s.face)).map((s) => {
        const [a, b] = tangents(s.normal);
        const c: V3 = [s.pos[0] + s.normal[0] * 0.5, s.pos[1] + s.normal[1] * 0.5, s.pos[2] + s.normal[2] * 0.5];
        const pts = poly(quad(c, a, b, 0.43));
        const shade = SHADE[s.face] ?? 0;
        return (
          <g key={s.index}>
            <polygon points={pts} fill={stickerColor(state, s.index, mask)} />
            {shade > 0 && <polygon points={pts} fill="#000" opacity={shade} />}
            {hl.has(s.index) && <polygon points={pts} fill="none" stroke="#fff" strokeWidth={0.7} />}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Unfolded net of the whole cube (used for scrambles).

export function NetView({ state, mask = "full", className = "" }: { state: CubeState; mask?: Mask; className?: string }) {
  const cell = 10;
  const faceSize = cell * 3 + 2;
  const pos: Record<Face, [number, number]> = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
  return (
    <svg viewBox={`-1 -1 ${faceSize * 4 + 6} ${faceSize * 3 + 4}`} className={className} role="img" aria-label="Unfolded cube">
      {FACES.map((f) => {
        const [fx, fy] = pos[f];
        const ox = fx * (faceSize + 1.5);
        const oy = fy * (faceSize + 1.5);
        return (
          <g key={f}>
            <rect x={ox} y={oy} width={faceSize} height={faceSize} rx={2} fill={PLASTIC} />
            {STICKERS.filter((s) => s.face === f).map((s) => (
              <rect
                key={s.index}
                x={ox + 1 + s.col * cell + 0.5}
                y={oy + 1 + s.row * cell + 0.5}
                width={cell - 1}
                height={cell - 1}
                rx={1.4}
                fill={stickerColor(state, s.index, mask)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export { GREY };
