# Convertin

Convertin is an offline desktop media and file conversion application built with Electron, React, TypeScript, and Tailwind CSS. It is designed to provide fast, privacy-focused conversions without relying on cloud services or external network connections.

---

## Key Features

- **100% Offline Processing**: All conversions run locally using bundled FFmpeg, libwebp, native PDF rendering, and vector rasterizers. No telemetry or external server calls.
- **Radial Donut Menu**: Quickly trigger conversions directly from Windows Explorer by selecting a file and pressing `Ctrl + Q` or `Alt + C`.
- **System Tray Integration**: Background conversions execute silently in the Windows system tray with live progress tooltips and native notifications upon completion.
- **Worker Thread Processing**: Heavy workloads (such as complex vector PDF rendering) run inside dedicated background worker threads to keep the user interface responsive.
- **Real-Time Progress & Console Logs**: Live conversion progress, elapsed time, ETA estimates, and an integrated log viewer to track conversion details.
- **Conversion History**: Track completed conversions with detailed comparisons (original vs converted file size, compression percentage, duration, and completion timestamp).
- **Material Design 3 Theme**: Clean interface with full support for Light and Dark modes.
- **System Telemetry**: Real-time display of CPU engine load, RAM utilization, and disk storage availability.

---

## Supported Formats

- **Video**: MP4, MKV, WebM, MOV, AVI, FLV, WMV, GIF, MP3, WAV, AAC
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS
- **Image**: PNG, JPG, JPEG, WEBP, AVIF, ICO, BMP, TIFF, SVG, PDF
- **Document**: PDF to PNG, JPG, WEBP, ICO

---

## Tech Stack

- **Framework**: Electron 34
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS
- **Media Engine**: FFmpeg static build, `@resvg/resvg-js`, `pdf-lib`, `pdfjs-dist`, `@napi-rs/canvas`
- **State Management**: Zustand
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- Windows 10/11 (64-bit)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/naufalt/convertin.git
   cd convertin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure FFmpeg binaries are in place:
   Download and place `ffmpeg.exe` and `ffprobe.exe` inside the `resources/bin/` directory.

### Running in Development Mode

```bash
npm run dev
```
Alternatively, on Windows you can double-click `start-dev.bat`.

### Building for Production

To package the application into a standalone installer:
```bash
npm run build
```

---

## Shortcuts

- `Ctrl + Q`: Open Radial Donut wheel for the selected file in Windows Explorer.
- `Alt + C`: Alternative shortcut for the Radial Donut wheel.
- `Escape`: Dismiss the Radial Donut wheel.

---

## License

This project is licensed under the MIT License.

