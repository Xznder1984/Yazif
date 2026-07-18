import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Dropdown } from '../common/Dropdown';
import { ProgressBar } from '../common/ProgressBar';
import './AdvancedDownload.css';


const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' },
  { value: 'avi', label: 'AVI' },
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'flac', label: 'FLAC' },
  { value: 'ogg', label: 'OGG' },
  { value: 'm4a', label: 'M4A' },
  { value: 'opus', label: 'Opus' },
];

interface AdvancedOptions {
  format: string;
  quality: string;
  audioOnly: boolean;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  writeSubtitles: boolean;
  subLang: string;
  writeDescription: boolean;
  writeThumbnail: boolean;
  playlist: boolean;
  outputTemplate: string;
  proxy: string;
  cookieFile: string;
  maxFileSize: string;
  fps: string;
  customArgs: string;
}

interface DownloadResult {
  id: string;
  title: string;
  status: 'complete' | 'error';
  filepath?: string;
  error?: string;
}

export const AdvancedDownload: React.FC = () => {
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DownloadResult[]>([]);
  const [options, setOptions] = useState<AdvancedOptions>({
    format: 'mp4',
    quality: 'best',
    audioOnly: false,
    embedThumbnail: true,
    embedMetadata: true,
    writeSubtitles: false,
    subLang: 'en',
    writeDescription: false,
    writeThumbnail: false,
    playlist: false,
    outputTemplate: '',
    proxy: '',
    cookieFile: '',
    maxFileSize: '',
    fps: '',
    customArgs: '',
  });

  const updateOption = <K extends keyof AdvancedOptions>(key: K, value: AdvancedOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const isAudioFormat = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'opus'].includes(options.format);

  const buildCommandPreview = (): string => {
    const parts = ['yt-dlp'];

    if (options.audioOnly) {
      parts.push('-x');
      parts.push(`--audio-format ${options.format}`);
    } else {
      parts.push(`-f "bestvideo+bestaudio"`);
      parts.push(`--merge-output-format ${options.format}`);
    }

    if (options.embedThumbnail) parts.push('--embed-thumbnail');
    if (options.embedMetadata) parts.push('--embed-metadata');
    if (options.writeSubtitles) parts.push(`--write-subs --sub-lang ${options.subLang}`);
    if (options.writeDescription) parts.push('--write-description');
    if (options.writeThumbnail) parts.push('--write-thumbnail');
    if (options.playlist) {
      // Remove --no-playlist
    } else {
      parts.push('--no-playlist');
    }
    if (options.proxy) parts.push(`--proxy "${options.proxy}"`);
    if (options.cookieFile) parts.push(`--cookies "${options.cookieFile}"`);
    if (options.maxFileSize) parts.push(`--max-filesize ${options.maxFileSize}`);
    if (options.fps) parts.push(`-f "fps<=${options.fps}"`);
    if (options.customArgs) parts.push(options.customArgs);

    parts.push('<URL>');

    return parts.join(' \\\n  ');
  };

  const handleDownload = async () => {
    if (!url.trim()) return;
    setLoading(true);

    const id = Date.now().toString();
    try {
      const result = await window.electronAPI.ytdlpDownload({
        url: url.trim(),
        format: options.format,
        quality: options.quality,
        audioOnly: isAudioFormat || options.audioOnly,
        advancedOptions: {
          'embed-thumbnail': options.embedThumbnail ? 'true' : 'false',
          'embed-metadata': options.embedMetadata ? 'true' : 'false',
          ...(options.writeSubtitles && { 'write-subs': 'true', 'sub-lang': options.subLang }),
          ...(options.writeDescription && { 'write-description': 'true' }),
          ...(options.writeThumbnail && { 'write-thumbnail': 'true' }),
          ...(options.proxy && { proxy: options.proxy }),
          ...(options.cookieFile && { cookies: options.cookieFile }),
          ...(options.maxFileSize && { 'max-filesize': options.maxFileSize }),
          ...(options.playlist && { 'yes-playlist': 'true' }),
        },
      });

      setResults((prev) => [
        {
          id,
          title: result.files?.[0]?.split('\\').pop() || 'Download',
          status: result.success ? 'complete' : 'error',
          filepath: result.files?.[0],
          error: result.error,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setResults((prev) => [
        { id, title: 'Failed', status: 'error', error: err.message },
        ...prev,
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim()) {
      handleDownload();
    }
  };

  return (
    <div className="page">
      <div className="main-content-header">
        <h2>Advanced Download</h2>
        <p>Full control over yt-dlp options</p>
      </div>

      <div className="card">
        <div className="adv-input-section">
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
          <div className="adv-main-controls">
            <Dropdown
              label="Format"
              options={FORMAT_OPTIONS}
              value={options.format}
              onChange={(e) => updateOption('format', e.target.value)}
            />
            <Dropdown
              label="Quality"
              options={[
                { value: 'best', label: 'Best' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              value={options.quality}
              onChange={(e) => updateOption('quality', e.target.value)}
            />
            <Button
              onClick={handleDownload}
              loading={loading}
              disabled={!url.trim()}
              className="adv-download-btn"
            >
              Download
            </Button>
          </div>
        </div>

        <div className="divider" />

        <div className="adv-toggle-row">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▾ Hide' : '▸ Show'} Advanced Options
          </Button>
        </div>

        {showAdvanced && (
          <div className="adv-options-grid">
            <div className="adv-option-group">
              <h4>Post-Processing</h4>
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.embedThumbnail}
                  onChange={(e) => updateOption('embedThumbnail', e.target.checked)}
                />
                <span>Embed Thumbnail</span>
              </label>
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.embedMetadata}
                  onChange={(e) => updateOption('embedMetadata', e.target.checked)}
                />
                <span>Embed Metadata</span>
              </label>
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.audioOnly}
                  onChange={(e) => updateOption('audioOnly', e.target.checked)}
                />
                <span>Audio Only (extract)</span>
              </label>
            </div>

            <div className="adv-option-group">
              <h4>Subtitles & Metadata</h4>
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.writeSubtitles}
                  onChange={(e) => updateOption('writeSubtitles', e.target.checked)}
                />
                <span>Download Subtitles</span>
              </label>
              {options.writeSubtitles && (
                <Input
                  label="Subtitle Language"
                  value={options.subLang}
                  onChange={(e) => updateOption('subLang', e.target.value)}
                  placeholder="en"
                />
              )}
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.writeDescription}
                  onChange={(e) => updateOption('writeDescription', e.target.checked)}
                />
                <span>Save Description</span>
              </label>
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.writeThumbnail}
                  onChange={(e) => updateOption('writeThumbnail', e.target.checked)}
                />
                <span>Save Thumbnail</span>
              </label>
            </div>

            <div className="adv-option-group">
              <h4>Playlist & Network</h4>
              <label className="adv-checkbox">
                <input
                  type="checkbox"
                  checked={options.playlist}
                  onChange={(e) => updateOption('playlist', e.target.checked)}
                />
                <span>Download Playlist</span>
              </label>
              <Input
                label="Proxy"
                value={options.proxy}
                onChange={(e) => updateOption('proxy', e.target.value)}
                placeholder="socks5://127.0.0.1:1080"
                hint="Optional: route through proxy"
              />
              <Input
                label="Cookie File"
                value={options.cookieFile}
                onChange={(e) => updateOption('cookieFile', e.target.value)}
                placeholder="path/to/cookies.txt"
                hint="Netscape cookie file for age-restricted videos"
              />
              <Input
                label="Max File Size"
                value={options.maxFileSize}
                onChange={(e) => updateOption('maxFileSize', e.target.value)}
                placeholder="50M"
                hint="e.g., 50M or 1G"
              />
            </div>

            <div className="adv-option-group">
              <h4>Custom</h4>
              <Input
                label="Output Template"
                value={options.outputTemplate}
                onChange={(e) => updateOption('outputTemplate', e.target.value)}
                placeholder="%(title)s.%(ext)s"
                hint="Custom filename template"
              />
              <div className="adv-custom-args">
                <label className="input-label">Extra yt-dlp Arguments</label>
                <textarea
                  className="adv-textarea"
                  value={options.customArgs}
                  onChange={(e) => updateOption('customArgs', e.target.value)}
                  placeholder="--no-check-certificates --geo-bypass"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h4 className="mb-sm font-mono text-dim">Command Preview</h4>
        <pre className="adv-command-preview">{buildCommandPreview()}</pre>
      </div>

      {results.length > 0 && (
        <div className="card">
          <h4 className="mb-md">Results</h4>
          <div className="adv-results">
            {results.map((r) => (
              <div
                key={r.id}
                className={`adv-result adv-result-${r.status}`}
                draggable={r.status === 'complete'}
                onDragStart={(e) => {
                  if (r.filepath) {
                    e.dataTransfer.setData('text/uri-list', r.filepath);
                    e.dataTransfer.setData('text/plain', r.filepath);
                  }
                }}
              >
                <span className="adv-result-status">
                  {r.status === 'complete' ? '✓' : '✗'}
                </span>
                <span className="truncate flex-1">{r.title}</span>
                {r.status === 'error' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => window.electronAPI.reportError('Advanced Download Failed', r.error || '')}
                  >
                    Report
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
