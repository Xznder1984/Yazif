# Yazif Backup & Restore Guide

## What's Backed Up

This backup contains the complete **Yazif** YouTube downloader project. Everything needed to rebuild and run the app from scratch.

### Project Files

```
Youtube-Downloader/
├── package.json              # Dependencies & build config
├── tsconfig.json             # TypeScript configuration
├── .env / .env.example       # API key storage
├── .gitignore                # Git ignore rules
├── src/
│   ├── main/                 # Electron main process
│   ├── preload/              # Electron preload scripts
│   └── renderer/             # React UI components + Catppuccin theme
├── website/                  # Landing page (Catppuccin themed)
├── scripts/                  # Build/setup scripts
├── BACKUP.md                 # This file
└── README.md                 # Project documentation
```

---

## How to Restore from This Backup

### Prerequisites
- **Node.js** v22+ (https://nodejs.org)
- **yt-dlp** installed and in PATH
- **ffmpeg** installed and in PATH
- **Windows** (Linux/macOS support coming soon)

### Step 1: Copy the Project
If you lost the original folder, copy this entire `Youtube-Downloader` directory to wherever you want it.

### Step 2: Install Dependencies
Open a terminal in the project root and run:
```bash
cd D:\Albarr\Projects\Youtube-Downloader
npm install
```

### Step 3: Configure API Key
Edit `.env` or use the in-app Settings to add your NVIDIA NIM API key:
```
NVIDIA_API_KEY=nvapi-your-key-here
SEPARATE_FOLDERS=true
```

### Step 4: Build & Run
```bash
# Development mode
npm run dev

# Build for production (creates installer)
npm run build:win
```

### Step 5: Install yt-dlp (if missing)
```bash
# Using pip
pip install yt-dlp

# Or download from GitHub
# https://github.com/yt-dlp/yt-dlp/releases
```

---

## Config Storage

Your app config is stored in:
```
%APPDATA%/yazif-config/config.json
```

This contains:
- Download path
- Separate folders setting
- API key reference
- Auto-organize preference

The `.env` file in the project root stores the actual API key.

---

## What to Do If Something Breaks

1. **Delete `node_modules`** and run `npm install` again
2. **Delete the config folder** at `%APPDATA%/yazif-config/` to reset settings
3. **Re-run the setup wizard** by setting `setupComplete: false` in config.json
4. **Check yt-dlp** is working: `yt-dlp --version`
5. **Check ffmpeg** is working: `ffmpeg -version`

---

## Exporting Your Data

Your downloads are stored in the path you selected during setup (default: `C:\Users\<you>\Downloads\Yazif`). 

To backup your downloads, just copy that folder.

---

## Rebuilding After a Fresh Clone

```bash
git clone <repo-url> Yazif
cd Yazif
npm install
# Copy your .env file with API keys
npm run dev
```
