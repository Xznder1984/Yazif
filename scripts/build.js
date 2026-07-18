const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFileSync(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

// 1. Clean dist
console.log('Cleaning dist/...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });

// 2. Compile main + preload with tsc (individual files)
console.log('Compiling main process + preload...');
const tsFiles = [];
for (const dir of ['main', 'preload']) {
  const dirPath = path.join(SRC, dir);
  if (fs.existsSync(dirPath)) {
    for (const f of fs.readdirSync(dirPath)) {
      if (f.endsWith('.ts')) tsFiles.push(path.join('src', dir, f));
    }
  }
}

for (const f of tsFiles) {
  try {
    execSync(`npx tsc "${f}" --outDir dist --rootDir src --target ES2022 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --resolveJsonModule --declaration false --sourceMap false`, {
      stdio: 'pipe',
      cwd: ROOT,
    });
    console.log(`  Compiled: ${f}`);
  } catch (e) {
    console.error(`  FAILED: ${f}`);
    if (e.stderr) console.error(e.stderr.toString());
  }
}

// 3. Bundle renderer with esbuild
console.log('\nBundling renderer with esbuild...');
const esbuild = require('esbuild');
try {
  esbuild.buildSync({
    entryPoints: [path.join(SRC, 'renderer', 'index.tsx')],
    bundle: true,
    outfile: path.join(DIST, 'renderer', 'index.js'),
    format: 'iife',
    platform: 'browser',
    target: 'chrome120',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    minify: false,
    sourcemap: false,
  });
  console.log('  Renderer bundled successfully');
} catch (e) {
  console.error('  Renderer bundle FAILED:', e.message);
  process.exit(1);
}

// 4. Copy HTML
console.log('Copying HTML...');
copyFileSync(
  path.join(SRC, 'renderer', 'index.html'),
  path.join(DIST, 'renderer', 'index.html')
);

// 5. Copy icon
console.log('Copying assets...');
mkdirp(path.join(DIST, 'assets'));
const iconIco = path.join(ROOT, 'website', 'assets', 'icon.ico');
if (fs.existsSync(iconIco)) {
  fs.copyFileSync(iconIco, path.join(DIST, 'assets', 'icon.ico'));
}

console.log('\nBuild complete!');
