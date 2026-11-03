const fs = require('fs');
const { spawn } = require('child_process');

const width = 644;
const height = 644;
const rgba = Buffer.alloc(width * height * 4, 128);

const proc = spawn('resources\\bin\\ffmpeg.exe', [
  '-y',
  '-f', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', width + 'x' + height,
  '-i', '-',
  'test files\\output\\test_raw.png'
], { shell: false });

proc.stdin.write(rgba);
proc.stdin.end();

proc.on('close', (code) => {
  console.log('FFmpeg exit code:', code, 'Output exists:', fs.existsSync('test files/output/test_raw.png'));
});

