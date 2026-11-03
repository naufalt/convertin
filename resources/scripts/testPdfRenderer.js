const fs = require('fs');
const Module = require('module');
const canvasModule = require('@napi-rs/canvas');

// Intercept require('canvas') and return @napi-rs/canvas
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'canvas') {
    return canvasModule;
  }
  return originalRequire.apply(this, arguments);
};

// Polyfill globals
global.DOMMatrix = canvasModule.DOMMatrix;
global.Path2D = canvasModule.Path2D;

const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

async function testPdfToImage(pdfPath, outPngPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({
    data,
    disableFontFace: false,
    useSystemFonts: true,
  }).promise;

  console.log(`Document loaded. Total pages: ${doc.numPages}`);
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });

  const canvas = canvasModule.createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
  const context = canvas.getContext('2d');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  const pngBuf = canvas.toBuffer('image/png');
  fs.writeFileSync(outPngPath, pngBuf);
  console.log(`SUCCESS! Rendered page 1 to ${outPngPath}! Bytes: ${pngBuf.length}`);
}

testPdfToImage('test files/Mockup UI Payroll (1).pdf', 'test files/output/test_page1.png')
  .catch(err => console.error('Render error:', err));
