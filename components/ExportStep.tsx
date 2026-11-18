"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, FileArchive, FileText, Loader2, Search, Sparkles, X } from "lucide-react";
import { Button, Card, Label, Segmented, inputCls } from "./ui";
import CertCanvas from "./CertCanvas";
import type { Dataset } from "@/lib/data";
import { Mapping, Template, fillText, extractTokens } from "@/lib/template";
import { Quality, exportCertificates } from "@/lib/export";

export default function ExportStep({
  template,
  data,
  mapping,
  onBack,
}: {
  template: Template;
  data: Dataset | null;
  mapping: Mapping;
  onBack: () => void;
}) {
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const [mode, setMode] = useState<"single" | "zip">("single");
  const [quality, setQuality] = useState<Quality>("high");
  const tokens = useMemo(() => extractTokens(template), [template]);
  const [pattern, setPattern] = useState(() => {
    const f = ["שם פרטי", "שם משפחה"].filter((t) => tokens.includes(t));
    return f.length ? f.map((t) => `«${t}»`).join(" ") : tokens[0] ? `«${tokens[0]}»` : "תעודה";
  });
  const [q, setQ] = useState("");
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [err, setErr] = useState("");
  const abort = useRef<AbortController | null>(null);

  const nameOf = (i: number) => fillText(pattern, rows[i], mapping) || `שורה ${i + 1}`;
  const list = rows
    .map((_, i) => i)
    .filter((i) => !q || Object.values(rows[i]).some((v) => v.includes(q)));
  const chosen = rows.map((_, i) => i).filter((i) => !excluded.has(i));

  async function run() {
    setErr("");
    setFinished(false);
    abort.current = new AbortController();
    setProgress({ done: 0, total: chosen.length });
    try {
      await exportCertificates(template, chosen.map((i) => rows[i]), mapping, {
        mode,
        quality,
        fileNamePattern: pattern,
        signal: abort.current.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setFinished(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message || "הייצוא נכשל");
    } finally {
      setProgress(null);
    }
  }

  if (!data) {
    return (
      <Card className="p-10 text-center">
        <p className="text-lg font-semibold">אין נתונים לייצוא</p>
        <p className="mt-1 text-sm text-slate-500">העלו קובץ אקסל כדי להפיק תעודות</p>
      </Card>
    );
  }

  const pctDone = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/70 p-4">
          <h2 className="text-lg font-semibold">בחירת תלמידים</h2>
          <span className="text-sm text-slate-500">
            {chosen.length} מתוך {rows.length} נבחרו
          </span>
          <div className="relative ms-auto w-56">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} h-9 pr-9`} placeholder="חיפוש…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setExcluded(excluded.size ? new Set() : new Set(rows.map((_, i) => i)))}>
            {excluded.size ? "בחירת הכל" : "ניקוי בחירה"}
          </Button>
        </div>
        <div className="scroll-thin grid max-h-[640px] gap-3 overflow-auto p-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.slice(0, 60).map((i) => {
            const on = !excluded.has(i);
            return (
              <button
                key={i}
                onClick={() => {
                  const n = new Set(excluded);
                  if (on) n.add(i);
                  else n.delete(i);
                  setExcluded(n);
                }}
                className={`group relative overflow-hidden rounded-2xl bg-white p-2 text-right ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${on ? "ring-brand-300" : "opacity-50 ring-slate-200"}`}
              >
                <CertCanvas template={template} row={rows[i]} mapping={mapping} className="overflow-hidden rounded-lg" />
                <div className="mt-2 flex items-center gap-2 px-1">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-md ${on ? "bg-brand-600 text-white" : "ring-1 ring-slate-300"}`}>
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="truncate text-sm font-medium">{nameOf(i)}</span>
                </div>
              </button>
            );
          })}
        </div>
        {list.length > 60 && (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            מוצגות 60 תצוגות מקדימות מתוך {list.length} · כל המסומנים ייוצאו
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:sticky lg:top-24">
        <Card className="grid gap-5 p-5">
          <div>
            <Label>סוג ייצוא</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["single", FileText, "PDF אחד", "כל התעודות בקובץ אחד"],
                ["zip", FileArchive, "PDF לכל תלמיד", "קובץ ZIP עם קבצים נפרדים"],
              ] as const).map(([v, Icon, t, d]) => (
                <button
                  key={v}
                  onClick={() => setMode(v)}
                  className={`rounded-2xl p-3 text-right ring-1 transition ${mode === v ? "bg-brand-50 ring-2 ring-brand-500" : "bg-white ring-slate-200 hover:ring-slate-300"}`}
                >
                  <Icon className={`mb-2 size-5 ${mode === v ? "text-brand-600" : "text-slate-400"}`} />
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-xs text-slate-500">{d}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>איכות</Label>
            <Segmented
              value={quality}
              onChange={setQuality}
              options={[
                { value: "standard", label: "רגילה" },
                { value: "high", label: "גבוהה" },
                { value: "print", label: "דפוס 300dpi" },
              ]}
            />
          </div>
          <AnimatePresence>
            {mode === "zip" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Label>שם הקובץ לכל תלמיד</Label>
                <input className={inputCls} value={pattern} onChange={(e) => setPattern(e.target.value)} />
                <p className="mt-1 truncate text-xs text-slate-500">לדוגמה: {rows[0] ? nameOf(0) : ""}.pdf</p>
              </motion.div>
            )}
          </AnimatePresence>

          {progress ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 className="size-4 animate-spin text-brand-600" /> מפיק תעודות…
                </span>
                <span className="tabular-nums text-slate-500">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div className="h-full rounded-full bg-gradient-to-l from-brand-500 to-indigo-500" animate={{ width: `${pctDone}%` }} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => abort.current?.abort()}>
                <X className="size-4" /> ביטול
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="lg" className="w-full" disabled={!chosen.length} onClick={run}>
              <Sparkles className="size-4" /> הפקת {chosen.length} תעודות ל־PDF
            </Button>
          )}

          <AnimatePresence>
            {finished && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200"
              >
                <Check className="size-4" /> הקובץ הורד בהצלחה!
              </motion.p>
            )}
          </AnimatePresence>
          {err && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
        </Card>
        <Button onClick={onBack} className="justify-self-start">
          <ArrowRight className="size-4" /> חזרה לעיצוב
        </Button>
      </div>
    </div>
  );
}
