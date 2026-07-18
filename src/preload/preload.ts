import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getConfig: () => Promise<any>;
  saveConfig: (config: any) => Promise<any>;
  isSetupComplete: () => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  ytdlpCheck: () => Promise<boolean>;
  ytdlpDownload: (options: any) => Promise<any>;
  ytdlpGetFormats: (url: string) => Promise<any>;
  ytdlpGetInfo: (url: string) => Promise<any>;
  nvidiaRename: (title: string, description: string) => Promise<any>;
  nvidiaClassify: (title: string, description: string) => Promise<any>;
  nvidiaTestKey: (apiKey: string) => Promise<any>;
  organizerScan: () => Promise<any>;
  organizerApply: (plan: any) => Promise<any>;
  organizerPreview: (folder?: string) => Promise<any>;
  reportError: (errorName: string, reason: string) => Promise<any>;
  openExternal: (url: string) => Promise<void>;
  openFolder: (folderPath: string) => Promise<void>;
  getDownloadsPath: () => Promise<string>;
  getFilePath: (filename: string) => Promise<string>;
  onNavigate: (callback: (page: string) => void) => void;
  onShowAbout: (callback: () => void) => void;
}

const api: ElectronAPI = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  isSetupComplete: () => ipcRenderer.invoke('is-setup-complete'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  ytdlpCheck: () => ipcRenderer.invoke('ytdlp-check'),
  ytdlpDownload: (options) => ipcRenderer.invoke('ytdlp-download', options),
  ytdlpGetFormats: (url) => ipcRenderer.invoke('ytdlp-get-formats', url),
  ytdlpGetInfo: (url) => ipcRenderer.invoke('ytdlp-get-info', url),
  nvidiaRename: (title, description) => ipcRenderer.invoke('nvidia-rename', title, description),
  nvidiaClassify: (title, description) => ipcRenderer.invoke('nvidia-classify', title, description),
  nvidiaTestKey: (apiKey) => ipcRenderer.invoke('nvidia-test-key', apiKey),
  organizerScan: () => ipcRenderer.invoke('organizer-scan'),
  organizerApply: (plan) => ipcRenderer.invoke('organizer-apply', plan),
  organizerPreview: (folder) => ipcRenderer.invoke('organizer-preview', folder),
  reportError: (errorName, reason) => ipcRenderer.invoke('report-error', errorName, reason),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  getDownloadsPath: () => ipcRenderer.invoke('get-downloads-path'),
  getFilePath: (filename) => ipcRenderer.invoke('get-file-path', filename),
  onNavigate: (callback) => ipcRenderer.on('navigate', (_event, page) => callback(page)),
  onShowAbout: (callback) => ipcRenderer.on('show-about', () => callback()),
};

contextBridge.exposeInMainWorld('electronAPI', api);
