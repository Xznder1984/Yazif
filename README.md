# Yazif

A clean, modern YouTube downloader with Catppuccin Mocha theming.

## Features

- **Search & Download**: Search YouTube directly in the app, preview results, and download instantly
- **Multiple Formats**: MP4, MKV, WebM, AVI, MP3, WAV, FLAC, OGG, M4A
- **Simple & Advanced Modes**: Quick one-click downloads or full yt-dlp args
- **AI-Powered Naming**: NVIDIA NIM renames files with clean, descriptive names
- **Auto-Classification**: AI detects audio vs video and sorts into separate folders
- **Drag & Drop**: Drag downloaded files directly into CapCut, Premiere, or any editor
- **Music Organizer**: Organize your music library by Artist / Album / Title
- **Catppuccin Theme**: Beautiful Catppuccin Mocha color scheme throughout

## Downloads

Grab the latest build from [Releases](https://github.com/Xznder1984/Yazif/releases/latest):

| File | Description |
|------|-------------|
| `Yazif-Setup.exe` | Windows installer (installs to `%LOCALAPPDATA%\Yazif`) |
| `Yazif-Portable.zip` | Portable — unzip and run `Yazif.exe` |
| `Yazif.exe` | Standalone executable |

## Requirements

- Windows 10+
- Python 3.12+ (for building from source only — the exe bundles everything)
- NVIDIA NIM API key (optional, for AI features — get free at build.nvidia.com)

## Quick Start

```bash
pip install -r requirements.txt
python main.py
```

## Build

```bash
python build.py
```

Outputs a single `Yazif.exe` to `dist/`. The NSIS installer is built automatically in the GitHub Actions release workflow.

## Configuration

The app stores config in:
- `%APPDATA%/yazif-config/config.json` — App preferences (download path, AI settings)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Python 3.12 + PyQt6 |
| Styling | Custom QSS (Catppuccin Mocha palette) |
| Downloader | yt-dlp (Python library) |
| AI | NVIDIA NIM API (llama-3.1-8b-instruct) |
| Music Metadata | Mutagen |
| Image Handling | Pillow |
| Installer | NSIS |
| Website | Static HTML/CSS/JS (GitHub Pages) |

## Release

Push to `main` to trigger the GitHub Actions workflow, which builds the exe, NSIS installer, and portable zip, then creates a GitHub Release.

## License

MIT
