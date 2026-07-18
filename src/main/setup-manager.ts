import * as path from 'path';

export class SetupManager {
  getRequiredSteps(): string[] {
    return [
      'select_download_path',
      'select_audio_folder',
      'select_video_folder',
      'configure_api_key',
    ];
  }

  getWelcomeMessage(): string {
    return 'Welcome to Yazif! Let\'s set things up.';
  }

  getDefaultAudioPath(basePath: string): string {
    return path.join(basePath, 'Audio');
  }

  getDefaultVideoPath(basePath: string): string {
    return path.join(basePath, 'Video');
  }
}
