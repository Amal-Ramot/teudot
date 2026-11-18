import * as XLSX from "xlsx";
import type { Row } from "./template";

export interface Dataset {
  fileName: string;
  sheets: string[];
  sheet: string;
  columns: string[];
  rows: Row[];
  workbook: XLSX.WorkBook;
}

export async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array", cellDates: true });
}

export function sheetToDataset(wb: XLSX.WorkBook, sheet: string, fileName: string): Dataset {
  const ws = wb.Sheets[sheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });
  // שורת הכותרת = השורה הראשונה שיש בה לפחות שני תאים מלאים
  let hi = matrix.findIndex((r) => r.filter((c) => String(c).trim() !== "").length >= 2);
  if (hi < 0) hi = 0;
  const header = (matrix[hi] || []).map((c, i) => String(c).trim() || `עמודה ${i + 1}`);
  const seen = new Map<string, number>();
  const columns = header.map((h) => {
    const n = seen.get(h) || 0;
    seen.set(h, n + 1);
    return n ? `${h} (${n + 1})` : h;
  });
  const rows: Row[] = matrix
    .slice(hi + 1)
    .filter((r) => r.some((c) => String(c).trim() !== ""))
    .map((r) => {
      const o: Row = {};
      columns.forEach((c, i) => (o[c] = String(r[i] ?? "").trim()));
      return o;
    });
  return { fileName, sheets: wb.SheetNames, sheet, columns, rows, workbook: wb };
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
