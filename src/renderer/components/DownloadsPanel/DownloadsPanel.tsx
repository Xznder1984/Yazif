import React from 'react';
import { Button } from '../common/Button';
import './DownloadsPanel.css';


interface RecentDownload {
  id: string;
  title: string;
  filepath: string;
  format: string;
  timestamp: number;
}

interface DownloadsPanelProps {
  downloads: RecentDownload[];
}

export const DownloadsPanel: React.FC<DownloadsPanelProps> = ({ downloads }) => {
  const handleDragStart = (e: React.DragEvent, filepath: string) => {
    e.dataTransfer.setData('text/uri-list', filepath);
    e.dataTransfer.setData('text/plain', filepath);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleOpenFile = (filepath: string) => {
    window.electronAPI.openExternal(filepath);
  };

  const handleOpenFolder = (filepath: string) => {
    const folder = filepath.substring(0, filepath.lastIndexOf('\\') || filepath.lastIndexOf('/'));
    window.electronAPI.openFolder(folder);
  };

  if (downloads.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="var(--ctp-surface2)" strokeWidth="1.5"/>
            <path d="M14 20L18 24L26 16" stroke="var(--ctp-surface2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h4>No downloads yet</h4>
          <p>Your downloaded files will appear here.<br/>Drag them directly into CapCut or any editor!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Downloads</h3>
        <span className="text-xs text-dim">{downloads.length} files</span>
      </div>
      <div className="downloads-panel-list">
        {downloads.map((dl) => (
          <div
            key={dl.id}
            className="downloads-panel-item"
            draggable
            onDragStart={(e) => handleDragStart(e, dl.filepath)}
          >
            <div className="downloads-panel-icon">
              {dl.format === 'mp3' || dl.format === 'wav' || dl.format === 'flac' || dl.format === 'ogg' ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2V14M9 2L5 6M9 2L13 6" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="10" rx="2" stroke="var(--accent-primary)" strokeWidth="1.5"/>
                  <polygon points="8,7 8,11 11,9" fill="var(--accent-primary)"/>
                </svg>
              )}
            </div>
            <div className="downloads-panel-info">
              <p className="downloads-panel-title truncate">{dl.title}</p>
              <p className="text-xs text-dim">{dl.format.toUpperCase()}</p>
            </div>
            <div className="downloads-panel-drag-hint">
              <span className="text-xs text-dim" title="Drag into CapCut or any editing software">
                ⤓ Drag
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOpenFolder(dl.filepath)}
              title="Open folder"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 3V11C1 11.5523 1.44772 12 2 12H12C12.5523 12 13 11.5523 13 11V5C13 4.44772 12.5523 4 12 4H7L5.5 2H2C1.44772 2 1 2.44772 1 3Z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
