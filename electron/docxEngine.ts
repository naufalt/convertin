import { BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';

/**
 * Convert a .docx file into a clean, vector-based, copyable PDF
 * 100% offline without requiring Microsoft Word.
 */
export async function convertDocxToPdf(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  let win: BrowserWindow | null = null;
  let tempHtmlPath: string | null = null;

  try {
    if (!fs.existsSync(inputPath)) {
      return { success: false, error: 'File DOCX tidak ditemukan.' };
    }

    onProgress?.(20);
    const result = await mammoth.convertToHtml({ path: inputPath });
    const bodyHtml = result.value || '';
    onProgress?.(50);

    const docTitle = path.basename(inputPath);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: "Calibri", "Segoe UI", -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 18px;
      margin-bottom: 8px;
      font-weight: 600;
      line-height: 1.25;
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 { font-size: 1.8em; }
    h2 { font-size: 1.4em; }
    h3 { font-size: 1.15em; }
    p, ul, ol, table, blockquote {
      margin-top: 0;
      margin-bottom: 10px;
    }
    ul, ol {
      padding-left: 1.8em;
    }
    li + li {
      margin-top: 3px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    blockquote {
      padding: 4px 12px;
      border-left: 3px solid #cbd5e1;
      color: #475569;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

    tempHtmlPath = path.join(path.dirname(outputPath), `.convertin-docx-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');
    onProgress?.(70);

    win = new BrowserWindow({
      show: false,
      width: 900,
      height: 1200,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
      },
    });

    await win.loadFile(tempHtmlPath);
    onProgress?.(85);

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    fs.writeFileSync(outputPath, pdfBuffer);
    onProgress?.(100);

    return { success: true, outputPath };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal mengonversi DOCX ke PDF.',
    };
  } finally {
    if (win && !win.isDestroyed()) {
      win.close();
    }
    if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
      try {
        fs.unlinkSync(tempHtmlPath);
      } catch {}
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
