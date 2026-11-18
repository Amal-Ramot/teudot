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
  visible: boolean;
}

export type CertElement = TextElement | ImageElement;

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

// מיקומים שחושבו מטבלת התבנית המקורית (Publisher) – הטבלה מימין לשמאל.
// ס"מ → מ"מ. גובה שורה של תוכן: 6 מ"מ, החל מ־1 מ"מ מתחת לראש התא.
type Cell = [label: string, text: string, x0cm: number, x1cm: number, rowTopCm: number, align: Align];

const CELLS: Cell[] = [
  ["תווית – התלמיד/ה", "התלמיד/ה :", 23.1, 25.9, 5.86, "right"],
  ["שם התלמיד/ה", "«שם משפחה» «שם פרטי»", 3.61, 23.1, 5.86, "right"],
  ["תווית – ת\"ז", "תעודת זהות מס' :", 21.52, 25.9, 8.05, "right"],
  ["תעודת זהות", "«ת\"ז»", 3.61, 21.52, 8.05, "right"],
  ["תווית – שנה\"ל", "סיים/ה בשנה\"ל:", 21.84, 25.9, 9.64, "right"],
  ["שנת לימודים", "תשפ\"ג", 8.25, 21.84, 9.64, "center"],
  ["את לימודיו", "את לימודיו בבית ספרנו", 3.61, 8.25, 9.64, "right"],
  ["תווית – כתה", "בכתה:", 24.05, 25.9, 11.84, "right"],
  ["כיתה ומקבילה", "«כיתה» «מקבילה»", 20.45, 24.05, 11.84, "right"],
  ["תווית – מגמה", "במגמה:", 18.44, 20.45, 11.84, "right"],
  ["מגמה", "«מגמה»", 10.87, 18.44, 11.84, "right"],
  ["תווית – ביום", "ביום :", 19.13, 21.21, 14.03, "left"],
  ["יום", "א'", 16.74, 19.13, 14.03, "center"],
  ["תווית – חודש", "חודש :", 14.66, 16.74, 14.03, "left"],
  ["חודש", "תמוז", 12.58, 14.66, 14.03, "center"],
  ["תווית – שנת", "שנת :", 10.36, 12.58, 14.03, "left"],
  ["שנה", "תשפ\"ג", 7.93, 10.36, 14.03, "right"],
  ["שם המנהל/ת", "בילו מטי", 11.19, 18.12, 17.21, "center"],
  ["תפקיד – מנהל/ת", "מנהל/ת בית הספר", 11.19, 18.12, 18.01, "center"],
  ["שם המחנך/ת", "«מחנך»", 18.12, 25.9, 18.81, "center"],
  ["תפקיד – מחנך/ת", "מחנך/ת הכתה", 18.12, 25.9, 19.71, "center"],
  ["שם מנהל/ת חט\"ע", "שפורן חן", 3.61, 11.19, 18.81, "center"],
  ["תפקיד – מנהל/ת חט\"ע", "מנהל/ת חט\"ע", 3.61, 11.19, 19.71, "center"],
];

const r1 = (n: number) => Math.round(n * 10) / 10;

export function defaultTemplate(): Template {
  const texts: TextElement[] = CELLS.map(([label, text, x0, x1, top, align], i) => ({
    id: `t${i + 1}`,
    kind: "text",
    label,
    x: r1(x0 * 10),
    y: r1(top * 10 + 1),
    w: r1((x1 - x0) * 10),
    h: 6.5,
    text,
    align,
    font: "Heebo",
    size: 14,
    bold: true,
    color: "#000000",
    visible: true,
  }));
  const images: ImageElement[] = [
    {
      id: "sig1",
      kind: "image",
      label: "חתימת המנהל/ת",
      x: 137,
      y: 149.5,
      w: 19,
      h: 24,
      src: asset("/template/signature-principal.png"),
      visible: true,
    },
    {
      id: "sig2",
      kind: "image",
      label: "חתימה נוספת",
      x: 212.5,
      y: 163,
      w: 15,
      h: 24.5,
      src: asset("/template/signature-2.png"),
      visible: true,
    },
  ];
  return {
    name: "תעודת סיום – הרב תחומי",
    background: asset("/template/background.jpg"),
    elements: [...images, ...texts],
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
