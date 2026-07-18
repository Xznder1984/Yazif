import { execFile, execSync, exec, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as os from 'os';
import { EventEmitter } from 'events';
import { NvidiaAI } from './nvidia-ai';

const IS_WIN = process.platform === 'win32';
const YTDLP_BIN = IS_WIN ? 'yt-dlp.exe' : 'yt-dlp';
const YTDLP_LOCAL_DIR = path.join(os.homedir(), '.yazif');
const YTDLP_LOCAL_BIN = path.join(YTDLP_LOCAL_DIR, YTDLP_BIN);

interface DownloadProgress {
  percent: string;
  speed: string;
  eta: string;
  filename: string;
  status: 'downloading' | 'processing' | 'complete' | 'error';
}

interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  formats: FormatInfo[];
}

interface FormatInfo {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number;
  vcodec: string;
  acodec: string;
  filesize: string;
}

export class YtdlpManager extends EventEmitter {
  private ytdlpPath: string = YTDLP_BIN;
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private nvidiaAI: NvidiaAI = new NvidiaAI();
  private ready: boolean = false;

  private findYtdlp(): string {
    // Check local first
    if (fs.existsSync(YTDLP_LOCAL_BIN)) return YTDLP_LOCAL_BIN;
    // Then check system PATH
    return YTDLP_BIN;
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      execFile(this.findYtdlp(), ['--version'], (error) => {
        resolve(!error);
      });
    });
  }

  async getVersion(): Promise<string> {
    return new Promise((resolve) => {
      execFile(this.findYtdlp(), ['--version'], (error, stdout) => {
        resolve(error ? 'not installed' : stdout.toString().trim());
      });
    });
  }

  async ensureAvailable(): Promise<void> {
    this.ytdlpPath = this.findYtdlp();
    const available = await this.isAvailable();
    if (!available) {
      console.log('yt-dlp not found, installing...');
      await this.installYtdlp();
    }
    this.ready = true;

    // Auto-update check (non-blocking)
    this.checkAndUpdate().catch(() => {});
  }

  async installYtdlp(): Promise<boolean> {
    this.emit('status', 'Installing yt-dlp...');

    if (IS_WIN) {
      // Try choco first
      if (await this.commandExists('choco')) {
        try {
          execSync('choco install yt-dlp -y', { stdio: 'pipe', timeout: 120000 });
          this.ytdlpPath = YTDLP_BIN;
          this.emit('status', 'yt-dlp installed via Chocolatey');
          return true;
        } catch {}
      }

      // Try winget
      if (await this.commandExists('winget')) {
        try {
          execSync('winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements', {
            stdio: 'pipe',
            timeout: 120000,
          });
          this.ytdlpPath = YTDLP_BIN;
          this.emit('status', 'yt-dlp installed via winget');
          return true;
        } catch {}
      }
    } else {
      // Linux/macOS: try pip
      if (await this.commandExists('pip3') || await this.commandExists('pip')) {
        try {
          const pip = (await this.commandExists('pip3')) ? 'pip3' : 'pip';
          execSync(`${pip} install -U yt-dlp`, { stdio: 'pipe', timeout: 120000 });
          this.ytdlpPath = YTDLP_BIN;
          this.emit('status', 'yt-dlp installed via pip');
          return true;
        } catch {}
      }
    }

    // Fallback: download binary from GitHub
    return await this.downloadYtdlpBinary();
  }

  private async downloadYtdlpBinary(): Promise<boolean> {
    this.emit('status', 'Downloading yt-dlp from GitHub...');

    if (!fs.existsSync(YTDLP_LOCAL_DIR)) {
      fs.mkdirSync(YTDLP_LOCAL_DIR, { recursive: true });
    }

    const url = IS_WIN
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    return new Promise((resolve) => {
      const followRedirect = (redirectUrl: string) => {
        https.get(redirectUrl, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            followRedirect(res.headers.location!);
            return;
          }

          if (res.statusCode !== 200) {
            console.error(`Failed to download yt-dlp: HTTP ${res.statusCode}`);
            resolve(false);
            return;
          }

          const file = fs.createWriteStream(YTDLP_LOCAL_BIN);
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            if (!IS_WIN) {
              fs.chmodSync(YTDLP_LOCAL_BIN, 0o755);
            }
            this.ytdlpPath = YTDLP_LOCAL_BIN;
            this.emit('status', 'yt-dlp installed successfully');
            resolve(true);
          });
          file.on('error', () => {
            resolve(false);
          });
        }).on('error', () => resolve(false));
      };

      followRedirect(url);
    });
  }

  async checkAndUpdate(): Promise<void> {
    try {
      const current = await this.getVersion();
      if (current === 'not installed') return;

      // Check latest version from GitHub
      const latest = await this.getLatestVersion();
      if (!latest) return;

      if (current !== latest) {
        this.emit('status', `Updating yt-dlp ${current} → ${latest}...`);
        await this.downloadYtdlpBinary();
        this.emit('status', `yt-dlp updated to ${latest}`);
      }
    } catch {}
  }

  private async getLatestVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      https.get(
        'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest',
        { headers: { 'User-Agent': 'Yazif/1.0' } },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve(data.tag_name || null);
            } catch {
              resolve(null);
            }
          });
        }
      ).on('error', () => resolve(null));
    });
  }

  private async commandExists(cmd: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(IS_WIN ? `where ${cmd}` : `which ${cmd}`, (error) => {
        resolve(!error);
      });
    });
  }

  async getVideoInfo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      execFile(
        this.ytdlpPath,
        ['--dump-json', '--no-playlist', '--no-warnings', url],
        { timeout: 30000 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Failed to get video info: ${stderr || error.message}`));
            return;
          }
          try {
            const data = JSON.parse(stdout.toString());
            resolve({
              title: data.title || 'Unknown',
              description: data.description || '',
              duration: data.duration || 0,
              thumbnail: data.thumbnail || '',
              uploader: data.uploader || 'Unknown',
              formats: (data.formats || []).map((f: any) => ({
                formatId: f.format_id || '',
                ext: f.ext || '',
                resolution: f.resolution || 'audio only',
                fps: f.fps || 0,
                vcodec: f.vcodec || 'none',
                acodec: f.acodec || 'none',
                filesize: f.filesize ? this.formatBytes(f.filesize) : 'unknown',
              })),
            });
          } catch {
            reject(new Error('Failed to parse video info'));
          }
        }
      );
    });
  }

  async getFormats(url: string): Promise<FormatInfo[]> {
    const info = await this.getVideoInfo(url);
    return info.formats;
  }

  async search(query: string, maxResults: number = 10): Promise<any[]> {
    return new Promise((resolve) => {
      execFile(
        this.ytdlpPath,
        [
          `ytsearch${maxResults}:${query}`,
          '--dump-json',
          '--no-playlist',
          '--no-warnings',
          '--flat-playlist',
        ],
        { timeout: 30000 },
        (error, stdout) => {
          if (error) {
            resolve([]);
            return;
          }
          try {
            const lines = stdout.toString().trim().split('\n').filter(Boolean);
            const results = lines.map((line) => {
              const data = JSON.parse(line);
              return {
                id: data.id || '',
                title: data.title || 'Unknown',
                url: data.url || `https://www.youtube.com/watch?v=${data.id}`,
                thumbnail: data.thumbnails?.[0]?.url || data.thumbnail || '',
                duration: data.duration || 0,
                uploader: data.uploader || data.channel || 'Unknown',
                viewCount: data.view_count || 0,
              };
            });
            resolve(results);
          } catch {
            resolve([]);
          }
        }
      );
    });
  }

  async download(options: {
    url: string;
    format: string;
    quality: string;
    audioOnly: boolean;
    outputTemplate?: string;
    advancedOptions?: Record<string, string>;
    downloadPath: string;
    separateFolders: boolean;
    nvidiaApiKey: string;
  }): Promise<{ success: boolean; files: string[]; error?: string }> {
    const downloadId = Date.now().toString();

    return new Promise(async (resolve) => {
      try {
        const info = await this.getVideoInfo(options.url);

        let outputDir = options.downloadPath;

        if (options.separateFolders && options.nvidiaApiKey) {
          try {
            const classification = await this.nvidiaAI.classifyMediaType(
              options.nvidiaApiKey, info.title, info.description
            );
            const subfolder = classification.type === 'audio' ? 'Audio' : 'Video';
            outputDir = path.join(options.downloadPath, subfolder);
          } catch {
            outputDir = options.audioOnly
              ? path.join(options.downloadPath, 'Audio')
              : path.join(options.downloadPath, 'Video');
          }
        } else if (options.separateFolders) {
          outputDir = options.audioOnly
            ? path.join(options.downloadPath, 'Audio')
            : path.join(options.downloadPath, 'Video');
        }

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        let filename = this.sanitizeFilename(info.title);
        if (options.nvidiaApiKey) {
          try {
            const renamed = await this.nvidiaAI.suggestName(
              options.nvidiaApiKey, info.title, info.description
            );
            if (renamed.renamed && renamed.suggestedName) {
              filename = this.sanitizeFilename(renamed.suggestedName);
            }
          } catch {}
        }

        const outputTemplate = path.join(outputDir, `${filename}.%(ext)s`);
        const args = this.buildArgs(options, outputTemplate);

        const proc = spawn(this.ytdlpPath, args, { shell: true });
        this.activeProcesses.set(downloadId, proc);

        let stderrData = '';

        proc.stdout?.on('data', (data: Buffer) => {
          const progress = this.parseProgress(data.toString());
          if (progress) this.emit('progress', { downloadId, ...progress });
        });

        proc.stderr?.on('data', (data: Buffer) => {
          stderrData += data.toString();
          const progress = this.parseProgress(data.toString());
          if (progress) this.emit('progress', { downloadId, ...progress });
        });

        proc.on('close', (code) => {
          this.activeProcesses.delete(downloadId);
          if (code === 0) {
            const files = this.findDownloadedFiles(outputDir, filename);
            this.emit('progress', {
              downloadId, percent: '100%', speed: '', eta: '',
              filename, status: 'complete',
            });
            resolve({ success: true, files });
          } else {
            this.emit('progress', {
              downloadId, percent: '0%', speed: '', eta: '',
              filename, status: 'error',
            });
            resolve({ success: false, files: [], error: stderrData || `yt-dlp exited with code ${code}` });
          }
        });

        proc.on('error', (err) => {
          this.activeProcesses.delete(downloadId);
          resolve({ success: false, files: [], error: err.message });
        });
      } catch (err: any) {
        resolve({ success: false, files: [], error: err.message });
      }
    });
  }

  private buildArgs(options: {
    url: string;
    format: string;
    quality: string;
    audioOnly: boolean;
    advancedOptions?: Record<string, string>;
  }, outputTemplate: string): string[] {
    const args = ['--no-playlist', '--no-warnings', '--newline', '--progress'];

    if (options.audioOnly) {
      args.push('-x', '--audio-format', options.format, '--audio-quality', this.mapAudioQuality(options.quality));
      args.push('-f', 'bestaudio/best');
    } else {
      args.push('-f', this.getFormatSelector(options.format, options.quality));
      args.push('--merge-output-format', options.format);
    }

    args.push('-o', outputTemplate);
    args.push('--ffmpeg-location', path.dirname(this.findFfmpeg()));

    if (options.advancedOptions) {
      for (const [key, value] of Object.entries(options.advancedOptions)) {
        if (value === '' || value === 'true') args.push(`--${key}`);
        else if (value !== 'false' && value !== '') args.push(`--${key}`, value);
      }
    }

    args.push(options.url);
    return args;
  }

  private getFormatSelector(format: string, quality: string): string {
    const map: Record<string, string> = {
      best: 'bestvideo+bestaudio/best',
      high: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
      medium: 'bestvideo[height<=720]+bestaudio/best[height<=720]',
      low: 'bestvideo[height<=480]+bestaudio/best[height<=480]',
    };
    return map[quality] || map.best;
  }

  private mapAudioQuality(quality: string): string {
    return ({ best: '0', high: '2', medium: '5', low: '9' })[quality] || '0';
  }

  private parseProgress(line: string): DownloadProgress | null {
    const percentMatch = line.match(/(\d+\.?\d*)%/);
    const speedMatch = line.match(/at\s+(\S+\/s)/);
    const etaMatch = line.match(/ETA\s+(\S+)/);

    if (percentMatch) {
      return {
        percent: percentMatch[1] + '%',
        speed: speedMatch ? speedMatch[1] : '',
        eta: etaMatch ? etaMatch[1] : '',
        filename: '',
        status: 'downloading',
      };
    }

    if (line.includes('[Merger]') || line.includes('Post-processing')) {
      return { percent: '100%', speed: '', eta: '', filename: '', status: 'processing' };
    }

    return null;
  }

  private findDownloadedFiles(dir: string, baseFilename: string): string[] {
    try {
      return fs.readdirSync(dir)
        .filter(f => f.startsWith(baseFilename))
        .map(f => path.join(dir, f));
    } catch { return []; }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  private findFfmpeg(): string {
    for (const p of ['ffmpeg', 'ffmpeg.exe', 'C:\\ffmpeg\\bin\\ffmpeg.exe', '/usr/bin/ffmpeg']) {
      try {
        require('child_process').execSync(`"${p}" -version`, { stdio: 'ignore', timeout: 5000 });
        return p;
      } catch {}
    }
    return 'ffmpeg';
  }

  cancelDownload(downloadId: string): void {
    const proc = this.activeProcesses.get(downloadId);
    if (proc) {
      proc.kill('SIGTERM');
      this.activeProcesses.delete(downloadId);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
