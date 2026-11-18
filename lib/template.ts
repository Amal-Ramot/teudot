// מודל התבנית – כל המידות במילימטרים על דף A4 לרוחב (297x210)
export const PAGE_W = 297;
export const PAGE_H = 210;

export type Align = "right" | "center" | "left";

export interface TextElement {
  id: string;
  kind: "text";
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string; // שדות מיזוג נכתבים כ־«שם עמודה»
  align: Align;
  font: string;
  size: number; // בנקודות (pt)
  bold: boolean;
  color: string;
  visible: boolean;
  underline?: boolean; // קו ארוך בתחתית התיבה, לכל רוחבה
  pad?: number; // ריווח (מ"מ) מקצה התיבה לטקסט
}

export interface LineElement {
  id: string;
  kind: "line";
  label: string;
  x: number;
  y: number;
  w: number;
  h: number; // אזור אחיזה; הקו מצויר באמצע הגובה
  color: string;
  thickness: number; // מ"מ
  visible: boolean;
}

export interface ImageElement {
  id: string;
  kind: "image";
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  rotation?: number; // 0 / 90 / 180 / 270
  visible: boolean;
}

export type CertElement = TextElement | ImageElement | LineElement;

export interface Template {
  name: string;
  background: string;
  elements: CertElement[];
}

export const FONTS: { family: string; label: string }[] = [
  { family: "Heebo", label: "Heebo (דומה ל־Arial)" },
  { family: "Assistant", label: "Assistant" },
  { family: "Rubik", label: "Rubik" },
  { family: "Alef", label: "Alef" },
  { family: "Frank Ruhl Libre", label: "Frank Ruhl (סריף)" },
  { family: "David Libre", label: "David Libre" },
  { family: "Secular One", label: "Secular One" },
  { family: "Suez One", label: "Suez One" },
];

export const asset = (p: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${p}`;

// מיקומים שנמדדו מהתבנית המקורית (Publisher) – במ"מ.
// x0/x1 = גבולות התא, cy = מרכז הטקסט, h = גובה התיבה (הקו התחתון נמצא בתחתית התיבה)
type Cell = [label: string, text: string, x0: number, x1: number, cy: number, h: number, align: Align, underline?: boolean, pad?: number];

const ROW_NAME = 61.9, ROW_ID = 74.7, ROW_YEAR = 87.3, ROW_CLASS = 102.9, ROW_DATE = 119.1;
const H = 5.6, H_CLASS = 11.6, H_DATE = 6;

const CELLS: Cell[] = [
  ["תווית – התלמיד/ה", "התלמיד/ה :", 231, 259, ROW_NAME, H, "right"],
  ["שם התלמיד/ה", "«שם משפחה» «שם פרטי»", 36.1, 231, ROW_NAME, H, "right", true, 5.6],
  ["תווית – ת\"ז", "תעודת זהות מס' :", 215.2, 259, ROW_ID, H, "right"],
  ["תעודת זהות", "«ת\"ז»", 36.1, 215.2, ROW_ID, H, "right", true],
  ["תווית – שנה\"ל", "סיים/ה בשנה\"ל:", 218.4, 259, ROW_YEAR, H, "right"],
  ["שנת לימודים", "תשפ\"ג", 82.5, 218.4, ROW_YEAR, H, "center", true],
  ["את לימודיו", "את לימודיו בבית ספרנו", 36.1, 82.5, ROW_YEAR, H, "right"],
  ["תווית – כתה", "בכתה:", 240.5, 259, ROW_CLASS, H_CLASS, "right"],
  ["כיתה ומקבילה", "«כיתה» «מקבילה»", 204.5, 240.5, ROW_CLASS, H_CLASS, "right", true],
  ["תווית – מגמה", "במגמה:", 184.4, 204.5, ROW_CLASS, H_CLASS, "right"],
  ["מגמה", "«מגמה»", 36.1, 184.4, ROW_CLASS, H_CLASS, "right", true],
  ["תווית – ביום", "ביום :", 191.3, 212.1, ROW_DATE, H_DATE, "left"],
  ["יום", "א'", 167.4, 191.3, ROW_DATE, H_DATE, "center", true],
  ["תווית – חודש", "חודש :", 146.6, 167.4, ROW_DATE, H_DATE, "left"],
  ["חודש", "תמוז", 125.8, 146.6, ROW_DATE, H_DATE, "center", true],
  ["תווית – שנת", "שנת :", 103.6, 125.8, ROW_DATE, H_DATE, "left"],
  ["שנה", "תשפ\"ג", 79.3, 103.6, ROW_DATE, H_DATE, "right", true],
  ["שם המנהל/ת", "בילו מטי", 111.9, 181.2, 144.3, H, "center"],
  ["תפקיד – מנהל/ת", "מנהל/ת בית הספר", 111.9, 181.2, 150.9, H, "center"],
  ["שם המחנך/ת", "«מחנך»", 181.2, 259, 157.1, H, "center"],
  ["תפקיד – מחנך/ת", "מחנך/ת הכתה", 181.2, 259, 163.5, H, "center"],
  ["שם מנהל/ת חט\"ע", "שפורן חן", 36.1, 111.9, 157.1, H, "center"],
  ["תפקיד – מנהל/ת חט\"ע", "מנהל/ת חט\"ע", 36.1, 111.9, 163.5, H, "center"],
];

// קווי חתימה (מעל שמות החותמים)
const LINES: [label: string, x0: number, x1: number, y: number][] = [
  ["קו חתימה – מנהל/ת", 111.9, 181.2, 140.9],
  ["קו חתימה – מנהל/ת חט\"ע", 36.1, 111.9, 153.7],
  ["קו חתימה – מחנך/ת", 181.2, 259, 153.7],
];

const r1 = (n: number) => Math.round(n * 10) / 10;

export function defaultTemplate(): Template {
  const texts: TextElement[] = CELLS.map(([label, text, x0, x1, cy, h, align, underline, pad], i) => ({
    id: `t${i + 1}`,
    kind: "text",
    label,
    x: r1(x0),
    y: r1(cy - h / 2),
    w: r1(x1 - x0),
    h,
    text,
    align,
    font: "Heebo",
    size: 14,
    bold: false,
    color: "#000000",
    visible: true,
    underline: !!underline,
    pad: pad ?? 2,
  }));
  const lines: LineElement[] = LINES.map(([label, x0, x1, y], i) => ({
    id: `l${i + 1}`,
    kind: "line",
    label,
    x: x0,
    y: y - 1,
    w: r1(x1 - x0),
    h: 2,
    color: "#000000",
    thickness: 0.35,
    visible: true,
  }));
  const images: ImageElement[] = [
    {
      id: "sig1",
      kind: "image",
      label: "חתימת המנהל/ת",
      x: 130.4,
      y: 123.3,
      w: 29.7,
      h: 21.5,
      src: asset("/template/signature-principal.png"),
      visible: true,
    },
    {
      id: "sig2",
      kind: "image",
      label: "חתימת מנהל/ת חט\"ע",
      x: 73.4,
      y: 126.5,
      w: 12.4,
      h: 20.5,
      src: asset("/template/signature-2.png"),
      visible: true,
    },
  ];
  return {
    name: "תעודת סיום – הרב תחומי",
    background: asset("/template/background.jpg"),
    elements: [...lines, ...images, ...texts],
  };
}

// --- שדות מיזוג ---
const TOKEN_RE = /«([^«»]+)»/g;

export function extractTokens(t: Template): string[] {
  const out: string[] = [];
  for (const el of t.elements) {
    if (el.kind !== "text" || !el.visible) continue;
    for (const m of el.text.matchAll(TOKEN_RE)) {
      const k = m[1].trim();
      if (!out.includes(k)) out.push(k);
    }
  }
  return out;
}

export type Mapping = Record<string, string>; // token → שם עמודה ("" = ריק, FIXED+טקסט = ערך קבוע)
export const FIXED = "__fixed:";
export type Row = Record<string, string>;

export function fillText(text: string, row: Row | null, mapping: Mapping): string {
  return text
    .replace(TOKEN_RE, (_, raw: string) => {
      const k = raw.trim();
      if (!row) return `«${k}»`;
      const col = mapping[k];
      if (!col) return "";
      if (col.startsWith(FIXED)) return col.slice(FIXED.length);
      return String(row[col] ?? "").trim();
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

// התאמה אוטומטית של עמודות לשדות לפי דמיון בשם
const norm = (s: string) =>
  s.replace(/[\s"'״׳#.\-_:/\\()]/g, "").replace(/ה$/, "").toLowerCase();

const SYNONYMS: Record<string, string[]> = {
  'ת"ז': ["תז", "תעודתזהות", "מספרזהות", "זהות", "id", "מסזהות"],
  "שם פרטי": ["פרטי", "שם", "firstname"],
  "שם משפחה": ["משפחה", "lastname", "surname"],
  כיתה: ["כתה", "שכבה", "class", "grade"],
  מקבילה: ["מקבילה", "מספרכיתה", "כיתהמקבילה"],
  מגמה: ["מגמ", "מגמות", "מסלול", "major"],
  מחנך: ["מחנכת", "מחנכ", "מורה", "מחנךת", "teacher"],
};

export function autoMatch(tokens: string[], columns: string[], prev: Mapping = {}): Mapping {
  const res: Mapping = {};
  const used = new Set<string>();
  for (const tok of tokens) {
    if (prev[tok] && (columns.includes(prev[tok]) || prev[tok].startsWith(FIXED))) {
      res[tok] = prev[tok];
      used.add(prev[tok]);
      continue;
    }
    const nt = norm(tok);
    const syn = (SYNONYMS[tok] || []).map(norm);
    let best = "";
    let score = 0;
    for (const c of columns) {
      if (used.has(c)) continue;
      const nc = norm(c);
      let s = 0;
      if (nc === nt) s = 100;
      else if (syn.includes(nc)) s = 80;
      else if (nc.includes(nt) || nt.includes(nc)) s = nc.length > 1 ? 60 : 0;
      else if (syn.some((x) => x.length > 2 && (nc.includes(x) || x.includes(nc)))) s = 40;
      if (s > score) {
        score = s;
        best = c;
      }
    }
    res[tok] = best;
    if (best) used.add(best);
  }
  return res;
}
