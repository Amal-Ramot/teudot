import * as XLSX from "xlsx";
import type { Row } from "./template";

export interface SheetInfo {
  name: string;
  columns: string[];
  rows: number;
}

export interface Dataset {
  fileName: string;
  sheets: SheetInfo[]; // כל הגיליונות שיש בהם נתונים
  selected: string[]; // הגיליונות שנכללים
  columns: string[];
  rows: Row[];
  merged: number; // כמה שורות אוחדו לפי ת"ז מגיליונות שונים
  workbook: XLSX.WorkBook;
}

export const SHEET_COL = "גיליון";

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array", cellDates: true });
}

const normHeader = (s: string) => s.replace(/[\s"'״׳#.\-_:/\\()]/g, "").replace(/כתה/g, "כיתה").toLowerCase();

const ID_KEYS = ["תז", "תעודתזהות", "מספרזהות", "מסזהות", "זהות", "id"];
const isIdCol = (c: string) => ID_KEYS.includes(normHeader(c));
const normId = (v: string) => v.replace(/\D/g, "").replace(/^0+/, "");

function readSheet(ws: XLSX.WorkSheet): { columns: string[]; rows: Row[] } {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "", blankrows: false });
  // שורת הכותרת = השורה הראשונה שיש בה לפחות שני תאים מלאים
  let hi = matrix.findIndex((r) => r.filter((c) => String(c).trim() !== "").length >= 2);
  if (hi < 0) return { columns: [], rows: [] };
  const header = (matrix[hi] || []).map((c, i) => String(c).trim() || `עמודה ${i + 1}`);
  const seen = new Map<string, number>();
  const columns = header.map((h) => {
    const n = seen.get(h) || 0;
    seen.set(h, n + 1);
    return n ? `${h} (${n + 1})` : h;
  });
  const rows = matrix
    .slice(hi + 1)
    .filter((r) => r.some((c) => String(c).trim() !== ""))
    .map((r) => {
      const o: Row = {};
      columns.forEach((c, i) => {
        if (!/^עמודה \d+$/.test(c) || String(r[i] ?? "").trim()) o[c] = String(r[i] ?? "").trim();
      });
      return o;
    });
  return { columns: columns.filter((c) => !/^עמודה \d+$/.test(c) || rows.some((r) => r[c])), rows };
}

export function sheetInfos(wb: XLSX.WorkBook): SheetInfo[] {
  return wb.SheetNames.map((name) => {
    const { columns, rows } = readSheet(wb.Sheets[name]);
    return { name, columns, rows: rows.length };
  }).filter((s) => s.rows > 0);
}

/** מאחד את הגיליונות שנבחרו: עמודות זהות מאוחדות, תלמיד שמופיע בכמה גיליונות (לפי ת"ז) מתמזג לשורה אחת */
export function buildDataset(wb: XLSX.WorkBook, fileName: string, selected?: string[]): Dataset {
  const sheets = sheetInfos(wb);
  const sel = (selected ?? sheets.map((s) => s.name)).filter((n) => sheets.some((s) => s.name === n));
  const canon = new Map<string, string>(); // שם מנורמל → שם העמודה הראשון שנמצא
  const columns: string[] = [];
  const rows: Row[] = [];
  const byId = new Map<string, Row>();
  let merged = 0;

  for (const name of sel) {
    const { columns: cols, rows: srows } = readSheet(wb.Sheets[name]);
    const rename = new Map<string, string>();
    for (const c of cols) {
      const k = isIdCol(c) ? "__id" : normHeader(c) || c;
      if (!canon.has(k)) {
        canon.set(k, c);
        columns.push(c);
      }
      rename.set(c, canon.get(k)!);
    }
    const idCol = cols.find(isIdCol);
    for (const r of srows) {
      const row: Row = {};
      for (const [c, v] of Object.entries(r)) row[rename.get(c)!] = v;
      const id = idCol ? normId(r[idCol] || "") : "";
      const existing = id ? byId.get(id) : undefined;
      if (existing) {
        // אותו תלמיד בגיליון אחר – משלימים עמודות חסרות
        for (const [c, v] of Object.entries(row)) if (v && !existing[c]) existing[c] = v;
        if (!existing[SHEET_COL].split(", ").includes(name)) existing[SHEET_COL] += `, ${name}`;
        merged++;
        continue;
      }
      row[SHEET_COL] = name;
      rows.push(row);
      if (id) byId.set(id, row);
    }
  }
  if (sel.length > 1 && !columns.includes(SHEET_COL)) columns.push(SHEET_COL);
  return { fileName, sheets, selected: sel, columns, rows, merged, workbook: wb };
}

export function downloadSampleExcel() {
  const rows = [
    { "שם פרטי": "נועה", "שם משפחה": "כהן", 'ת"ז': "123456782", כיתה: "יב", מקבילה: "3", מגמה: "ביולוגיה", מחנך: "דנה לוי" },
    { "שם פרטי": "איתי", "שם משפחה": "אברהם", 'ת"ז': "234567891", כיתה: "יב", מקבילה: "3", מגמה: "מדעי המחשב", מחנך: "דנה לוי" },
    { "שם פרטי": "שירה", "שם משפחה": "פרץ", 'ת"ז': "345678917", כיתה: "יב", מקבילה: "5", מגמה: "תקשורת", מחנך: "יוסי מזרחי" },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 16 }));
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ws, "תלמידים");
  XLSX.writeFile(wb, "דוגמה-נתוני-תלמידים.xlsx");
}
