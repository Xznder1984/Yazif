const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const YTDLP_DIR = path.join(__dirname, '..', 'bin');
const YTDLP_BIN = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

function ensureYtdlp() {
  // Check if yt-dlp is already in PATH
  try {
    execSync(`"${YTDLP_BIN}" --version`, { stdio: 'ignore', timeout: 5000 });
    console.log('yt-dlp found in PATH');
    return;
  } catch {
    // Not in PATH
  }

  // Check if we have a local copy
  const localBin = path.join(YTDLP_DIR, YTDLP_BIN);
  if (fs.existsSync(localBin)) {
    console.log('yt-dlp found locally');
    return;
  }

  console.log('yt-dlp not found. Please install it:');
  console.log('');
  console.log('  Option 1: pip install yt-dlp');
  console.log('  Option 2: Download from https://github.com/yt-dlp/yt-dlp/releases');
  console.log('');
  console.log('  For Windows: download yt-dlp.exe and add to PATH');
  console.log('  For Linux/macOS: pip install yt-dlp');
  console.log('');
}

module.exports = { ensureYtdlp };

if (require.main === module) {
  ensureYtdlp();
}
