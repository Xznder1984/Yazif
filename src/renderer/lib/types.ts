export interface AppConfig {
  setupComplete: boolean;
  downloadPath: string;
  separateFolders: boolean;
  nvidiaApiKey: string;
  autoOrganize: boolean;
  lastFormat: string;
  lastQuality: string;
}

export interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  formats: FormatInfo[];
}

export interface FormatInfo {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number;
  vcodec: string;
  acodec: string;
  filesize: string;
}

export interface DownloadResult {
  success: boolean;
  files: string[];
  error?: string;
}

export interface RenameResult {
  renamed: boolean;
  suggestedName: string;
  originalName: string;
}

export interface ClassificationResult {
  type: 'audio' | 'video';
  confidence: number;
}

export interface OrganizePlan {
  moves: { from: string; to: string }[];
  totalFiles: number;
  artists: string[];
}

export interface OrganizeResult {
  success: boolean;
  moved: number;
  errors: string[];
}

export type PageId = 'search' | 'simple' | 'advanced' | 'music' | 'downloads' | 'settings';

export interface DownloadItem {
  id: string;
  title: string;
  filepath: string;
  format: string;
  timestamp: number;
}
