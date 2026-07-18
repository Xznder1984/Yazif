declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

export {};
