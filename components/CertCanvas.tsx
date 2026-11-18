"use client";

import { useEffect, useRef, useState } from "react";
import { renderCertificate } from "@/lib/render";
import type { Mapping, Row, Template } from "@/lib/template";

interface Props {
  template: Template;
  row: Row | null;
  mapping: Mapping;
  showTokens?: boolean;
  className?: string;
}

/** תצוגה מקדימה של תעודה – אותו מנוע ציור שמשמש לייצוא ה־PDF */
export default function CertCanvas({ template, row, mapping, showTokens, className }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width || !canvas.current) return;
    const id = ++seq.current;
    const off = document.createElement("canvas");
    off.setAttribute("dir", "rtl");
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    renderCertificate(off, template, row, mapping, width * dpr, { showTokens })
      .then(() => {
        if (id !== seq.current || !canvas.current) return;
        const c = canvas.current;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d")!.drawImage(off, 0, 0);
        setReady(true);
      })
      .catch(console.error);
  }, [template, row, mapping, showTokens, width]);

  return (
    <div ref={wrap} className={`relative w-full ${className ?? ""}`} style={{ aspectRatio: "297 / 210" }}>
      {!ready && <div className="absolute inset-0 animate-pulse rounded-[inherit] bg-slate-200/70" />}
      <canvas ref={canvas} dir="rtl" className="absolute inset-0 h-full w-full rounded-[inherit]" />
    </div>
  );
}
