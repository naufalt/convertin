import fs from 'node:fs';
import Module from 'node:module';

// Polyfill for pdfjs
const canvasModule = require('@napi-rs/canvas');
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === 'canvas') return canvasModule;
  return originalRequire.apply(this, arguments);
};
(global as any).DOMMatrix = canvasModule.DOMMatrix;
(global as any).Path2D = canvasModule.Path2D;
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

export interface PdfInspectResult {
  isConvertibleToDocx: boolean;
  pageCount: number;
  hasText: boolean;
  isRasterOnly: boolean;
  reason?: string;
}

export async function inspectPdfForDocxConversion(filePath: string): Promise<PdfInspectResult> {
  try {
    const fileBytes = fs.readFileSync(filePath);
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(fileBytes),
      disableFontFace: true,
    }).promise;

    const pageCount = doc.numPages;
    // Sample up to first 3 pages
    const checkPages = Math.min(pageCount, 3);
    let totalTextChars = 0;

    for (let i = 1; i <= checkPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str || '').join(' ').trim();
      totalTextChars += text.length;
    }

    // If PDF has virtually no extractable text characters (less than 15 chars across sampled pages)
    // it is a pure image/scanned PDF without OCR text layers
    if (totalTextChars < 15) {
      return {
        isConvertibleToDocx: false,
        pageCount,
        hasText: false,
        isRasterOnly: true,
        reason: 'Berkas PDF ini berisi gambar / hasil scan murni tanpa teks yang dapat diedit. Microsoft Word tidak dapat mengonversi gambar murni ke dokumen teks tanpa OCR.'
      };
    }

    return {
      isConvertibleToDocx: true,
      pageCount,
      hasText: true,
      isRasterOnly: false
    };
  } catch (err: any) {
    return {
      isConvertibleToDocx: true, // fallback allow if inspect fails
      pageCount: 1,
      hasText: true,
      isRasterOnly: false
    };
  }
}

