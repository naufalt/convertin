const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  console.log('Electron initialized successfully!');
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true
    }
  });

  const pdfPath = path.resolve('test files/Mockup UI Payroll (1).pdf');
  console.log('Loading:', pdfPath);
  await win.loadURL(`file://${pdfPath}`);
  
  // Wait a moment for PDF viewer
  setTimeout(async () => {
    const image = await win.webContents.capturePage();
    const pngBuf = image.toPNG();
    fs.writeFileSync('test files/output/mockup_page.png', pngBuf);
    console.log('SUCCESS! Saved screenshot length:', pngBuf.length);
    app.quit();
  }, 1500);
});

