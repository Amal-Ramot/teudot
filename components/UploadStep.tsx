"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { FileSpreadsheet, UploadCloud, Download, Layers, X, ArrowLeft, Check, Merge } from "lucide-react";
import { Button, Card, Badge } from "./ui";
import { Dataset, buildDataset, downloadSampleExcel, readWorkbook } from "@/lib/data";

export default function UploadStep({
  data,
  setData,
  onNext,
}: {
  data: Dataset | null;
  setData: (d: Dataset | null) => void;
  onNext: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const wb = await readWorkbook(file);
      const ds = buildDataset(wb, file.name);
      if (!ds.rows.length) throw new Error("לא נמצאו שורות נתונים בגיליון");
      setData(ds);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה בקריאת הקובץ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="p-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handle(e.dataTransfer.files[0]);
          }}
          onClick={() => input.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-[1.25rem] border-2 border-dashed px-6 py-14 text-center transition-all ${
            drag ? "border-brand-500 bg-brand-50/70" : "border-slate-200 hover:border-brand-300 hover:bg-white/60"
          }`}
        >
          <motion.div
            animate={{ y: drag ? -6 : 0, scale: drag ? 1.08 : 1 }}
            className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-xl shadow-brand-600/30"
          >
            {busy ? (
              <div className="size-8 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
            ) : (
              <UploadCloud className="size-9" strokeWidth={1.8} />
            )}
          </motion.div>
          <div>
            <p className="text-xl font-semibold text-slate-900">גררו לכאן את קובץ האקסל</p>
            <p className="mt-1 text-sm text-slate-500">או לחצו לבחירת קובץ · ‎.xlsx ‎.xls ‎.csv</p>
          </div>
          <input
            ref={input}
            type="file"
            hidden
            accept=".xlsx,.xls,.xlsm,.csv,.ods"
            onChange={(e) => {
              handle(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-slate-400">הקובץ מעובד בדפדפן בלבד ואינו נשלח לשום שרת</p>
        </div>
      </Card>

      {err && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{err}</p>}

      {!data && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
          <span>אין לכם קובץ מוכן?</span>
          <Button size="sm" onClick={downloadSampleExcel}>
            <Download className="size-4" /> הורדת קובץ דוגמה
          </Button>
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/70 px-5 py-4">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                <FileSpreadsheet className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{data.fileName}</p>
                <p className="text-xs text-slate-500">
                  {data.rows.length} תלמידים · {data.columns.length} עמודות
                  {data.sheets.length > 1 && ` · ${data.selected.length}/${data.sheets.length} גיליונות`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setData(null)}>
                <X className="size-4" /> הסרה
              </Button>
            </div>
            {data.sheets.length > 1 && (
              <div className="border-b border-slate-200/70 bg-slate-50/50 px-5 py-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Layers className="size-3.5" /> נמצאו {data.sheets.length} גיליונות – הנתונים מכל הגיליונות המסומנים מאוחדים לרשימה אחת
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.sheets.map((sh) => {
                    const on = data.selected.includes(sh.name);
                    return (
                      <button
                        key={sh.name}
                        title={sh.columns.join(" · ")}
                        onClick={() => {
                          const next = on ? data.selected.filter((n) => n !== sh.name) : [...data.selected, sh.name];
                          if (!next.length) return;
                          const order = data.sheets.map((x) => x.name).filter((n) => next.includes(n));
                          setData(buildDataset(data.workbook, data.fileName, order));
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ring-1 transition ${
                          on ? "bg-white font-medium text-slate-800 ring-brand-300 shadow-sm" : "bg-transparent text-slate-400 ring-slate-200 line-through"
                        }`}
                      >
                        <span className={`grid size-4 place-items-center rounded ${on ? "bg-brand-600 text-white" : "ring-1 ring-slate-300"}`}>
                          {on && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        {sh.name}
                        <span className="rounded-md bg-slate-100 px-1.5 text-xs text-slate-500">{sh.rows}</span>
                      </button>
                    );
                  })}
                </div>
                {data.merged > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                    <Merge className="size-3.5" /> {data.merged} שורות של תלמידים שמופיעים בכמה גיליונות אוחדו לפי ת״ז
                  </p>
                )}
              </div>
            )}
            <div className="scroll-thin max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="px-4 py-2.5 text-right font-medium text-slate-400">#</th>
                    {data.columns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-slate-700">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-brand-50/40">
                      <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                      {data.columns.map((c) => (
                        <td key={c} className="whitespace-nowrap px-4 py-2 text-slate-700">
                          {r[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.rows.length > 100 && (
              <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-400">
                מוצגות 100 שורות ראשונות מתוך {data.rows.length}
              </p>
            )}
          </Card>
          <div className="mt-6 flex items-center justify-between">
            <Badge tone="green">✓ הקובץ נטען בהצלחה</Badge>
            <Button variant="primary" size="lg" onClick={onNext}>
              המשך להתאמת עמודות <ArrowLeft className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
