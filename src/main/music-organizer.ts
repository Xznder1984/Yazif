import * as fs from 'fs';
import * as path from 'path';

interface MusicFile {
  filename: string;
  filepath: string;
  artist: string;
  album: string;
  title: string;
  year: string;
  track: string;
}

interface OrganizePlan {
  moves: { from: string; to: string }[];
  totalFiles: number;
  artists: string[];
}

export class MusicOrganizer {
  async scanFolder(folderPath: string): Promise<MusicFile[]> {
    const files: MusicFile[] = [];

    try {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.mp3', '.flac', '.ogg', '.wav', '.m4a', '.aac', '.wma', '.opus'].includes(ext)) {
            const filepath = path.join(folderPath, entry.name);
            const metadata = await this.readMetadata(filepath);
            files.push({
              filename: entry.name,
              filepath,
              artist: metadata.artist || 'Unknown Artist',
              album: metadata.album || 'Unknown Album',
              title: metadata.title || path.basename(entry.name, ext),
              year: metadata.year || '',
              track: metadata.track || '',
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to scan folder:', err);
    }

    return files;
  }

  async previewOrganization(folderPath: string): Promise<OrganizePlan> {
    const files = await this.scanFolder(folderPath);
    const moves: { from: string; to: string }[] = [];
    const artists = new Set<string>();

    for (const file of files) {
      const artist = this.sanitizePath(file.artist);
      const album = this.sanitizePath(file.album);
      const ext = path.extname(file.filename);

      const targetDir = path.join(folderPath, artist, album);
      const targetFile = path.join(targetDir, `${file.title}${ext}`);

      if (file.filepath !== targetFile) {
        moves.push({ from: file.filepath, to: targetFile });
        artists.add(artist);
      }
    }

    return {
      moves,
      totalFiles: files.length,
      artists: Array.from(artists),
    };
  }

  async applyOrganization(plan: OrganizePlan): Promise<{ success: boolean; moved: number; errors: string[] }> {
    let moved = 0;
    const errors: string[] = [];

    for (const move of plan.moves) {
      try {
        const dir = path.dirname(move.to);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Avoid overwriting - add suffix if exists
        let targetPath = move.to;
        if (fs.existsSync(targetPath)) {
          const ext = path.extname(targetPath);
          const base = path.basename(targetPath, ext);
          const dir = path.dirname(targetPath);
          let counter = 1;
          while (fs.existsSync(targetPath)) {
            targetPath = path.join(dir, `${base} (${counter})${ext}`);
            counter++;
          }
        }

        fs.renameSync(move.from, targetPath);
        moved++;
      } catch (err: any) {
        errors.push(`Failed to move ${path.basename(move.from)}: ${err.message}`);
      }
    }

    return { success: errors.length === 0, moved, errors };
  }

  private async readMetadata(filepath: string): Promise<Partial<MusicFile>> {
    try {
      // Use music-metadata if available, otherwise return empty
      const musicMetadata = require('music-metadata');
      const metadata = await musicMetadata.parseFile(filepath, { duration: false });
      return {
        artist: metadata.common?.artist || '',
        album: metadata.common?.album || '',
        title: metadata.common?.title || '',
        year: metadata.common?.year?.toString() || '',
        track: metadata.common?.track?.no?.toString() || '',
      };
    } catch {
      return {};
    }
  }

  private sanitizePath(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown';
  }
}
