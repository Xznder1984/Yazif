import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';


interface ErrorReporterProps {
  isOpen: boolean;
  onClose: () => void;
  errorName?: string;
}

export const ErrorReporter: React.FC<ErrorReporterProps> = ({
  isOpen,
  onClose,
  errorName: initialError = '',
}) => {
  const [errorName, setErrorName] = useState(initialError);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    window.electronAPI.reportError(errorName, reason);
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setErrorName('');
      setReason('');
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report an Error"
      size="sm"
      footer={
        <div className="flex gap-sm">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!errorName.trim()}>
            {sent ? 'Sent!' : 'Send Report'}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted mb-md">
        Send an error report to the developer. The report includes the error name
        and any optional details you provide.
      </p>
      <Input
        label="Error Name"
        value={errorName}
        onChange={(e) => setErrorName(e.target.value)}
        placeholder="e.g., DownloadFailed, FormatNotSupported"
      />
      <div className="mt-md">
        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What were you trying to do?"
        />
      </div>
    </Modal>
  );
};
