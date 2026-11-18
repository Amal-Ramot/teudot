"use client";

import { useEffect, useMemo, useRef, useState, PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowLeft, ArrowRight, Bold, ChevronLeft, ChevronRight, Copy, Eye, EyeOff,
  FileDown, FileUp, ImagePlus, Minus, RotateCw, Layers, Redo2, RotateCcw, Trash2, Type, Undo2, Wallpaper, Braces, MousePointer2,
} from "lucide-react";
import { Button, Card, Label, Segmented, inputCls } from "./ui";
import CertCanvas from "./CertCanvas";
import type { Dataset } from "@/lib/data";
import {
  CertElement, FONTS, ImageElement, Mapping, PAGE_H, PAGE_W, Template, TextElement, defaultTemplate, extractTokens,
} from "@/lib/template";

interface Props {
  template: Template;
  update: (t: Template, record?: boolean) => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  data: Dataset | null;
  mapping: Mapping;
  onBack: () => void;
  onNext: () => void;
}

const snap = (v: number) => Math.round(v * 2) / 2;
const uid = () => Math.random().toString(36).slice(2, 9);

function readFileAsDataURL(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

type Corner = "nw" | "ne" | "sw" | "se";

export default function DesignStep(p: Props) {
  const { template, update, data, mapping } = p;
  const [sel, setSel] = useState<string | null>(null);
  const [showData, setShowData] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [idx, setIdx] = useState(0);
  const overlay = useRef<HTMLDivElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const replaceImg = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const rows = data?.rows ?? [];
  const row = showData && rows.length ? rows[Math.min(idx, rows.length - 1)] : null;
  const selected = template.elements.find((e) => e.id === sel) ?? null;
  const tokens = useMemo(() => extractTokens(template), [template]);
  const insertables = useMemo(() => {
    const s = new Set<string>([...tokens, ...(data?.columns ?? [])]);
    return [...s];
  }, [tokens, data]);

  const patch = (id: string, ch: Partial<CertElement>, record = true) =>
    update(
      { ...template, elements: template.elements.map((e) => (e.id === id ? ({ ...e, ...ch } as CertElement) : e)) },
      record,
    );

  // ---- גרירה ושינוי גודל ----
  const drag = useRef<{
    id: string;
    sx: number;
    sy: number;
    el: CertElement;
    corner?: Corner;
    moved: boolean;
  } | null>(null);

  function startDrag(e: RPointerEvent, el: CertElement, corner?: Corner) {
    e.stopPropagation();
    e.preventDefault();
    setSel(el.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: el.id, sx: e.clientX, sy: e.clientY, el, corner, moved: false };
  }

  function onMove(e: RPointerEvent) {
    const d = drag.current;
    if (!d || !overlay.current) return;
    const rect = overlay.current.getBoundingClientRect();
    const k = PAGE_W / rect.width;
    const dx = (e.clientX - d.sx) * k;
    const dy = (e.clientY - d.sy) * k;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 3) return;
      d.moved = true;
      p.checkpoint();
    }
    const o = d.el;
    if (!d.corner) {
      patch(o.id, {
        x: snap(Math.max(0, Math.min(PAGE_W - o.w, o.x + dx))),
        y: snap(Math.max(0, Math.min(PAGE_H - o.h, o.y + dy))),
      }, false);
      return;
    }
    let { x, y, w, h } = o;
    if (d.corner.includes("e")) w = Math.max(4, o.w + dx);
    if (d.corner.includes("w")) {
      w = Math.max(4, o.w - dx);
      x = o.x + o.w - w;
    }
    if (d.corner.includes("s")) h = Math.max(3, o.h + dy);
    if (d.corner.includes("n")) {
      h = Math.max(3, o.h - dy);
      y = o.y + o.h - h;
    }
    patch(o.id, { x: snap(x), y: snap(y), w: snap(w), h: snap(h) }, false);
  }

  function endDrag() {
    drag.current = null;
  }

  // ---- מקלדת ----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) p.redo();
        else p.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        p.redo();
        return;
      }
      if (typing || !selected) return;
      const step = e.shiftKey ? 5 : 0.5;
      const mv: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (mv[e.key]) {
        e.preventDefault();
        patch(selected.id, { x: snap(selected.x + mv[e.key][0]), y: snap(selected.y + mv[e.key][1]) });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(selected.id);
      } else if (e.key === "Escape") setSel(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function remove(id: string) {
    update({ ...template, elements: template.elements.filter((e) => e.id !== id) });
    setSel(null);
  }

  function duplicate(el: CertElement) {
    const n = { ...el, id: uid(), label: `${el.label} (העתק)`, x: el.x + 4, y: el.y + 4 };
    update({ ...template, elements: [...template.elements, n] });
    setSel(n.id);
  }

  function addText() {
    const el: TextElement = {
      id: uid(), kind: "text", label: "טקסט חדש", x: 110, y: 100, w: 80, h: 7, text: "טקסט חדש",
      align: "center", font: "Heebo", size: 14, bold: false, pad: 2, color: "#000000", visible: true,
    };
    update({ ...template, elements: [...template.elements, el] });
    setSel(el.id);
  }

  function addLine() {
    const el: CertElement = { id: uid(), kind: "line", label: "קו", x: 110, y: 100, w: 70, h: 2, color: "#000000", thickness: 0.35, visible: true };
    update({ ...template, elements: [...template.elements, el] });
    setSel(el.id);
  }

  async function addImage(f?: File) {
    if (!f) return;
    const src = await readFileAsDataURL(f);
    const img = new Image();
    img.src = src;
    await img.decode().catch(() => undefined);
    const w = 30;
    const h = img.naturalWidth ? (w * img.naturalHeight) / img.naturalWidth : 30;
    const el: ImageElement = { id: uid(), kind: "image", label: f.name.replace(/\.[^.]+$/, ""), x: 130, y: 90, w, h: snap(h), src, visible: true };
    update({ ...template, elements: [...template.elements, el] });
    setSel(el.id);
  }

  function insertToken(tok: string) {
    if (!selected || selected.kind !== "text") return;
    const ta = textRef.current;
    const s = ta?.selectionStart ?? selected.text.length;
    const e = ta?.selectionEnd ?? s;
    const ins = `«${tok}»`;
    patch(selected.id, { text: selected.text.slice(0, s) + ins + selected.text.slice(e) });
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(s + ins.length, s + ins.length);
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${template.name || "תבנית"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  }

  async function importJson(f?: File) {
    if (!f) return;
    try {
      const t = JSON.parse(await f.text()) as Template;
      if (!Array.isArray(t.elements) || !t.background) throw new Error();
      update(t);
      setSel(null);
    } catch {
      alert("קובץ תבנית לא תקין");
    }
  }

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* ---- פאנל מאפיינים ---- */}
      <div className="order-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:order-1 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pb-2 scroll-thin">
        <Card className="min-w-0 p-4">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <MousePointer2 className="size-6" />
                </div>
                <p className="font-semibold">בחרו רכיב בתעודה</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  לחיצה על רכיב בוחרת אותו · גרירה מזיזה · הפינות משנות גודל
                  <br />
                  חיצים להזזה עדינה (Shift = מהיר) · Ctrl+Z לביטול
                </p>
              </motion.div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    {selected.kind === "text" ? <Type className="size-4" /> : selected.kind === "line" ? <Minus className="size-4" /> : <ImagePlus className="size-4" />}
                  </div>
                  <input
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 font-semibold outline-none hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500"
                    value={selected.label}
                    onChange={(e) => patch(selected.id, { label: e.target.value })}
                  />
                  <button title="שכפול" onClick={() => duplicate(selected)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                    <Copy className="size-4" />
                  </button>
                  <button
                    title={selected.visible ? "הסתרה" : "הצגה"}
                    onClick={() => patch(selected.id, { visible: !selected.visible })}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    {selected.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button title="מחיקה" onClick={() => remove(selected.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {selected.kind === "text" ? (
                  <>
                    <div>
                      <Label>תוכן (שדות מהאקסל בתוך «»)</Label>
                      <textarea
                        ref={textRef}
                        rows={2}
                        className={`${inputCls} h-auto py-2 leading-relaxed`}
                        value={selected.text}
                        onChange={(e) => patch(selected.id, { text: e.target.value })}
                      />
                      {insertables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {insertables.map((t) => (
                            <button
                              key={t}
                              onClick={() => insertToken(t)}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
                            >
                              <Braces className="size-3" /> {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_76px] gap-2">
                      <div>
                        <Label>גופן</Label>
                        <select className={inputCls} value={selected.font} onChange={(e) => patch(selected.id, { font: e.target.value })} style={{ fontFamily: selected.font }}>
                          {FONTS.map((f) => (
                            <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>גודל (pt)</Label>
                        <input type="number" step={0.5} min={4} max={200} className={inputCls} value={selected.size}
                          onChange={(e) => patch(selected.id, { size: Number(e.target.value) || 1 })} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Segmented
                        value={selected.align}
                        onChange={(v) => patch(selected.id, { align: v })}
                        options={[
                          { value: "right", label: <AlignRight className="size-4" /> },
                          { value: "center", label: <AlignCenter className="size-4" /> },
                          { value: "left", label: <AlignLeft className="size-4" /> },
                        ]}
                      />
                      <button
                        onClick={() => patch(selected.id, { bold: !selected.bold })}
                        className={`grid size-10 place-items-center rounded-xl ring-1 transition ${selected.bold ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200"}`}
                        title="מודגש"
                      >
                        <Bold className="size-4" />
                      </button>
                      <button
                        onClick={() => patch(selected.id, { underline: !selected.underline })}
                        className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm ring-1 transition ${selected.underline ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200"}`}
                        title="קו ארוך מתחת לערך"
                      >
                        <Minus className="size-4" /> קו תחתון
                      </button>
                      <label className="relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-xl ring-1 ring-slate-200" title="צבע">
                        <span className="size-5 rounded-full ring-2 ring-white shadow" style={{ background: selected.color }} />
                        <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={selected.color}
                          onChange={(e) => patch(selected.id, { color: e.target.value }, false)}
                          onFocus={p.checkpoint} />
                      </label>
                    </div>
                  </>
                ) : selected.kind === "line" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>עובי (מ״מ)</Label>
                      <input type="number" step={0.05} min={0.05} className={inputCls} value={selected.thickness}
                        onChange={(e) => patch(selected.id, { thickness: Number(e.target.value) || 0.1 })} />
                    </div>
                    <div>
                      <Label>צבע</Label>
                      <input type="color" className={`${inputCls} p-1`} value={selected.color}
                        onFocus={p.checkpoint} onChange={(e) => patch(selected.id, { color: e.target.value }, false)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => {
                      const rot = (((selected.rotation ?? 0) + 90) % 360);
                      patch(selected.id, { rotation: rot, w: selected.h, h: selected.w, x: snap(selected.x + (selected.w - selected.h) / 2), y: snap(selected.y + (selected.h - selected.w) / 2) });
                    }}>
                      <RotateCw className="size-4" /> סיבוב 90°
                    </Button>
                    <Button size="sm" onClick={() => replaceImg.current?.click()}>
                      <ImagePlus className="size-4" /> החלפה
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 [&>*]:min-w-0">
                  {(["x", "y", "w", "h"] as const).map((k) => (
                    <div key={k}>
                      <Label className="text-center">{{ x: "X", y: "Y", w: "רוחב", h: "גובה" }[k]}</Label>
                      <input type="number" step={0.5} className={`${inputCls} h-9 px-1 text-center`} value={selected[k]}
                        onChange={(e) => patch(selected.id, { [k]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
                <p className="-mt-1 text-[11px] text-slate-400">מידות במ״מ על דף A4 לרוחב (297×210)</p>
              </motion.div>
            )}
          </AnimatePresence>
          <input ref={replaceImg} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f && selected) patch(selected.id, { src: await readFileAsDataURL(f) });
          }} />
        </Card>

        <Card className="p-2">
          <div className="flex items-center gap-2 px-2 pb-1 pt-2 text-sm font-semibold text-slate-700">
            <Layers className="size-4" /> רכיבים ({template.elements.length})
          </div>
          <div className="scroll-thin max-h-72 overflow-auto">
            {template.elements.map((el) => (
              <div
                key={el.id}
                onClick={() => setSel(el.id)}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition ${sel === el.id ? "bg-brand-50 text-brand-800" : "hover:bg-slate-100/80"}`}
              >
                {el.kind === "text" ? <Type className="size-3.5 shrink-0 text-slate-400" /> : el.kind === "line" ? <Minus className="size-3.5 shrink-0 text-slate-400" /> : <ImagePlus className="size-3.5 shrink-0 text-slate-400" />}
                <span className={`flex-1 truncate ${el.visible ? "" : "text-slate-400 line-through"}`}>{el.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    patch(el.id, { visible: !el.visible });
                  }}
                  className="rounded p-1 text-slate-400 opacity-0 hover:text-slate-700 group-hover:opacity-100"
                >
                  {el.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ---- משטח העבודה ---- */}
      <div className="order-1 grid min-w-0 gap-4 xl:order-2">
        <Card className="flex min-w-0 flex-wrap items-center gap-1 p-2">
          <Button size="sm" variant="ghost" onClick={addText}><Type className="size-4" /> טקסט</Button>
          <Button size="sm" variant="ghost" onClick={addLine}><Minus className="size-4" /> קו</Button>
          <Button size="sm" variant="ghost" onClick={() => imgInput.current?.click()}><ImagePlus className="size-4" /> תמונה / חתימה</Button>
          <Button size="sm" variant="ghost" onClick={() => bgInput.current?.click()}><Wallpaper className="size-4" /> רקע</Button>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <Button size="sm" variant="ghost" onClick={p.undo} disabled={!p.canUndo} title="ביטול (Ctrl+Z)"><Undo2 className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={p.redo} disabled={!p.canRedo} title="חזרה (Ctrl+Y)"><Redo2 className="size-4" /></Button>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <Button size="sm" variant="ghost" onClick={exportJson} title="שמירת תבנית לקובץ"><FileDown className="size-4" /> שמירה</Button>
          <Button size="sm" variant="ghost" onClick={() => jsonInput.current?.click()} title="טעינת תבנית מקובץ"><FileUp className="size-4" /> טעינה</Button>
          <Button size="sm" variant="ghost" onClick={() => {
            if (confirm("לשחזר את התבנית המקורית? כל השינויים יימחקו.")) {
              update(defaultTemplate());
              setSel(null);
            }
          }}><RotateCcw className="size-4" /> איפוס</Button>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Segmented
              value={showData && rows.length ? "data" : "fields"}
              onChange={(v) => setShowData(v === "data")}
              options={[
                { value: "fields", label: "שמות שדות" },
                { value: "data", label: "נתונים" },
              ]}
            />
            <Button size="sm" variant={showBoxes ? "secondary" : "ghost"} onClick={() => setShowBoxes(!showBoxes)} title="הצגת מסגרות">
              <Layers className="size-4" />
            </Button>
          </div>
          <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={bgInput} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) update({ ...template, background: await readFileAsDataURL(f) });
          }} />
          <input ref={jsonInput} type="file" accept=".json,application/json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} />
        </Card>

        <Card className="min-w-0 p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-lg shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5">
            <CertCanvas template={template} row={row} mapping={mapping} showTokens={!row} />
            <div
              ref={overlay}
              className="absolute inset-0 touch-none"
              onPointerDown={() => setSel(null)}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {template.elements.map((el) => {
                const isSel = el.id === sel;
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => startDrag(e, el)}
                    className={`group absolute cursor-move rounded-[3px] transition-[box-shadow,background] ${
                      isSel
                        ? "z-20 bg-brand-500/10 ring-2 ring-brand-500"
                        : showBoxes
                          ? "outline outline-1 outline-dashed outline-brand-500/40 hover:bg-brand-500/5 hover:outline-brand-500/80"
                          : "hover:ring-1 hover:ring-brand-500/60"
                    } ${el.visible ? "" : "opacity-40"}`}
                    style={{ left: pct(el.x, PAGE_W), top: pct(el.y, PAGE_H), width: pct(el.w, PAGE_W), height: pct(el.h, PAGE_H) }}
                  >
                    {isSel && (
                      <>
                        <span className="pointer-events-none absolute bottom-full right-0 mb-1 whitespace-nowrap rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white shadow">
                          {el.label}
                        </span>
                        {(["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
                          <span
                            key={c}
                            onPointerDown={(e) => startDrag(e, el, c)}
                            className="absolute size-3 rounded-full border-2 border-brand-600 bg-white shadow"
                            style={{
                              top: c[0] === "n" ? -6 : undefined,
                              bottom: c[0] === "s" ? -6 : undefined,
                              left: c[1] === "w" ? -6 : undefined,
                              right: c[1] === "e" ? -6 : undefined,
                              cursor: c === "nw" || c === "se" ? "nwse-resize" : "nesw-resize",
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {rows.length > 0 && showData && (
            <div className="mt-3 flex items-center justify-center gap-3 text-sm text-slate-600">
              <Button size="sm" variant="ghost" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}><ChevronRight className="size-4" /></Button>
              <span>תלמיד/ה {Math.min(idx, rows.length - 1) + 1} מתוך {rows.length}</span>
              <Button size="sm" variant="ghost" disabled={idx >= rows.length - 1} onClick={() => setIdx(idx + 1)}><ChevronLeft className="size-4" /></Button>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button onClick={p.onBack}><ArrowRight className="size-4" /> חזרה</Button>
          <Button variant="primary" size="lg" onClick={p.onNext}>לייצוא PDF <ArrowLeft className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
