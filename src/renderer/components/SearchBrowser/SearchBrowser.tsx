import React, { useState, useCallback } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ProgressBar } from '../common/ProgressBar';
import './SearchBrowser.css';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  viewCount: number;
}

interface DownloadingItem {
  id: string;
  title: string;
  status: 'downloading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(count: number): string {
  if (!count) return '';
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B views`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

const FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' },
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'flac', label: 'FLAC' },
  { value: 'ogg', label: 'OGG' },
];

const AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'opus'];

export const SearchBrowser: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [downloads, setDownloads] = useState<DownloadingItem[]>([]);
  const [format, setFormat] = useState('mp4');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await window.electronAPI.ytdlpSearch(query.trim());
      setResults(res);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, [query]);

  const handleDownload = async (result: SearchResult) => {
    const isAudio = AUDIO_FORMATS.includes(format);
    const dlId = Date.now().toString();

    setDownloads((prev) => [
      { id: dlId, title: result.title, status: 'downloading', progress: 0 },
      ...prev,
    ]);

    try {
      const res = await window.electronAPI.ytdlpDownload({
        url: result.url,
        format,
        quality: 'best',
        audioOnly: isAudio,
      });

      setDownloads((prev) =>
        prev.map((d) =>
          d.id === dlId
            ? {
                ...d,
                status: res.success ? 'complete' : 'error',
                progress: res.success ? 100 : 0,
                error: res.error,
              }
            : d
        )
      );
    } catch (err: any) {
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === dlId ? { ...d, status: 'error', error: err.message } : d
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDragStart = (e: React.DragEvent, result: SearchResult) => {
    e.dataTransfer.setData('text/plain', result.url);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="page">
      <div className="main-content-header">
        <h2>Search YouTube</h2>
        <p>Find and download videos directly</p>
      </div>

      <div className="card">
        <div className="search-bar">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search YouTube..."
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          />
          <div className="search-controls">
            <select
              className="search-format-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <Button onClick={handleSearch} loading={searching} disabled={!query.trim()}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {downloads.length > 0 && (
        <div className="card">
          <h3 className="mb-md">Active Downloads</h3>
          <div className="search-downloads">
            {downloads.map((dl) => (
              <div key={dl.id} className={`search-dl-item search-dl-${dl.status}`}>
                <span className="search-dl-icon">
                  {dl.status === 'complete' ? '✓' : dl.status === 'error' ? '✗' : '↓'}
                </span>
                <span className="truncate flex-1 text-sm">{dl.title}</span>
                {dl.status === 'error' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => window.electronAPI.reportError('Download Failed', dl.error || '')}
                  >
                    Report
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSearched && !searching && results.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p>No results found for "{query}"</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <div
              key={r.id}
              className="search-result-card"
              draggable
              onDragStart={(e) => handleDragStart(e, r)}
            >
              <div className="search-result-thumb">
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt="" />
                ) : (
                  <div className="search-result-thumb-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <polygon points="10,9 10,15 15,12" fill="currentColor"/>
                    </svg>
                  </div>
                )}
                {r.duration > 0 && (
                  <span className="search-result-duration">{formatDuration(r.duration)}</span>
                )}
              </div>
              <div className="search-result-info">
                <p className="search-result-title">{r.title}</p>
                <p className="search-result-meta">
                  {r.uploader}
                  {r.viewCount > 0 && <> · {formatViews(r.viewCount)}</>}
                </p>
              </div>
              <div className="search-result-actions">
                <Button size="sm" onClick={() => handleDownload(r)}>
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
