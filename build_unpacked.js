const fs = require('fs');
const path = require('path');

console.log('Staging win-unpacked files...');
const outDir = path.resolve('release/win-unpacked');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

console.log('Copying electron distribution files...');
const electronDist = path.resolve('node_modules/electron/dist');
fs.cpSync(electronDist, outDir, { recursive: true });

// Rename electron.exe to Convertin.exe
const oldExe = path.join(outDir, 'electron.exe');
const newExe = path.join(outDir, 'Convertin.exe');
if (fs.existsSync(oldExe)) {
  fs.renameSync(oldExe, newExe);
}

// Setup app directory in resources/app
const appDir = path.join(outDir, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

console.log('Copying application files into resources/app...');
fs.cpSync(path.resolve('dist'), path.join(appDir, 'dist'), { recursive: true });
fs.cpSync(path.resolve('dist-electron'), path.join(appDir, 'dist-electron'), { recursive: true });

// Copy officeHelper.ps1 if present in electron/ into dist-electron/
const officeHelperSrc = path.resolve('electron/officeHelper.ps1');
const officeHelperDest = path.join(appDir, 'dist-electron', 'officeHelper.ps1');
if (fs.existsSync(officeHelperSrc)) {
  fs.cpSync(officeHelperSrc, officeHelperDest);
  console.log('Copied officeHelper.ps1 to dist-electron');
}

// Copy minimal package.json
const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const runtimePkg = {
  name: pkgJson.name,
  version: pkgJson.version,
  main: pkgJson.main,
  dependencies: pkgJson.dependencies
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(runtimePkg, null, 2));

// Copy node_modules needed at runtime (native modules, pdfjs, etc.)
console.log('Copying runtime node_modules...');
const runtimeModules = [
  '@napi-rs',
  '@resvg',
  'pdfjs-dist',
  'pdf-lib',
  'zustand',
  'clsx',
  'tailwind-merge',
  'lucide-react'
];
const appNodeModules = path.join(appDir, 'node_modules');
fs.mkdirSync(appNodeModules, { recursive: true });

for (const mod of runtimeModules) {
  const src = path.resolve('node_modules', mod);
  const dest = path.join(appNodeModules, mod);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

// Copy extra resources (binaries ffmpeg/ffprobe and icons)
console.log('Copying extra resources (ffmpeg, icons)...');
const extraResources = path.join(outDir, 'resources');
fs.cpSync(path.resolve('resources/bin'), path.join(extraResources, 'bin'), { recursive: true });
fs.cpSync(path.resolve('resources/icons'), path.join(extraResources, 'icons'), { recursive: true });

console.log('win-unpacked directory prepared successfully at:', outDir);
