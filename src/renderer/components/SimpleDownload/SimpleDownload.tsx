import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Dropdown } from '../common/Dropdown';
import { ProgressBar } from '../common/ProgressBar';


interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  status: 'idle' | 'downloading' | 'processing' | 'complete' | 'error';
  progress: number;
  speed: string;
  eta: string;
  filepath?: string;
  error?: string;
}

const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4 (Video)' },
  { value: 'mkv', label: 'MKV (Video)' },
  { value: 'webm', label: 'WebM (Video)' },
  { value: 'avi', label: 'AVI (Video)' },
  { value: 'mp3', label: 'MP3 (Audio)' },
  { value: 'wav', label: 'WAV (Audio)' },
  { value: 'flac', label: 'FLAC (Audio)' },
  { value: 'ogg', label: 'OGG (Audio)' },
  { value: 'm4a', label: 'M4A (Audio)' },
  { value: 'opus', label: 'Opus (Audio)' },
];

const QUALITY_OPTIONS = [
  { value: 'best', label: 'Best Quality' },
  { value: 'high', label: 'High (1080p)' },
  { value: 'medium', label: 'Medium (720p)' },
  { value: 'low', label: 'Low (480p)' },
];

const AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'opus'];

export const SimpleDownload: React.FC = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('best');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isAudioFormat = AUDIO_FORMATS.includes(format);

  const handleDownload = async () => {
    if (!url.trim()) return;

    const id = Date.now().toString();
    const newDownload: DownloadItem = {
      id,
      url: url.trim(),
      title: 'Fetching...',
      thumbnail: '',
      status: 'downloading',
      progress: 0,
      speed: '',
      eta: '',
    };

    setDownloads((prev) => [newDownload, ...prev]);
    setUrl('');
    setLoading(true);

    try {
      const info = await window.electronAPI.ytdlpGetInfo(url.trim());
      setDownloads((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: info.title, thumbnail: info.thumbnail } : d))
      );

      // Start download
      const result = await window.electronAPI.ytdlpDownload({
        url: url.trim(),
        format,
        quality,
        audioOnly: isAudioFormat,
      });

      setDownloads((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: result.success ? 'complete' : 'error',
                progress: result.success ? 100 : 0,
                filepath: result.files?.[0],
                error: result.error,
              }
            : d
        )
      );
    } catch (err: any) {
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'error', error: err.message }
            : d
        )
      );
    }

    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, filepath: string) => {
    e.dataTransfer.setData('text/uri-list', filepath);
    e.dataTransfer.setData('text/plain', filepath);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleReportError = (error: string) => {
    window.electronAPI.reportError('Download Failed', error);
  };

  const handleOpenFolder = (filepath: string) => {
    const folder = filepath.substring(0, filepath.lastIndexOf('\\') || filepath.lastIndexOf('/'));
    window.electronAPI.openFolder(folder);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      handleDownload();
    }
  };

  return (
    <div className="page">
      <div className="main-content-header">
        <h2>Quick Download</h2>
        <p>Paste a YouTube URL and hit download</p>
      </div>

      <div className="card">
        <div className="simple-download-input">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://www.youtube.com/watch?v=..."
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V10M8 10L4 6M8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          />
          <div className="simple-download-controls">
            <Dropdown
              options={FORMAT_OPTIONS}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            />
            {!isAudioFormat && (
              <Dropdown
                options={QUALITY_OPTIONS}
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              />
            )}
            <Button
              onClick={handleDownload}
              loading={loading}
              disabled={!url.trim()}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V10M8 10L4 6M8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      {downloads.length > 0 && (
        <div className="simple-downloads-list">
          <h3 className="mb-md">Downloads</h3>
          {downloads.map((dl) => (
            <div
              key={dl.id}
              className={`download-item download-${dl.status}`}
              draggable={dl.status === 'complete'}
              onDragStart={(e) => dl.filepath && handleDragStart(e, dl.filepath)}
            >
              <div className="download-item-main">
                <div className="download-item-icon">
                  {dl.status === 'complete' ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" stroke="var(--accent-success)" strokeWidth="1.5"/>
                      <path d="M6 10L9 13L14 7" stroke="var(--accent-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : dl.status === 'error' ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" stroke="var(--accent-error)" strokeWidth="1.5"/>
                      <path d="M7 7L13 13M13 7L7 13" stroke="var(--accent-error)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : dl.status === 'downloading' ? (
                    <div className="download-spinner" />
                  ) : (
                    <div className="download-spinner" />
                  )}
                </div>
                <div className="download-item-info">
                  <p className="download-item-title truncate">{dl.title}</p>
                  {dl.status === 'downloading' && (
                    <p className="text-xs text-dim">
                      {dl.speed && `${dl.speed}`}
                      {dl.eta && ` · ETA ${dl.eta}`}
                    </p>
                  )}
                  {dl.status === 'error' && (
                    <p className="text-xs text-error truncate">{dl.error}</p>
                  )}
                  {dl.status === 'complete' && (
                    <p className="text-xs text-success">Ready to drag into your editor</p>
                  )}
                </div>
                <div className="download-item-actions">
                  {dl.status === 'complete' && dl.filepath && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenFolder(dl.filepath!)}
                        title="Open folder"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 3V11C1 11.5523 1.44772 12 2 12H12C12.5523 12 13 11.5523 13 11V5C13 4.44772 12.5523 4 12 4H7L5.5 2H2C1.44772 2 1 2.44772 1 3Z" stroke="currentColor" strokeWidth="1.2"/>
                        </svg>
                      </Button>
                      <span className="drag-hint text-xs text-dim" title="Drag me into CapCut or your editor!">
                        ⤓ Drag
                      </span>
                    </>
                  )}
                  {dl.status === 'error' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => dl.error && handleReportError(dl.error)}
                    >
                      Report
                    </Button>
                  )}
                </div>
              </div>
              {(dl.status === 'downloading' || dl.status === 'processing') && (
                <ProgressBar value={dl.progress} size="sm" showPercent={false} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
