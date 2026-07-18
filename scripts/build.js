const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFiles(srcDir, destDir, exts) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const item of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, item.name);
    const destPath = path.join(destDir, item.name);
    if (item.isDirectory()) {
      copyFiles(srcPath, destPath, exts);
    } else if (exts.some(ext => item.name.endsWith(ext))) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Clean dist
console.log('Cleaning dist/...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });

// 2. Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// 3. Copy HTML files to dist/renderer
console.log('Copying HTML files...');
copyFiles(path.join(SRC, 'renderer'), path.join(DIST, 'renderer'), ['.html']);

// 4. Copy CSS files to dist/renderer preserving structure
console.log('Copying CSS files...');
copyFiles(path.join(SRC, 'renderer'), path.join(DIST, 'renderer'), ['.css']);

console.log('Build complete!');
