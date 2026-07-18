import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './SetupWizard.css';


interface SetupWizardProps {
  onComplete: (config: any) => void;
}

type SetupStep = 'welcome' | 'path' | 'api-key' | 'complete';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [downloadPath, setDownloadPath] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const handleSelectPath = async () => {
    const selected = await window.electronAPI.selectDirectory();
    if (selected) {
      setDownloadPath(selected);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }
    setTesting(true);
    setError('');
    try {
      const result = await window.electronAPI.nvidiaTestKey(apiKey.trim());
      setApiKeyValid(result.valid);
      if (!result.valid) {
        setError(result.message);
      }
    } catch (err: any) {
      setApiKeyValid(false);
      setError(err.message || 'Failed to test API key');
    }
    setTesting(false);
  };

  const handleComplete = () => {
    onComplete({
      downloadPath: downloadPath || undefined,
      nvidiaApiKey: apiKey.trim() || undefined,
      separateFolders: true,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="setup-step setup-welcome">
            <div className="setup-icon-large">
              <svg width="80" height="80" viewBox="0 0 128 128">
                <defs>
                  <linearGradient id="setup-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#89b4fa' }} />
                    <stop offset="100%" style={{ stopColor: '#cba6f7' }} />
                  </linearGradient>
                </defs>
                <circle cx="64" cy="58" r="32" fill="none" stroke="url(#setup-accent)" strokeWidth="5" />
                <polygon points="56,42 56,74 80,58" fill="url(#setup-accent)" />
              </svg>
            </div>
            <h1>Welcome to Yazif</h1>
            <p className="setup-subtitle">Your clean, modern YouTube downloader</p>
            <p className="setup-desc">
              Let's set up a few things before you get started.
              This only takes a minute.
            </p>
            <Button size="lg" onClick={() => setStep('path')}>
              Get Started
            </Button>
          </div>
        );

      case 'path':
        return (
          <div className="setup-step">
            <div className="setup-step-header">
              <span className="setup-step-num">1</span>
              <div>
                <h2>Download Location</h2>
                <p className="setup-subtitle">Choose where to save your downloads</p>
              </div>
            </div>
            <p className="setup-desc">
              Pick a folder where Yazif will store your downloaded videos and audio.
              You can create separate Audio and Video subfolders automatically.
            </p>
            <div className="setup-path-selector">
              <Input
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                placeholder="C:\Users\YourName\Downloads\Yazif"
                readOnly
              />
              <Button variant="secondary" onClick={handleSelectPath}>
                Browse
              </Button>
            </div>
            {downloadPath && (
              <div className="setup-path-preview">
                <p className="text-sm text-muted">Your files will be organized as:</p>
                <div className="setup-tree">
                  <div className="tree-item">
                    <span className="tree-icon"> </span>
                    <span>{downloadPath}</span>
                  </div>
                  <div className="tree-item tree-child">
                    <span className="tree-icon"> </span>
                    <span>Audio/</span>
                    <span className="text-dim text-xs"> — songs, podcasts, music</span>
                  </div>
                  <div className="tree-item tree-child">
                    <span className="tree-icon"> </span>
                    <span>Video/</span>
                    <span className="text-dim text-xs"> — videos, tutorials, vlogs</span>
                  </div>
                </div>
              </div>
            )}
            <div className="setup-actions">
              <Button variant="ghost" onClick={() => setStep('welcome')}>Back</Button>
              <Button onClick={() => setStep('api-key')} disabled={!downloadPath}>
                Next
              </Button>
            </div>
          </div>
        );

      case 'api-key':
        return (
          <div className="setup-step">
            <div className="setup-step-header">
              <span className="setup-step-num">2</span>
              <div>
                <h2>NVIDIA API Key</h2>
                <p className="setup-subtitle">AI-powered video naming (optional)</p>
              </div>
            </div>
            <p className="setup-desc">
              Yazif uses NVIDIA's AI to automatically rename your downloads with clean,
              descriptive filenames and sort them into Audio or Video folders.
            </p>
            <Input
              label="NVIDIA NIM API Key"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setApiKeyValid(null);
                setError('');
              }}
              placeholder="nvapi-..."
              type="password"
              error={error || undefined}
              hint="Get your free key at build.nvidia.com"
            />
            <div className="setup-api-actions">
              <Button variant="secondary" onClick={handleTestApiKey} loading={testing}>
                Test Key
              </Button>
              {apiKeyValid === true && (
                <span className="badge badge-success">API key is valid!</span>
              )}
              <Button
                variant="ghost"
                onClick={() => window.electronAPI.openExternal('https://build.nvidia.com')}
              >
                Get API Key
              </Button>
            </div>
            <p className="setup-desc text-dim text-sm mt-md">
              You can skip this and add it later in Settings. Without it, files will
              keep their original YouTube names.
            </p>
            <div className="setup-actions">
              <Button variant="ghost" onClick={() => setStep('path')}>Back</Button>
              <Button variant="secondary" onClick={handleComplete}>Skip for Now</Button>
              <Button onClick={handleComplete}>Finish Setup</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="setup-wizard">
      <div className="setup-card">
        {renderStep()}
        <div className="setup-progress">
          {['welcome', 'path', 'api-key'].map((s, i) => (
            <div
              key={s}
              className={`setup-dot ${
                step === s ? 'setup-dot-active' : 
                ['welcome', 'path', 'api-key'].indexOf(step) > i ? 'setup-dot-done' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
