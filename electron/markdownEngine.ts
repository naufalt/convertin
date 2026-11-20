import { BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';

/**
 * Convert a Markdown (.md / .markdown) file into a clean, vector-based,
 * copyable PDF using Electron's Chromium printToPDF engine.
 */
export async function convertMarkdownToPdf(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  let win: BrowserWindow | null = null;
  let tempHtmlPath: string | null = null;

  try {
    if (!fs.existsSync(inputPath)) {
      return { success: false, error: 'File Markdown tidak ditemukan.' };
    }

    onProgress?.(20);
    const mdContent = fs.readFileSync(inputPath, 'utf-8');

    marked.setOptions({
      gfm: true,
      breaks: false,
    });

    const bodyHtml = await marked.parse(mdContent);
    onProgress?.(45);

    const baseHref = pathToFileURL(path.dirname(inputPath) + path.sep).href;
    const docTitle = path.basename(inputPath);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <base href="${baseHref}" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.65;
      color: #1f2328;
      background: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 20px;
      margin-bottom: 10px;
      font-weight: 600;
      line-height: 1.25;
      color: #111827;
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 { font-size: 1.85em; padding-bottom: 0.3em; border-bottom: 1px solid #d1d9e0; }
    h2 { font-size: 1.45em; padding-bottom: 0.25em; border-bottom: 1px solid #d1d9e0; }
    h3 { font-size: 1.2em; }
    h4 { font-size: 1.05em; }
    p, ul, ol, blockquote, table, pre {
      margin-top: 0;
      margin-bottom: 12px;
    }
    a {
      color: #0969da;
      text-decoration: underline;
    }
    ul, ol {
      padding-left: 1.8em;
    }
    li + li {
      margin-top: 4px;
    }
    input[type="checkbox"] {
      margin-right: 6px;
      vertical-align: middle;
    }
    blockquote {
      padding: 4px 14px;
      color: #59636e;
      border-left: 3.5px solid #d1d9e0;
      background: #f8fafc;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.88em;
      background-color: #f3f4f6;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      color: #111827;
    }
    pre {
      background-color: #f6f8fa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 14px;
      overflow-x: auto;
      line-height: 1.45;
      page-break-inside: avoid;
      break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-word;
    }
    pre code {
      background: transparent;
      padding: 0;
      font-size: 0.85em;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #d1d9e0;
      padding: 6px 10px;
      text-align: left;
    }
    th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    tr:nth-child(even) td {
      background-color: #fbfcfd;
    }
    hr {
      border: 0;
      border-top: 1px solid #d1d9e0;
      margin: 20px 0;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

    tempHtmlPath = path.join(path.dirname(outputPath), `.convertin-md-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');

    onProgress?.(65);

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
      error: err?.message || 'Gagal mengonversi Markdown ke PDF.',
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
