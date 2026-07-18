import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';


interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const steps = [
    {
      title: '1. Go to NVIDIA Build',
      desc: 'Visit build.nvidia.com and sign in or create a free account.',
      action: () => window.electronAPI.openExternal('https://build.nvidia.com'),
      actionLabel: 'Open build.nvidia.com',
    },
    {
      title: '2. Navigate to API Playground',
      desc: 'Click on any model (like Llama 3.1 8B Instruct) and find the API playground.',
    },
    {
      title: '3. Generate an API Key',
      desc: 'Click "Get API Key" in the top right. Copy the key that starts with "nvapi-".',
    },
    {
      title: '4. Paste it in Yazif Settings',
      desc: 'Go to Settings in Yazif and paste your API key. Click "Test" to verify it works.',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Get Your NVIDIA API Key" size="md">
      <div className="help-steps">
        {steps.map((step, i) => (
          <div key={i} className="help-step">
            <div className="help-step-num">{i + 1}</div>
            <div className="help-step-content">
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
              {step.action && (
                <Button variant="secondary" size="sm" onClick={step.action}>
                  {step.actionLabel}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="help-note">
        <strong>Is the API key free?</strong>
        <p>
          Yes! NVIDIA provides free API credits for their NIM models.
          You get generous free tier usage that's more than enough for
          renaming your downloads.
        </p>
      </div>

      <div className="help-footer">
        <Button onClick={onClose}>Got it!</Button>
      </div>
    </Modal>
  );
};
