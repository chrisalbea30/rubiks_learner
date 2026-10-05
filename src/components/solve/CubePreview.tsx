"use client";

import { useEffect, useRef } from "react";
import { SOLVED, type Face } from "@/lib/cube";
import { CubeScene } from "../cube/CubeScene";

/** A 3D cube showing exactly the colours entered so far, turning to face the side being edited. */
export default function CubePreview({ colors, face, className = "" }: { colors: string[]; face: Face; className?: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const scene = useRef<CubeScene | null>(null);
  const latest = useRef({ colors, face });

  useEffect(() => {
    latest.current = { colors, face };
  });

  useEffect(() => {
    if (!holder.current) return;
    const s = new CubeScene(holder.current, SOLVED);
    s.setStickerColors(latest.current.colors);
    s.lookAtFace(latest.current.face);
    scene.current = s;
    return () => {
      s.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => scene.current?.setStickerColors(colors), [colors]);
  useEffect(() => scene.current?.lookAtFace(face), [face]);

  return (
    <div
      ref={holder}
      className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--color-stage-1),_var(--color-stage-2))] ${className}`}
      aria-label="3D preview of the colours you've entered"
    />
  );
}
