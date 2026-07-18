import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './Settings.css';


interface Config {
  setupComplete: boolean;
  downloadPath: string;
  separateFolders: boolean;
  nvidiaApiKey: string;
  autoOrganize: boolean;
  lastFormat: string;
  lastQuality: string;
}

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.electronAPI.getConfig().then((cfg) => setConfig(cfg));
  }, []);

  const handleSelectPath = async () => {
    const selected = await window.electronAPI.selectDirectory();
    if (selected && config) {
      setConfig({ ...config, downloadPath: selected });
    }
  };

  const handleTestKey = async () => {
    if (!config?.nvidiaApiKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI.nvidiaTestKey(config.nvidiaApiKey);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ valid: false, message: err.message });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    await window.electronAPI.saveConfig(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleOpenHelp = () => {
    window.electronAPI.openExternal('https://build.nvidia.com');
  };

  if (!config) return <div className="page"><p className="text-muted">Loading settings...</p></div>;

  return (
    <div className="page">
      <div className="main-content-header">
        <h2>Settings</h2>
        <p>Configure your Yazif preferences</p>
      </div>

      <div className="card">
        <h3 className="card-title mb-md">Download Location</h3>
        <div className="settings-row">
          <div className="flex-1">
            <Input
              label="Download Path"
              value={config.downloadPath}
              onChange={(e) => setConfig({ ...config, downloadPath: e.target.value })}
              readOnly
            />
          </div>
          <Button variant="secondary" onClick={handleSelectPath}>
            Browse
          </Button>
        </div>

        <div className="mt-md">
          <label className="adv-checkbox">
            <input
              type="checkbox"
              checked={config.separateFolders}
              onChange={(e) => setConfig({ ...config, separateFolders: e.target.checked })}
            />
            <div>
              <span>Separate Audio & Video Folders</span>
              <p className="text-xs text-dim mt-xs">
                AI will detect if content is audio or video and place it in the correct subfolder.
                Creates Audio/ and Video/ folders inside your download path.
              </p>
            </div>
          </label>
        </div>

        {config.separateFolders && (
          <div className="settings-folder-preview mt-md">
            <div className="text-xs text-muted mb-sm">Folder structure:</div>
            <div className="font-mono text-sm">
              <div>{config.downloadPath}/</div>
              <div style={{ paddingLeft: 16 }}>  Audio/</div>
              <div style={{ paddingLeft: 16 }}>  Video/</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex-between mb-md">
          <h3 className="card-title">NVIDIA AI API Key</h3>
          <Button variant="ghost" size="sm" onClick={() => window.electronAPI.openExternal('https://build.nvidia.com')}>
            Help Me Get a Key
          </Button>
        </div>
        <p className="text-sm text-muted mb-md">
          Used for AI-powered video renaming and automatic audio/video classification.
          Get a free key at <a href="#" onClick={(e) => { e.preventDefault(); handleOpenHelp(); }}>build.nvidia.com</a>.
        </p>

        <div className="settings-api-row">
          <div className="flex-1">
            <Input
              label="API Key"
              type={apiKeyVisible ? 'text' : 'password'}
              value={config.nvidiaApiKey}
              onChange={(e) => {
                setConfig({ ...config, nvidiaApiKey: e.target.value });
                setTestResult(null);
              }}
              placeholder="nvapi-..."
              error={testResult && !testResult.valid ? testResult.message : undefined}
              hint={testResult?.valid ? testResult.message : undefined}
            />
          </div>
          <div className="settings-api-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
            >
              {apiKeyVisible ? 'Hide' : 'Show'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleTestKey} loading={testing}>
              Test
            </Button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title mb-md">Organizer</h3>
        <label className="adv-checkbox">
          <input
            type="checkbox"
            checked={config.autoOrganize}
            onChange={(e) => setConfig({ ...config, autoOrganize: e.target.checked })}
          />
          <div>
            <span>Auto-organize downloads</span>
            <p className="text-xs text-dim mt-xs">
              Automatically organize downloaded files by Artist/Album after download completes.
            </p>
          </div>
        </label>
      </div>

      <div className="settings-save-bar">
        <Button onClick={handleSave} loading={saving}>
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
