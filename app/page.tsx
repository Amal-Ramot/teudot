"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, Check, FileSpreadsheet, Link2, Palette, FileDown } from "lucide-react";
import UploadStep from "@/components/UploadStep";
import MappingStep from "@/components/MappingStep";
import DesignStep from "@/components/DesignStep";
import ExportStep from "@/components/ExportStep";
import type { Dataset } from "@/lib/data";
import { Mapping, Template, autoMatch, defaultTemplate, extractTokens } from "@/lib/template";

const STEPS = [
  { title: "העלאת נתונים", sub: "קובץ אקסל", icon: FileSpreadsheet },
  { title: "התאמת עמודות", sub: "שדות ↔ עמודות", icon: Link2 },
  { title: "עיצוב ומיקום", sub: "עורך חזותי", icon: Palette },
  { title: "ייצוא", sub: "PDF", icon: FileDown },
];

const LS_TEMPLATE = "teudot.template.v1";
const LS_MAPPING = "teudot.mapping.v1";

export default function Home() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Dataset | null>(null);
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [mapping, setMapping] = useState<Mapping>({});
  const past = useRef<Template[]>([]);
  const future = useRef<Template[]>([]);
  const [, force] = useState(0);
  const loaded = useRef(false);

  // שחזור מהדפדפן
  useEffect(() => {
    try {
      const t = localStorage.getItem(LS_TEMPLATE);
      if (t) setTemplate(JSON.parse(t));
      const m = localStorage.getItem(LS_MAPPING);
      if (m) setMapping(JSON.parse(m));
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    const h = setTimeout(() => {
      try {
        localStorage.setItem(LS_TEMPLATE, JSON.stringify(template));
      } catch {}
    }, 400);
    return () => clearTimeout(h);
  }, [template]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(LS_MAPPING, JSON.stringify(mapping));
    } catch {}
  }, [mapping]);

  // התאמה אוטומטית בעת טעינת נתונים או הוספת שדות
  useEffect(() => {
    if (!data) return;
    const tokens = extractTokens(template);
    setMapping((prev) => {
      const missing = tokens.some((t) => !(t in prev));
      const stale = tokens.some((t) => prev[t] && !prev[t].startsWith("__fixed:") && !data.columns.includes(prev[t]));
      return missing || stale ? { ...prev, ...autoMatch(tokens, data.columns, prev) } : prev;
    });
  }, [data, template]);

  const cur = useRef(template);
  cur.current = template;

  const update = useCallback((t: Template, record = true) => {
    if (record) {
      past.current.push(cur.current);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
    }
    cur.current = t;
    setTemplate(t);
  }, []);

  const checkpoint = useCallback(() => {
    past.current.push(cur.current);
    future.current = [];
    force((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(cur.current);
    cur.current = prev;
    setTemplate(prev);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(cur.current);
    cur.current = next;
    setTemplate(next);
  }, []);

  const go = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
              <Award className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900">מחולל תעודות</p>
              <p className="text-xs text-slate-500">מאקסל ל־PDF בכמה קליקים</p>
            </div>
          </div>

          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={i} className="flex items-center">
                  <button
                    onClick={() => go(i)}
                    className={`relative flex items-center gap-2.5 rounded-2xl px-3 py-2 text-right transition ${active ? "" : "hover:bg-slate-900/5"}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="step-pill"
                        className="absolute inset-0 rounded-2xl bg-white shadow-md ring-1 ring-slate-900/5"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span
                      className={`relative grid size-8 place-items-center rounded-xl text-sm transition ${
                        active
                          ? "bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-600/30"
                          : done
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {done ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
                    </span>
                    <span className="relative hidden lg:block">
                      <span className={`block text-sm font-semibold ${active ? "text-slate-900" : "text-slate-500"}`}>{s.title}</span>
                      <span className="block text-[11px] text-slate-400">{s.sub}</span>
                    </span>
                  </button>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-slate-200" />}
                </div>
              );
            })}
          </nav>

          <div className="ms-auto text-xs text-slate-500 md:ms-0">
            {data ? `${data.rows.length} תלמידים` : "לא נטען קובץ"}
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2 md:hidden">
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => go(i)} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-slate-200"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6">
              <p className="text-sm font-medium text-brand-600">שלב {step + 1} מתוך 4</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{STEPS[step].title}</h1>
            </div>
            {step === 0 && <UploadStep data={data} setData={setData} onNext={() => go(1)} />}
            {step === 1 && (
              <MappingStep template={template} data={data} mapping={mapping} setMapping={setMapping} onBack={() => go(0)} onNext={() => go(2)} />
            )}
            {step === 2 && (
              <DesignStep
                template={template}
                update={update}
                checkpoint={checkpoint}
                undo={undo}
                redo={redo}
                canUndo={past.current.length > 0}
                canRedo={future.current.length > 0}
                data={data}
                mapping={mapping}
                onBack={() => go(1)}
                onNext={() => go(3)}
              />
            )}
            {step === 3 && <ExportStep template={template} data={data} mapping={mapping} onBack={() => go(2)} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
