# Convertin

> **100% Free & Open-Source Offline Desktop Converter**  
> Developed by **Naufaal Muhammad** ([@naufalt](https://github.com/naufalt))

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

<a name="english"></a>
## English

Convertin is a modern, privacy-focused offline desktop file conversion application built with Electron, React, TypeScript, and Tailwind CSS. It handles media and document conversions directly on your local machine without sending your data to any cloud service.

### 🌟 Key Features

- **100% Free & Offline**: Conversions run locally via embedded FFmpeg, libwebp, native PDF rendering, and vector rasterizers. No internet required, no subscriptions, zero tracking.
- **OTA (Over-The-Air) Updates**: Seamless auto-update detection via GitHub Releases. Download and install new updates with one click.
- **Radial Donut Menu**: Convert files instantly from Windows Explorer by selecting a file and pressing `Ctrl + Q` or `Alt + C`.
- **System Tray Integration**: Run conversions quietly in the background with live progress in the tray tooltip and notifications upon completion.
- **Worker Thread Architecture**: Heavy operations (e.g. multi-page vector PDF rasterization) run in dedicated background worker threads to keep the UI smooth and responsive.
- **Real-Time Progress & Logs**: Accurate progress bar, elapsed time timer, ETA prediction, and a collapsible log drawer.
- **Conversion History**: Easily review past conversions, file size comparisons (before & after), space saved, and timestamps.
- **Modern Theme**: Clean Material Design 3 interface with Dark and Light mode support.

### 📁 Supported Formats

- **Video**: MP4, MKV, WebM, MOV, AVI, FLV, WMV, GIF
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS
- **Image**: PNG, JPG, JPEG, WEBP, AVIF, ICO, BMP, TIFF, SVG
- **Document**: PDF to PNG, JPG, WEBP, ICO

### ⌨️ Keyboard Shortcuts

- `Ctrl + Q`: Open Radial Donut wheel for selected file in Windows Explorer.
- `Alt + C`: Alternative trigger for Radial wheel.
- `Escape`: Close Radial wheel.

### 🛠️ Developer Setup

```bash
# Clone repository
git clone https://github.com/naufalt/convertin.git
cd convertin

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build unpacked app and installer
node build_unpacked.js
"C:\Program Files\Inno Setup 7\ISCC.exe" installer.iss
```

---

<a name="bahasa-indonesia"></a>
## Bahasa Indonesia

Convertin adalah aplikasi konversi berkas dan media desktop yang modern, cepat, dan sepenuhnya offline. Dibuat menggunakan Electron, React, TypeScript, dan Tailwind CSS, Convertin memproses semua file langsung di perangkat lokal Anda tanpa ketergantungan pada server internet maupun layanan cloud.

### 🌟 Fitur Utama

- **100% Gratis & Bebas Iklan**: Semua proses konversi berjalan langsung di komputer Anda. Data pribadi Anda tetap aman dan tidak pernah diunggah ke internet.
- **Fitur Update Otomatis (OTA)**: Mendeteksi versi terbaru langsung dari GitHub Releases. Pengguna dapat mengunduh dan memperbarui aplikasi secara otomatis hanya dengan satu klik.
- **Menu Cepat Donut Radial**: Ubah format file langsung dari Windows Explorer tanpa perlu membuka jendela utama, cukup pilih file dan tekan `Ctrl + Q` atau `Alt + C`.
- **Integrasi System Tray**: Konversi dapat berjalan di latar belakang (tray) dengan tooltip persentase realtime dan notifikasi ketika selesai.
- **Performa Responsif (Worker Thread)**: Proses berat seperti render PDF multi-halaman berukuran besar dijalankan pada thread terpisah, sehingga aplikasi tetap lancar tanpa *Not Responding*.
- **Estimasi Waktu & Log Realtime**: Dilengkapi durasi proses berjalan, estimasi selesai (ETA), dan drawer log teknis untuk melihat detail konversi.
- **Riwayat Konversi (History)**: Menampilkan daftar file yang sudah selesai dikonversi, perbandingan ukuran sebelum & sesudah, serta waktu prosesnya.
- **Tampilan Elegan**: Mengadopsi desain Material Design 3 dengan pilihan tema Gelap (Dark Mode) dan Terang (Light Mode).

### 📁 Format yang Didukung

- **Video**: MP4, MKV, WebM, MOV, AVI, FLV, WMV, GIF
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS
- **Gambar**: PNG, JPG, JPEG, WEBP, AVIF, ICO, BMP, TIFF, SVG
- **Dokumen**: PDF ke PNG, JPG, WEBP, ICO

### ⌨️ Pintasan Tombol (Shortcuts)

- `Ctrl + Q`: Membuka menu radial cepat untuk file yang dipilih di Explorer.
- `Alt + C`: Pintasan alternatif menu radial.
- `Escape`: Menutup menu radial.

---

## 👨‍💻 Developer

Dibuat dan dikembangkan oleh **Naufaal Muhammad**  
GitHub: [@naufalt](https://github.com/naufalt)

---

## 📄 Licenses & Third-Party Credits

Convertin is distributed under the **[MIT License](LICENSE)**:
- Copyright (c) 2026 Naufaal Muhammad.
- You are free to use, copy, modify, merge, publish, and distribute this software for personal or commercial purposes.

### Third-Party Open Source Libraries & Components:

This application bundles and makes use of the following open-source software:

- **[FFmpeg](https://ffmpeg.org/)**  
  Licensed under [LGPL v2.1+ / GPL v3+](https://www.gnu.org/licenses/). FFmpeg is a trademark of Fabrice Bellard, originator of the FFmpeg project.
- **[Electron](https://github.com/electron/electron)**  
  Licensed under the [MIT License](https://github.com/electron/electron/blob/main/LICENSE). Copyright (c) Electron contributors.
- **[PDF.js (pdfjs-dist)](https://github.com/mozilla/pdf.js)**  
  Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). Copyright (c) Mozilla Foundation.
- **[@resvg/resvg-js](https://github.com/yisibl/resvg-js)**  
  Licensed under the [MPL-2.0 License](https://www.mozilla.org/en-US/MPL/2.0/). High-performance SVG renderer.
- **[@napi-rs/canvas](https://github.com/Brooooooklyn/canvas)**  
  Licensed under the [MIT License](https://github.com/Brooooooklyn/canvas/blob/main/LICENSE).
- **[pdf-lib](https://github.com/Hopding/pdf-lib)**  
  Licensed under the [MIT License](https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md).
- **[Lucide Icons](https://lucide.dev/)**  
  Licensed under the [ISC License](https://lucide.dev/license).

