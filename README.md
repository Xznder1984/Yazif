# Yazif

A clean, modern YouTube downloader with Catppuccin Mocha theming.

## Features

- **Multiple Formats**: MP4, MKV, WebM, AVI, MP3, WAV, FLAC, OGG, M4A, Opus
- **Simple & Advanced Modes**: Quick one-click downloads or full yt-dlp control
- **AI-Powered Naming**: NVIDIA NIM renames files with clean, descriptive names
- **Auto-Classification**: AI detects audio vs video and sorts into separate folders
- **Drag & Drop**: Drag downloaded files directly into CapCut, Premiere, or any editor
- **Music Organizer**: Organize your music library by Artist / Album / Title
- **Error Reporting**: One-click error reports sent to the developer
- **Catppuccin Theme**: Beautiful Catppuccin Mocha color scheme throughout

## Requirements

- Windows 10+ (Linux/macOS coming soon)
- Node.js v22+
- yt-dlp (auto-detected, install via `pip install yt-dlp`)
- ffmpeg (for post-processing, auto-detected from PATH)
- NVIDIA NIM API key (optional, for AI features — get free at build.nvidia.com)

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build:win
```

Outputs to `release/` folder.

## Configuration

The app stores config in:
- `%APPDATA%/yazif-config/config.json` — App preferences
- `.env` — API keys (NVIDIA NIM)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 33 + React 19 + TypeScript |
| Styling | Custom CSS (Catppuccin Mocha palette) |
| Downloader | yt-dlp (subprocess) |
| AI | NVIDIA NIM API (llama-3.1-8b-instruct) |
| Audio Processing | ffmpeg |
| Music Metadata | music-metadata |
| Website | Static HTML/CSS/JS |

## License

MIT
