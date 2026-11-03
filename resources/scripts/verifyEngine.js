const path = require('path');
const fs = require('fs');
const Module = require('module');

// Polyfill and intercept canvas for pdfjs-dist
const canvasModule = require('@napi-rs/canvas');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'canvas') return canvasModule;
  return originalRequire.apply(this, arguments);
};
global.DOMMatrix = canvasModule.DOMMatrix;
global.Path2D = canvasModule.Path2D;
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

async function testConvert() {
  const inputPath = path.resolve('test files/Mockup UI Payroll (1).pdf');
  const finalOutputPath = path.resolve('test files/output/test_direct_convert.png');
  const targetExt = 'png';

  console.log('Reading file:', inputPath);
  const fileBytes = fs.readFileSync(inputPath);
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(fileBytes),
    disableFontFace: true,
  }).promise;

  console.log('Doc pages:', doc.numPages);
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = canvasModule.createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  console.log('Rendering page...');
  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;

  const pngBuf = canvas.toBuffer('image/png');
  fs.writeFileSync(finalOutputPath, pngBuf);
  console.log('CONVERSION SUCCESSFUL! Written to:', finalOutputPath, 'Bytes:', pngBuf.length);
}

testConvert().catch(err => {
  console.error('CONVERSION FAILED:', err);
});

