import { execFile, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { EventEmitter } from 'events';
import { NvidiaAI } from './nvidia-ai';

const YTDLP_BIN = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const FFMPEG_BIN = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';

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

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      execFile(this.ytdlpPath, ['--version'], (error) => {
        resolve(!error);
      });
    });
  }

  async ensureAvailable(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      console.warn('yt-dlp not found in PATH. Please install yt-dlp.');
    }
  }

  async getVideoInfo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      execFile(
        this.ytdlpPath,
        [
          '--dump-json',
          '--no-playlist',
          '--no-warnings',
          url,
        ],
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

    return new Promise(async (resolve, reject) => {
      try {
        // Get video info first
        const info = await this.getVideoInfo(options.url);

        // Determine output directory
        let outputDir = options.downloadPath;

        if (options.separateFolders && options.nvidiaApiKey) {
          // Use AI to classify media type
          try {
            const classification = await this.nvidiaAI.classifyMediaType(
              options.nvidiaApiKey,
              info.title,
              info.description
            );
            const subfolder = classification.type === 'audio' ? 'Audio' : 'Video';
            outputDir = path.join(options.downloadPath, subfolder);
          } catch {
            // Default to based on format
            outputDir = options.audioOnly
              ? path.join(options.downloadPath, 'Audio')
              : path.join(options.downloadPath, 'Video');
          }
        } else if (options.separateFolders) {
          outputDir = options.audioOnly
            ? path.join(options.downloadPath, 'Audio')
            : path.join(options.downloadPath, 'Video');
        }

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
      }

        // AI rename
        let filename = this.sanitizeFilename(info.title);
        if (options.nvidiaApiKey) {
          try {
            const renamed = await this.nvidiaAI.suggestName(
              options.nvidiaApiKey,
              info.title,
              info.description
            );
            if (renamed.renamed && renamed.suggestedName) {
              filename = this.sanitizeFilename(renamed.suggestedName);
            }
          } catch {
            // Use original title
          }
        }

        const outputTemplate = path.join(outputDir, `${filename}.%(ext)s`);

        const args = this.buildArgs(options, outputTemplate);

        const proc = spawn(this.ytdlpPath, args, { shell: true });
        this.activeProcesses.set(downloadId, proc);

        let stderrData = '';

        proc.stdout?.on('data', (data: Buffer) => {
          const line = data.toString();
          const progress = this.parseProgress(line);
          if (progress) {
            this.emit('progress', { downloadId, ...progress });
          }
        });

        proc.stderr?.on('data', (data: Buffer) => {
          stderrData += data.toString();
          const progress = this.parseProgress(data.toString());
          if (progress) {
            this.emit('progress', { downloadId, ...progress });
          }
        });

        proc.on('close', (code) => {
          this.activeProcesses.delete(downloadId);

          if (code === 0) {
            // Find the downloaded file
            const files = this.findDownloadedFiles(outputDir, filename);
            this.emit('progress', {
              downloadId,
              percent: '100%',
              speed: '',
              eta: '',
              filename,
              status: 'complete',
            });
            resolve({ success: true, files });
          } else {
            const errorMsg = stderrData || `yt-dlp exited with code ${code}`;
            this.emit('progress', {
              downloadId,
              percent: '0%',
              speed: '',
              eta: '',
              filename,
              status: 'error',
            });
            resolve({ success: false, files: [], error: errorMsg });
          }
        });

        proc.on('error', (err) => {
          this.activeProcesses.delete(downloadId);
          this.emit('progress', {
            downloadId,
            percent: '0%',
            speed: '',
            eta: '',
            filename,
            status: 'error',
          });
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
    const args: string[] = [
      '--no-playlist',
      '--no-warnings',
      '--newline',
      '--progress',
    ];

    if (options.audioOnly) {
      args.push('-x'); // Extract audio
      args.push('--audio-format', options.format);
      args.push('--audio-quality', this.mapAudioQuality(options.quality));

      // Best audio format selection
      args.push('-f', 'bestaudio/best');
    } else {
      // Video format selection
      const formatSelector = this.getFormatSelector(options.format, options.quality);
      args.push('-f', formatSelector);
      args.push('--merge-output-format', options.format);
    }

    // Output template
    args.push('-o', outputTemplate);

    // Post-processing with ffmpeg
    args.push('--ffmpeg-location', path.dirname(this.findFfmpeg()));

    // Apply advanced options
    if (options.advancedOptions) {
      for (const [key, value] of Object.entries(options.advancedOptions)) {
        if (value === '' || value === 'true') {
          args.push(`--${key}`);
        } else if (value !== 'false' && value !== '') {
          args.push(`--${key}`, value);
        }
      }
    }

    args.push(options.url);
    return args;
  }

  private getFormatSelector(format: string, quality: string): string {
    const qualityMap: Record<string, string> = {
      best: 'bestvideo[ext=%format%]+bestaudio[ext=m4a]/best[ext=%format%]/best',
      high: 'bestvideo[height<=1080][ext=%format%]+bestaudio[ext=m4a]/best[height<=1080]',
      medium: 'bestvideo[height<=720][ext=%format%]+bestaudio[ext=m4a]/best[height<=720]',
      low: 'bestvideo[height<=480][ext=%format%]+bestaudio[ext=m4a]/best[height<=480]',
    };

    const template = qualityMap[quality] || qualityMap.best;
    return template.replace(/%format%/g, format);
  }

  private mapAudioQuality(quality: string): string {
    const map: Record<string, string> = {
      best: '0',
      high: '2',
      medium: '5',
      low: '9',
    };
    return map[quality] || '0';
  }

  private parseProgress(line: string): DownloadProgress | null {
    // Parse yt-dlp progress output
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

    if (line.includes('[Merger]') || line.includes('Merging') || line.includes('Post-processing')) {
      return {
        percent: '100%',
        speed: '',
        eta: '',
        filename: '',
        status: 'processing',
      };
    }

    return null;
  }

  private findDownloadedFiles(dir: string, baseFilename: string): string[] {
    try {
      const files = fs.readdirSync(dir);
      return files
        .filter(f => f.startsWith(baseFilename))
        .map(f => path.join(dir, f));
    } catch {
      return [];
    }
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  private findFfmpeg(): string {
    // Check common locations
    const paths = [
      'ffmpeg',
      'ffmpeg.exe',
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      '/usr/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
    ];

    for (const p of paths) {
      try {
        require('child_process').execSync(`"${p}" -version`, { stdio: 'ignore', timeout: 5000 });
        return p;
      } catch {
        // Continue
      }
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
