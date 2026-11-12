import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

async function generateAppxAssets() {
  const sourceIconPath = path.resolve('resources', 'icons', 'app-icon.png');
  const targetDir = path.resolve('build', 'appx');

  if (!fs.existsSync(sourceIconPath)) {
    console.error('Source icon not found:', sourceIconPath);
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const srcImg = await loadImage(sourceIconPath);

  // Specifications required by electron-builder for Windows AppX/MSIX
  const assets = [
    { name: 'StoreLogo.png', width: 50, height: 50, padding: 0 },
    { name: 'Square44x44Logo.png', width: 44, height: 44, padding: 0 },
    { name: 'Square44x44Logo.targetsize-44_altform-unplated.png', width: 44, height: 44, padding: 0 },
    { name: 'Square150x150Logo.png', width: 150, height: 150, padding: 0 },
    { name: 'Square310x310Logo.png', width: 310, height: 310, padding: 0 },
    { name: 'Wide310x150Logo.png', width: 310, height: 150, padding: 20 },
    { name: 'SplashScreen.png', width: 620, height: 300, padding: 50 },
  ];

  for (const asset of assets) {
    const canvas = createCanvas(asset.width, asset.height);
    const ctx = canvas.getContext('2d');

    // Fill background with app background color (#11131A)
    ctx.fillStyle = '#11131A';
    ctx.fillRect(0, 0, asset.width, asset.height);

    // Draw centered icon with proportional aspect ratio
    const pad = asset.padding || 0;
    const availW = asset.width - pad * 2;
    const availH = asset.height - pad * 2;
    const minDim = Math.min(availW, availH);

    const drawX = Math.round((asset.width - minDim) / 2);
    const drawY = Math.round((asset.height - minDim) / 2);

    ctx.drawImage(srcImg, drawX, drawY, minDim, minDim);

    const outPath = path.join(targetDir, asset.name);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log(`Generated: ${asset.name} (${asset.width}x${asset.height})`);
  }

  console.log('All AppX tile assets generated successfully in build/appx!');
}

generateAppxAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
