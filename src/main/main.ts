import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, Menu, Tray } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { YtdlpManager } from './ytdlp';
import { NvidiaAI } from './nvidia-ai';
import { MusicOrganizer } from './music-organizer';
import { ErrorReporter } from './error-reporter';
import { SetupManager } from './setup-manager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let ytdlp: YtdlpManager;
let nvidiaAI: NvidiaAI;
let musicOrganizer: MusicOrganizer;
let setupManager: SetupManager;

const CONFIG_DIR = path.join(app.getPath('userData'), 'yazif-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const ENV_FILE = path.join(app.getAppPath(), '.env');

interface AppConfig {
  setupComplete: boolean;
  downloadPath: string;
  separateFolders: boolean;
  nvidiaApiKey: string;
  autoOrganize: boolean;
  lastFormat: string;
  lastQuality: string;
}

function getDefaultConfig(): AppConfig {
  return {
    setupComplete: false,
    downloadPath: path.join(app.getPath('downloads'), 'Yazif'),
    separateFolders: true,
    nvidiaApiKey: '',
    autoOrganize: true,
    lastFormat: 'mp4',
    lastQuality: 'best',
  };
}

function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...getDefaultConfig(), ...JSON.parse(data) };
    }
  } catch {
    // Fall through
  }

  // Try loading from .env
  const config = getDefaultConfig();
  try {
    if (fs.existsSync(ENV_FILE)) {
      const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
      const keyMatch = envContent.match(/NVIDIA_API_KEY=(.+)/);
      if (keyMatch && keyMatch[1].trim()) {
        config.nvidiaApiKey = keyMatch[1].trim();
      }
      const sepMatch = envContent.match(/SEPARATE_FOLDERS=(.+)/);
      if (sepMatch) {
        config.separateFolders = sepMatch[1].trim() === 'true';
      }
    }
  } catch {
    // Fall through
  }

  return config;
}

function saveConfig(config: AppConfig): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

    // Also update .env file
    const envLines: string[] = [
      '# Yazif Configuration',
      '# NVIDIA NIM API Key (required for AI video naming)',
      `NVIDIA_API_KEY=${config.nvidiaApiKey}`,
      '',
      '# Separate audio/video folders (true = AI sorts into audio/video subfolders)',
      `SEPARATE_FOLDERS=${config.separateFolders}`,
    ];
    fs.writeFileSync(ENV_FILE, envLines.join('\n'), 'utf-8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    maxWidth: 1200,
    maxHeight: 800,
    resizable: false,
    title: 'Yazif',
    backgroundColor: '#1e1e2e',
    titleBarStyle: 'default',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Build menu
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('navigate', 'settings') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Yazif',
          click: () => mainWindow?.webContents.send('show-about'),
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('mailto:xander.razeralbarr@gmail.com?subject=Yazif%20Bug%20Report'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupIPC(): void {
  const config = loadConfig();

  // Config & Setup
  ipcMain.handle('get-config', () => loadConfig());
  ipcMain.handle('save-config', (_event, newConfig: Partial<AppConfig>) => {
    const current = loadConfig();
    const updated = { ...current, ...newConfig };
    saveConfig(updated);
    return updated;
  });

  ipcMain.handle('is-setup-complete', () => loadConfig().setupComplete);

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Location',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // yt-dlp operations
  ipcMain.handle('ytdlp-check', async () => ytdlp.isAvailable());
  ipcMain.handle('ytdlp-version', async () => ytdlp.getVersion());
  ipcMain.handle('ytdlp-install', async () => ytdlp.installYtdlp());
  ipcMain.handle('ytdlp-update', async () => ytdlp.checkAndUpdate());

  // Forward yt-dlp status events to renderer
  ytdlp.on('status', (msg: string) => {
    mainWindow?.webContents.send('ytdlp-status', msg);
  });

  ipcMain.handle('ytdlp-download', async (_event, options: DownloadOptions) => {
    const cfg = loadConfig();
    return ytdlp.download({
      ...options,
      downloadPath: cfg.downloadPath,
      separateFolders: cfg.separateFolders,
      nvidiaApiKey: cfg.nvidiaApiKey,
    });
  });

  ipcMain.handle('ytdlp-get-formats', async (_event, url: string) => {
    return ytdlp.getFormats(url);
  });

  ipcMain.handle('ytdlp-get-info', async (_event, url: string) => {
    return ytdlp.getVideoInfo(url);
  });

  ipcMain.handle('ytdlp-search', async (_event, query: string) => {
    return ytdlp.search(query);
  });

  // NVIDIA AI
  ipcMain.handle('nvidia-rename', async (_event, title: string, description: string) => {
    const cfg = loadConfig();
    if (!cfg.nvidiaApiKey) return { renamed: false, reason: 'No API key configured' };
    return nvidiaAI.suggestName(cfg.nvidiaApiKey, title, description);
  });

  ipcMain.handle('nvidia-classify', async (_event, title: string, description: string) => {
    const cfg = loadConfig();
    if (!cfg.nvidiaApiKey) return { type: 'video' };
    return nvidiaAI.classifyMediaType(cfg.nvidiaApiKey, title, description);
  });

  ipcMain.handle('nvidia-test-key', async (_event, apiKey: string) => {
    return nvidiaAI.testApiKey(apiKey);
  });

  // Music Organizer
  ipcMain.handle('organizer-scan', async () => {
    const cfg = loadConfig();
    return musicOrganizer.scanFolder(cfg.downloadPath);
  });

  ipcMain.handle('organizer-apply', async (_event, plan: any) => {
    return musicOrganizer.applyOrganization(plan);
  });

  ipcMain.handle('organizer-preview', async (_event, folder: string) => {
    const cfg = loadConfig();
    return musicOrganizer.previewOrganization(folder || cfg.downloadPath);
  });

  // Error Reporter
  ipcMain.handle('report-error', async (_event, errorName: string, reason: string) => {
    return ErrorReporter.sendReport(errorName, reason);
  });

  // Open external links
  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  ipcMain.handle('open-folder', async (_event, folderPath: string) => {
    await shell.openPath(folderPath);
  });

  ipcMain.handle('get-downloads-path', () => {
    return loadConfig().downloadPath;
  });

  // Drag & Drop file paths
  ipcMain.handle('get-file-path', (_event, filename: string) => {
    const cfg = loadConfig();
    return path.join(cfg.downloadPath, filename);
  });
}

interface DownloadOptions {
  url: string;
  format: string;
  quality: string;
  audioOnly: boolean;
  outputTemplate?: string;
  advancedOptions?: Record<string, string>;
}

app.whenReady().then(() => {
  ytdlp = new YtdlpManager();
  nvidiaAI = new NvidiaAI();
  musicOrganizer = new MusicOrganizer();
  setupManager = new SetupManager();

  createWindow();
  setupIPC();

  // Ensure yt-dlp is available
  ytdlp.ensureAvailable().catch(err => {
    console.error('yt-dlp check failed:', err);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
