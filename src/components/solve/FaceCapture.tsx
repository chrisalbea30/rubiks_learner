"use client";

import { useEffect, useRef, useState } from "react";
import { COLOR_HEX, type Color } from "@/lib/cubeInput";
import { classify, grab, references, sampleGrid, type RGB } from "@/lib/colorDetect";

interface Props {
  title: string;
  hint: string;
  centerColor: Color;
  calibration: Partial<Record<Color, RGB>>;
  onUse: (colors: Color[], samples: RGB[]) => void;
  onClose: () => void;
}

type Phase = "choose" | "live" | "photo" | "review";

export default function FaceCapture({ title, hint, centerColor, calibration, onUse, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ colors: Color[]; samples: RGB[] } | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const liveAvailable = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => stop, []);

  const read = (samples: RGB[]) => {
    // The centre is always known; it also calibrates this colour for later photos.
    const cal = { ...calibration, [centerColor]: samples[4] };
    const refs = references(cal);
    const colors = samples.map((s, i) => (i === 4 ? centerColor : classify(s, refs)));
    setResult({ colors, samples });
    setPhase("review");
  };

  const startLive = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
      stream.current = s;
      setPhase("live");
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = s;
          video.current.play().catch(() => {});
        }
      });
    } catch {
      setError("Couldn't open the camera. Allow camera access, or use “Take or upload a photo” instead.");
    }
  };

  const captureLive = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    // The preview is a square with object-cover, so the visible area is the centred square of the frame.
    const side = Math.min(v.videoWidth, v.videoHeight);
    const guide = side * GUIDE;
    const rect = { x: (v.videoWidth - guide) / 2, y: (v.videoHeight - guide) / 2, size: guide };
    read(sampleGrid(grab(v, rect)));
    stop();
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setPhase("photo");
    };
    image.onerror = () => setError("That file couldn't be opened as an image.");
    image.src = url;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-2 backdrop-blur-sm sm:items-center" role="dialog" aria-modal>
      <div className="max-h-[96vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Photo of one face</div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{hint}</p>
          </div>
          <button
            onClick={() => {
              stop();
              onClose();
            }}
            className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-sm text-zinc-300"
          >
            Close
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

        {phase === "choose" && (
          <div className="grid gap-2">
            {liveAvailable && (
              <button onClick={startLive} className="rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-black hover:bg-amber-300">
                Use live camera
              </button>
            )}
            <button onClick={() => fileInput.current?.click()} className="rounded-2xl border border-white/15 px-4 py-3 font-semibold text-white hover:bg-white/5">
              Take or upload a photo
            </button>
            <p className="text-xs leading-relaxed text-zinc-500">
              Tip: even daylight, no flash, and fill the square with the face. You can fix any wrong sticker afterwards by tapping it.
            </p>
          </div>
        )}

        {phase === "live" && (
          <div>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
              <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
              <Guide size={GUIDE} center={COLOR_HEX[centerColor]} />
            </div>
            <button onClick={captureLive} className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-black hover:bg-amber-300">
              Capture
            </button>
          </div>
        )}

        {phase === "photo" && img && <PhotoAdjust img={img} center={COLOR_HEX[centerColor]} onRead={(s) => read(s)} onRetake={() => fileInput.current?.click()} />}

        {phase === "review" && result && (
          <div>
            <p className="mb-3 text-sm text-zinc-400">Here&apos;s what I read. If something&apos;s off, use it anyway and tap the sticker to fix it.</p>
            <div className="mx-auto grid w-48 grid-cols-3 gap-1.5 rounded-2xl bg-[#15171d] p-2">
              {result.colors.map((c, i) => (
                <div key={i} className="aspect-square rounded-lg" style={{ background: COLOR_HEX[c] }} />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setResult(null);
                  setPhase("choose");
                }}
                className="rounded-2xl border border-white/15 px-4 py-3 font-semibold text-white hover:bg-white/5"
              >
                Retake
              </button>
              <button onClick={() => onUse(result.colors, result.samples)} className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-black hover:bg-emerald-300">
                Use these
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const GUIDE = 0.72;

function Guide({ size, center }: { size: number; center: string }) {
  const pct = `${size * 100}%`;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: pct, height: pct }}>
      <GridLines center={center} />
    </div>
  );
}

function GridLines({ center }: { center: string }) {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 rounded-lg border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center justify-center border border-white/50">
          {i === 4 && <span className="h-3 w-3 rounded-full border-2 border-white" style={{ background: center }} />}
        </div>
      ))}
    </div>
  );
}

/** Uploaded photo with a square guide the user can drag and resize to sit over the face. */
function PhotoAdjust({ img, center, onRead, onRetake }: { img: HTMLImageElement; center: string; onRead: (s: RGB[]) => void; onRetake: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0.7); // fraction of the container
  const [pos, setPos] = useState({ x: 0.15, y: 0.15 }); // top-left, fraction of the container
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const clamp = (v: number, s: number) => Math.min(Math.max(v, 0), 1 - s);

  const readColors = () => {
    const el = box.current;
    if (!el) return;
    const S = el.clientWidth;
    const scale = Math.min(S / img.naturalWidth, S / img.naturalHeight);
    const ox = (S - img.naturalWidth * scale) / 2;
    const oy = (S - img.naturalHeight * scale) / 2;
    const rect = { x: (pos.x * S - ox) / scale, y: (pos.y * S - oy) / scale, size: (size * S) / scale };
    onRead(sampleGrid(grab(img, rect)));
  };

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-400">Drag the grid over the face and resize it so each square covers one sticker.</p>
      <div ref={box} className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="Your photo" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
        <div
          className="absolute cursor-move"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, width: `${size * 100}%`, height: `${size * 100}%` }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            const S = box.current?.clientWidth ?? 1;
            if (!d) return;
            setPos({ x: clamp(d.x + (e.clientX - d.px) / S, size), y: clamp(d.y + (e.clientY - d.py) / S, size) });
          }}
          onPointerUp={() => (drag.current = null)}
        >
          <GridLines center={center} />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-3 text-sm text-zinc-400">
        Size
        <input
          type="range"
          min={0.25}
          max={1}
          step={0.01}
          value={size}
          onChange={(e) => {
            const s = Number(e.target.value);
            setSize(s);
            setPos((p) => ({ x: clamp(p.x, s), y: clamp(p.y, s) }));
          }}
          className="flex-1 accent-amber-400"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onRetake} className="rounded-2xl border border-white/15 px-4 py-3 font-semibold text-white hover:bg-white/5">
          Another photo
        </button>
        <button onClick={readColors} className="rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-black hover:bg-amber-300">
          Read colours
        </button>
      </div>
    </div>
  );
}
