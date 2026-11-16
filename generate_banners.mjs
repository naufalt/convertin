import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

async function generateStoreBanners() {
  const iconPath = path.resolve('resources', 'icons', 'app-icon.png');
  const targetDir = path.resolve('docs', 'store-assets');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const iconImg = await loadImage(iconPath);

  // 1:1 Box Art (1080 x 1080)
  {
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0C0D12';
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle glow behind icon
    const grad = ctx.createRadialGradient(540, 480, 50, 540, 480, 400);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grad.addColorStop(1, 'rgba(12, 13, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Draw Icon centered
    const iconSize = 650;
    ctx.drawImage(iconImg, (1080 - iconSize) / 2, 200, iconSize, iconSize);

    // Draw App Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ConvertIn', 540, 930);

    // Draw Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = '30px sans-serif';
    ctx.fillText('Offline Media & File Converter', 540, 980);

    fs.writeFileSync(path.join(targetDir, 'store-box-art-1080x1080.png'), canvas.toBuffer('image/png'));
    console.log('Generated store-box-art-1080x1080.png');
  }

  // 9:16 Poster Art (720 x 1080)
  {
    const canvas = createCanvas(720, 1080);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0C0D12';
    ctx.fillRect(0, 0, 720, 1080);

    // Glow
    const grad = ctx.createRadialGradient(360, 480, 50, 360, 480, 350);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grad.addColorStop(1, 'rgba(12, 13, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1080);

    // Draw Icon centered
    const iconSize = 520;
    ctx.drawImage(iconImg, (720 - iconSize) / 2, 280, iconSize, iconSize);

    // Draw App Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ConvertIn', 360, 890);

    // Draw Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = '26px sans-serif';
    ctx.fillText('Offline Media Converter', 360, 940);

    fs.writeFileSync(path.join(targetDir, 'store-poster-art-720x1080.png'), canvas.toBuffer('image/png'));
    console.log('Generated store-poster-art-720x1080.png');
  }
}

generateStoreBanners().catch(err => {
  console.error(err);
  process.exit(1);
});
