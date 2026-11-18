import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { PAGE_H, PAGE_W, Template, Mapping, Row, fillText } from "./template";
import { renderCertificate } from "./render";

export type Quality = "standard" | "high" | "print";
export const QUALITY_PX: Record<Quality, number> = {
  standard: 2000, // ~170dpi
  high: 2800, // ~240dpi
  print: 3508, // 300dpi
};

export interface ExportOptions {
  mode: "single" | "zip";
  quality: Quality;
  fileNamePattern: string; // לדוגמה «שם פרטי» «שם משפחה»
  onProgress: (done: number, total: number) => void;
  signal?: AbortSignal;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

const safeName = (s: string) =>
  s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 120) || "תעודה";

function newDoc() {
  return new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      async (b) => (b ? resolve(new Uint8Array(await b.arrayBuffer())) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    ),
  );
}

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
}

export async function exportCertificates(
  template: Template,
  rows: Row[],
  mapping: Mapping,
  opts: ExportOptions,
) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("dir", "rtl");
  const width = QUALITY_PX[opts.quality];
  const total = rows.length;
  const usedNames = new Map<string, number>();

  if (opts.mode === "single") {
    const doc = newDoc();
    for (let i = 0; i < total; i++) {
      if (opts.signal?.aborted) throw new DOMException("בוטל", "AbortError");
      await renderCertificate(canvas, template, rows[i], mapping, width);
      const jpg = await canvasToJpeg(canvas);
      if (i > 0) doc.addPage("a4", "landscape");
      doc.addImage(jpg, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
      opts.onProgress(i + 1, total);
      await tick();
    }
    doc.setProperties({ title: template.name });
    save(doc.output("blob"), `${safeName(template.name)}.pdf`);
    return;
  }

  const zip = new JSZip();
  for (let i = 0; i < total; i++) {
    if (opts.signal?.aborted) throw new DOMException("בוטל", "AbortError");
    await renderCertificate(canvas, template, rows[i], mapping, width);
    const jpg = await canvasToJpeg(canvas);
    const doc = newDoc();
    doc.addImage(jpg, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
    let name = safeName(fillText(opts.fileNamePattern, rows[i], mapping) || `תעודה ${i + 1}`);
    const n = usedNames.get(name) || 0;
    usedNames.set(name, n + 1);
    if (n) name = `${name} (${n + 1})`;
    zip.file(`${name}.pdf`, doc.output("arraybuffer"));
    opts.onProgress(i + 1, total);
    await tick();
  }
  const blob = await zip.generateAsync({ type: "blob" });
  save(blob, `${safeName(template.name)}.zip`);
}
