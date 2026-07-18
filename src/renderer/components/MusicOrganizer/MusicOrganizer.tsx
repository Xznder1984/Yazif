import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import './MusicOrganizer.css';


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

export const MusicOrganizer: React.FC = () => {
  const [plan, setPlan] = useState<OrganizePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ moved: number; errors: string[] } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    try {
      const preview = await window.electronAPI.organizerPreview();
      setPlan(preview);
    } catch (err) {
      console.error('Scan failed:', err);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!plan) return;
    setApplying(true);
    try {
      const res = await window.electronAPI.organizerApply(plan);
      setResult(res);
      setShowConfirm(false);
      if (res.errors.length === 0) {
        setPlan(null);
      }
    } catch (err) {
      console.error('Apply failed:', err);
    }
    setApplying(false);
  };

  return (
    <div className="page">
      <div className="main-content-header">
        <h2>Music Organizer</h2>
        <p>Organize your music files by Artist / Album / Title</p>
      </div>

      <div className="card">
        <p className="text-sm text-muted mb-md">
          Scan your download folder and organize loose music files into a clean
          <span className="font-mono"> Artist/Album/Title</span> folder structure,
          similar to how Windows Music library works.
        </p>
        <Button onClick={handleScan} loading={loading}>
          Scan & Preview
        </Button>
      </div>

      {plan && (
        <div className="card">
          <div className="flex-between mb-md">
            <h3 className="card-title">Preview Changes</h3>
            <span className="badge badge-info">{plan.moves.length} files to organize</span>
          </div>

          {plan.artists.length > 0 && (
            <div className="organize-artists mb-md">
              <p className="text-xs text-dim mb-sm">Artists found:</p>
              <div className="organize-artist-tags">
                {plan.artists.map((a) => (
                  <span key={a} className="organize-artist-tag">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div className="organize-preview-list">
            {plan.moves.slice(0, 20).map((move, i) => {
              const fromParts = move.from.split('\\');
              const toParts = move.to.split('\\');
              const fromName = fromParts[fromParts.length - 1];
              const toDir = toParts.slice(-3, -1).join(' / ');
              return (
                <div key={i} className="organize-preview-item">
                  <span className="organize-from truncate">{fromName}</span>
                  <span className="organize-arrow">→</span>
                  <span className="organize-to truncate text-dim">{toDir}/</span>
                </div>
              );
            })}
            {plan.moves.length > 20 && (
              <p className="text-xs text-dim text-center mt-sm">
                ...and {plan.moves.length - 20} more files
              </p>
            )}
          </div>

          <div className="mt-md">
            {!showConfirm ? (
              <Button onClick={() => setShowConfirm(true)}>
                Organize Files
              </Button>
            ) : (
              <div className="organize-confirm">
                <p className="text-sm text-warning mb-sm">
                  Move {plan.moves.length} files? This cannot be undone.
                </p>
                <div className="flex gap-sm">
                  <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
                  <Button variant="danger" onClick={handleApply} loading={applying}>
                    Yes, Organize
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className={`card ${result.errors.length === 0 ? 'organize-success' : 'organize-partial'}`}>
          {result.errors.length === 0 ? (
            <div className="organize-result">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="var(--accent-success)" strokeWidth="2"/>
                <path d="M10 16L14 20L22 12" stroke="var(--accent-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-success font-medium">Successfully organized {result.moved} files!</p>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-sm">Organized {result.moved} files with {result.errors.length} errors:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-error">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
