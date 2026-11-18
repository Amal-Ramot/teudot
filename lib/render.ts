import { PAGE_H, PAGE_W, Template, Mapping, Row, fillText, TextElement } from "./template";

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(src);
        reject(new Error(`טעינת התמונה נכשלה: ${src.slice(0, 60)}`));
      };
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

const PT_TO_MM = 25.4 / 72;

export function fontSpec(el: TextElement, pxPerMm: number) {
  const px = el.size * PT_TO_MM * pxPerMm;
  return `${el.bold ? 700 : 400} ${px}px "${el.font}", "Heebo", sans-serif`;
}

export async function ensureFonts(t: Template) {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = new Set<string>();
  for (const el of t.elements) {
    if (el.kind === "text") specs.add(`${el.bold ? 700 : 400} 20px "${el.font}"`);
  }
  await Promise.all(
    [...specs].map((s) => document.fonts.load(s, "אבגד abc").catch(() => undefined)),
  );
}

/** מצייר תעודה אחת על קנבס. row=null → מציג את שמות השדות */
export async function renderCertificate(
  canvas: HTMLCanvasElement,
  template: Template,
  row: Row | null,
  mapping: Mapping,
  widthPx: number,
  opts: { showTokens?: boolean } = {},
) {
  const pxPerMm = widthPx / PAGE_W;
  const w = Math.round(widthPx);
  const h = Math.round(PAGE_H * pxPerMm);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const [bg] = await Promise.all([
    loadImage(template.background).catch(() => null),
    ensureFonts(template),
  ]);
  const imgs = await Promise.all(
    template.elements.map((el) =>
      el.kind === "image" && el.visible ? loadImage(el.src).catch(() => null) : null,
    ),
  );

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  if (bg) ctx.drawImage(bg, 0, 0, w, h);

  template.elements.forEach((el, i) => {
    if (!el.visible) return;
    const x = el.x * pxPerMm;
    const y = el.y * pxPerMm;
    const ew = el.w * pxPerMm;
    const eh = el.h * pxPerMm;
    if (el.kind === "image") {
      const img = imgs[i];
      if (!img) return;
      // התאמה (contain) בתוך המסגרת
      const r = Math.min(ew / img.naturalWidth, eh / img.naturalHeight);
      const dw = img.naturalWidth * r;
      const dh = img.naturalHeight * r;
      ctx.drawImage(img, x + (ew - dw) / 2, y + (eh - dh) / 2, dw, dh);
      return;
    }
    const text = fillText(el.text, opts.showTokens ? null : row, mapping);
    if (!text) return;
    ctx.save();
    ctx.direction = "rtl";
    ctx.fillStyle = el.color;
    ctx.textBaseline = "middle";
    let size = el.size;
    // הקטנה אוטומטית אם הטקסט ארוך מהמסגרת
    const pad = 1 * pxPerMm;
    for (let k = 0; k < 30; k++) {
      ctx.font = fontSpec({ ...el, size }, pxPerMm);
      if (ctx.measureText(text).width <= ew - pad * 2 || size <= 6) break;
      size -= 0.5;
    }
    let tx: number;
    if (el.align === "right") {
      ctx.textAlign = "right";
      tx = x + ew - pad;
    } else if (el.align === "left") {
      ctx.textAlign = "left";
      tx = x + pad;
    } else {
      ctx.textAlign = "center";
      tx = x + ew / 2;
    }
    ctx.fillText(text, tx, y + eh / 2 + eh * 0.04);
    ctx.restore();
  });
}
