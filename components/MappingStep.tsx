"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Sparkles, Wand2 } from "lucide-react";
import { Button, Card, Badge, inputCls } from "./ui";
import CertCanvas from "./CertCanvas";
import type { Dataset } from "@/lib/data";
import { FIXED, Mapping, Template, autoMatch, extractTokens } from "@/lib/template";

export default function MappingStep({
  template,
  data,
  mapping,
  setMapping,
  onBack,
  onNext,
}: {
  template: Template;
  data: Dataset | null;
  mapping: Mapping;
  setMapping: (m: Mapping) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const tokens = useMemo(() => extractTokens(template), [template]);
  const [idx, setIdx] = useState(0);
  const columns = data?.columns ?? [];
  const rows = data?.rows ?? [];
  const row = rows[Math.min(idx, rows.length - 1)] ?? null;
  const matched = tokens.filter((t) => mapping[t]).length;

  if (!data) {
    return (
      <Card className="p-10 text-center">
        <p className="text-lg font-semibold">עדיין לא נטען קובץ נתונים</p>
        <p className="mt-1 text-sm text-slate-500">כדי להתאים עמודות יש להעלות קודם קובץ אקסל</p>
        <Button className="mt-6" variant="primary" onClick={onBack}>
          <ArrowRight className="size-4" /> חזרה להעלאה
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">שדות בתבנית</h2>
            <p className="text-xs text-slate-500">בחרו לכל שדה את העמודה המתאימה מהאקסל</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setMapping(autoMatch(tokens, columns))} title="התאמה אוטומטית">
            <Wand2 className="size-4" /> אוטומטי
          </Button>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-emerald-500"
            animate={{ width: `${tokens.length ? (matched / tokens.length) * 100 : 0}%` }}
          />
        </div>

        <div className="grid gap-3">
          {tokens.map((tok) => {
            const v = mapping[tok] ?? "";
            const isFixed = v.startsWith(FIXED);
            const sample = isFixed ? v.slice(FIXED.length) : v && row ? row[v] : "";
            return (
              <motion.div
                layout
                key={tok}
                className={`rounded-2xl p-3 ring-1 transition ${v ? "bg-white ring-emerald-200" : "bg-amber-50/50 ring-amber-200"}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {v ? <CheckCircle2 className="size-4 text-emerald-500" /> : <CircleDashed className="size-4 text-amber-500" />}
                  <span className="font-semibold text-slate-800">«{tok}»</span>
                  {sample ? (
                    <span className="mr-auto max-w-40 truncate rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{sample}</span>
                  ) : null}
                </div>
                <select
                  className={inputCls}
                  value={isFixed ? "__fixed" : v}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapping({ ...mapping, [tok]: val === "__fixed" ? FIXED : val });
                  }}
                >
                  <option value="">— השאר ריק —</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__fixed">✎ טקסט קבוע לכל התעודות…</option>
                </select>
                {isFixed && (
                  <input
                    autoFocus
                    className={`${inputCls} mt-2`}
                    placeholder="הקלידו ערך קבוע"
                    value={v.slice(FIXED.length)}
                    onChange={(e) => setMapping({ ...mapping, [tok]: FIXED + e.target.value })}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50/70 p-3 text-xs leading-relaxed text-brand-800">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          רוצים שדה נוסף? בשלב העיצוב כתבו בכל תיבת טקסט שם בין «סוגריים» – והוא יופיע כאן להתאמה.
        </p>
      </Card>

      <div className="grid gap-4 lg:sticky lg:top-24">
        <Card className="p-3 sm:p-4">
          <CertCanvas template={template} row={row} mapping={mapping} className="overflow-hidden rounded-xl shadow-2xl shadow-slate-900/10" />
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button size="sm" variant="ghost" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}>
              <ChevronRight className="size-4" /> הקודם
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>תלמיד/ה</span>
              <input
                type="number"
                min={1}
                max={rows.length}
                value={idx + 1}
                onChange={(e) => setIdx(Math.max(0, Math.min(rows.length - 1, Number(e.target.value) - 1)))}
                className={`${inputCls} h-8 w-16 text-center`}
              />
              <span>מתוך {rows.length}</span>
            </div>
            <Button size="sm" variant="ghost" disabled={idx >= rows.length - 1} onClick={() => setIdx(idx + 1)}>
              הבא <ChevronLeft className="size-4" />
            </Button>
          </div>
        </Card>
        <div className="flex items-center justify-between">
          <Badge tone={matched === tokens.length ? "green" : "amber"}>
            {matched}/{tokens.length} שדות הותאמו
          </Badge>
          <div className="flex gap-2">
            <Button onClick={onBack}>
              <ArrowRight className="size-4" /> חזרה
            </Button>
            <Button variant="primary" size="lg" onClick={onNext}>
              לעיצוב ומיקום <ArrowLeft className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
