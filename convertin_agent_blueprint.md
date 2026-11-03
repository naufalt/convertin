# PROJECT SPECIFICATION: "Convertin"
> **Directive:** You are an expert Systems Architect & Desktop Application Engineer. Read this entire document and implement the complete desktop application named **Convertin** according to the specifications below.

---

## 1. Project Overview & Identity
- **Project Name:** `convertin`
- **Application Title:** Convertin // Offline Media & File Converter
- **Target OS:** Windows 10/11 (x64)
- **Deployment Type:** Standalone Desktop App (100% Offline, Zero Cloud Dependencies)
- **Core Technology Stack:**
  - **Framework:** Tauri v2 (preferred for lightweight memory footprint) OR Electron
  - **Frontend:** React + TypeScript + Tailwind CSS + Lucide Icons
  - **Multimedia Engine:** Bundled static `ffmpeg.exe` and `ffprobe.exe`
  - **Image Processing Engine:** Bundled `magick.exe` (ImageMagick) OR Native Node `sharp` / Rust `image-rs`

---

## 2. Core Operational Architecture

```
[ User Drag & Drop / File Select ]
              │
              ▼
   [ Metadata Probe Engine ] ──► Extracts format, duration, dimensions, codecs
              │
              ▼
   [ Smart Filter UI Matrix ] ──► Dynamically filters valid target formats
              │
              ▼
   [ Task Queue & Concurrency Pool (Max 2 Parallel Tasks) ]
              │
              ▼
   [ Local Binary Execution via Child Process (FFmpeg / ImageMagick) ]
              │
              ├──► Realtime STDERR regex parser -> IPC Progress Event (0-100%)
              │
              ▼
   [ Output File Writer & Native Notification ]
```

---

## 3. Supported Conversion Matrix

```json
{
  "matrix": {
    "video": {
      "inputs": ["mp4", "mkv", "mov", "avi", "flv", "webm", "wmv", "ts", "3gp"],
      "outputs": ["mp4", "mkv", "webm", "mov", "gif", "mp3", "wav", "aac"],
      "codecs": {
        "h264_cpu": "-c:v libx264 -crf 22 -preset medium",
        "h264_nvenc": "-c:v h264_nvenc -preset p5 -cq 23",
        "h265_nvenc": "-c:v hevc_nvenc -preset p5 -cq 26",
        "vp9": "-c:v libvpx-vp9 -crf 30 -b:v 0",
        "gif_optimized": "-vf \"fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse\""
      }
    },
    "audio": {
      "inputs": ["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "opus"],
      "outputs": ["mp3", "wav", "flac", "ogg", "m4a", "opus"],
      "codecs": {
        "mp3": "-c:a libmp3lame -q:a 2",
        "wav": "-c:a pcm_s16le",
        "flac": "-c:a flac",
        "aac": "-c:a aac -b:a 256k"
      }
    },
    "image": {
      "inputs": ["png", "jpg", "jpeg", "webp", "avif", "bmp", "tiff", "svg", "ico", "heic"],
      "outputs": ["jpg", "png", "webp", "avif", "ico", "pdf"],
      "presets": {
        "jpg": "-quality 90",
        "webp_lossy": "-quality 85",
        "webp_lossless": "-define webp:lossless=true"
      }
    }
  }
}
```

---

## 4. UI/UX & Design System Requirements

1. **Theme & Palette:**
   - Background: Dark slate/zinc `#09090b` and `#121217`
   - Panels: Glassmorphism with `rgba(24, 24, 27, 0.75)`, subtle border `rgba(255, 255, 255, 0.08)`
   - Primary Accent: Cyberpunk Cyan `#00f0ff` or Emerald `#10b981`
   - Warning/Errors: Crimson `#ef4444` / Amber `#f59e0b`
   - Typography: Clean sans-serif (`Inter` or `Plus Jakarta Sans`) paired with monospace font (`JetBrains Mono`) for file sizes, timestamps, and progress percentages.

2. **Window & Layout Sections:**
   - **Custom Titlebar:** Window controls (Minimize, Maximize, Close), brand logo `convertin // v1.0`, hardware acceleration indicator (`GPU: NVENC READY` or `CPU MODE`).
   - **Drop Surface / Active Workspace:**
     - *State A (Empty):* Minimal dashed zone, drag icon, "Drop files or folders here to convert", and a "Browse Files" button.
     - *State B (Populated Queue):* Compact table list with rows showing:
       - File icon + Original file name + Size
       - Arrow indicator `->`
       - Target format dropdown (auto-selected to default best-match)
       - Individual progress bar + percentage (`48% - ETA: 00:12`)
       - Individual cancel/delete button
   - **Bottom Command Deck:**
     - "Convert all to:" global batch dropdown
     - Destination directory toggle ("Save to source folder" vs "Custom output folder")
     - "Clear Queue" button
     - Primary "Convert All (N Files)" CTA button with subtle glow and disabled state during processing.

---

## 5. CLI & Execution Commands Reference

### Video Transcoding (with Hardware Acceleration Check)
```bash
# NVIDIA NVENC MP4:
ffmpeg.exe -y -hwaccel cuda -i "{input_path}" -c:v h264_nvenc -preset p4 -b:v 4M -c:a aac -b:a 192k "{output_path}"

# Standard CPU Fallback:
ffmpeg.exe -y -i "{input_path}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k "{output_path}"
```

### Video to High-Framerate Optimized GIF
```bash
ffmpeg.exe -y -i "{input_path}" -vf "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "{output_path}"
```

### Extract Audio from Video
```bash
ffmpeg.exe -y -i "{input_path}" -vn -c:a libmp3lame -q:a 2 "{output_path}"
```

### Image Format & HEIC Handling (via ImageMagick CLI)
```bash
magick.exe "{input_path}" -quality 90 "{output_path}"
```

---

## 6. Realtime Progress Tracking Specification

The backend child process execution MUST listen to the `stderr` stream of `ffmpeg`. Parse progress via regex:

1. **Total Duration Capture:**
   ```regex
   Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})
   ```
2. **Current Timestamp Update:**
   ```regex
   time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})
   ```
3. **Calculation:**
   $$\text{Progress \%} = \min\left(100, \frac{\text{Current Seconds}}{\text{Total Seconds}} \times 100\right)$$
4. Send progress events over IPC to frontend (`on('conversion-progress', { id, percent, speed, eta })`).

---

## 7. Edge Cases & Resilience Rules

1. **Path Sanitization:** Wrap all file paths in double quotes to prevent crashes with spaces and special unicode characters in Windows pathnames.
2. **File Overwrite Prevention:** If `filename.ext` already exists in the destination directory, auto-increment to `filename (1).ext` unless explicit overwrite permission is set.
3. **Concurrency Throttling:** Limit concurrent active conversions to a queue pool of **2 parallel tasks** to prevent system CPU/memory exhaustion.
4. **Binary Resolution:** Automatically locate `ffmpeg.exe` and `magick.exe` relative to the application's executable root or bundled resources folder (`process.resourcesPath` in Electron or `tauri::api::path::resolve_resource` in Tauri).

---

## 8. Agent Step-by-Step Execution Plan

When implementing, follow this exact sequence:
1. Initialize project structure (`tauri-app` or `electron-vite-react`).
2. Scaffold state stores (Zustand/Context) for `queue`, `settings`, and `systemCapabilities`.
3. Implement IPC handlers for file dialog picking, metadata probing, and child process execution.
4. Build UI components (`Titlebar`, `DropZone`, `QueueItem`, `FormatPicker`, `ControlFooter`).
5. Wire up the FFmpeg progress parser and verify cancel/kill PID operations.
6. Package local static binaries into the bundler configuration.