import React, { useState, useEffect } from 'react';
import { SetupWizard } from './components/SetupWizard/SetupWizard';
import { SimpleDownload } from './components/SimpleDownload/SimpleDownload';
import { AdvancedDownload } from './components/AdvancedDownload/AdvancedDownload';
import { Settings } from './components/Settings/Settings';
import { HelpModal } from './components/HelpModal/HelpModal';
import { MusicOrganizer } from './components/MusicOrganizer/MusicOrganizer';
import { DownloadsPanel } from './components/DownloadsPanel/DownloadsPanel';
import { ErrorReporter } from './components/ErrorReporter/ErrorReporter';
import type { PageId, DownloadItem } from './lib/types';




const SidebarIcon: React.FC<{ page: PageId }> = ({ page }) => {
  const icons: Record<PageId, React.ReactNode> = {
    simple: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 3V13M9 13L5 9M9 13L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    advanced: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 6V9L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    music: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M12 2V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    downloads: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 8L9 11L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 2V4M9 14V16M16 9H14M4 9H2M14 4L12.5 5.5M5.5 12.5L4 14M14 14L12.5 12.5M5.5 5.5L4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };
  return <>{icons[page]}</>;
};

export const App: React.FC = () => {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('simple');
  const [showHelp, setShowHelp] = useState(false);
  const [showErrorReporter, setShowErrorReporter] = useState(false);
  const [recentDownloads, setRecentDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    window.electronAPI.isSetupComplete().then((complete) => {
      setSetupComplete(complete);
    });

    window.electronAPI.onNavigate((page: string) => {
      setCurrentPage(page as PageId);
    });

    window.electronAPI.onShowAbout(() => {
      setShowHelp(true);
    });
  }, []);

  const handleSetupComplete = async (config: any) => {
    await window.electronAPI.saveConfig({ ...config, setupComplete: true });
    setSetupComplete(true);
  };

  if (setupComplete === null) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="download-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!setupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const navItems: { id: PageId; label: string; section?: string }[] = [
    { id: 'simple', label: 'Quick Download', section: 'Download' },
    { id: 'advanced', label: 'Advanced Download' },
    { id: 'music', label: 'Music Organizer', section: 'Organize' },
    { id: 'downloads', label: 'Recent Downloads', section: 'Files' },
    { id: 'settings', label: 'Settings', section: 'App' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'simple':
        return <SimpleDownload />;
      case 'advanced':
        return <AdvancedDownload />;
      case 'music':
        return <MusicOrganizer />;
      case 'downloads':
        return <DownloadsPanel downloads={recentDownloads} />;
      case 'settings':
        return <Settings />;
      default:
        return <SimpleDownload />;
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 128 128">
            <defs>
              <linearGradient id="logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#89b4fa' }} />
                <stop offset="100%" style={{ stopColor: '#cba6f7' }} />
              </linearGradient>
            </defs>
            <circle cx="64" cy="58" r="32" fill="none" stroke="url(#logo-g)" strokeWidth="5"/>
            <polygon points="56,42 56,74 80,58" fill="url(#logo-g)"/>
          </svg>
          <span>Yazif</span>
        </div>

        {navItems.map((item, i) => (
          <React.Fragment key={item.id}>
            {item.section && (
              <>
                {i > 0 && <div className="divider" style={{ margin: '4px 20px' }} />}
                <div className="sidebar-section-label">{item.section}</div>
              </>
            )}
            <button
              className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <SidebarIcon page={item.id} />
              <span>{item.label}</span>
            </button>
          </React.Fragment>
        ))}

        <div style={{ flex: 1 }} />

        <div className="divider" style={{ margin: '4px 20px' }} />
        <button
          className="sidebar-item"
          onClick={() => setShowHelp(true)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 7C7 5.89543 7.89543 5 9 5C10.1046 5 11 5.89543 11 7C11 8 10 8.5 9 9V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="13" r="0.75" fill="currentColor"/>
          </svg>
          <span>Help & API Key</span>
        </button>
        <button
          className="sidebar-item"
          onClick={() => setShowErrorReporter(true)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 15H2L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 7V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="12.5" r="0.75" fill="currentColor"/>
          </svg>
          <span>Report Issue</span>
        </button>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <ErrorReporter isOpen={showErrorReporter} onClose={() => setShowErrorReporter(false)} />
    </div>
  );
};
