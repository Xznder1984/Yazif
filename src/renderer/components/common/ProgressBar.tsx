import React from 'react';
import './ProgressBar.css';


interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'default' | 'success' | 'error';
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  variant = 'default',
  size = 'md',
}) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="progress-wrapper">
      {(label || showPercent) && (
        <div className="progress-info">
          {label && <span className="progress-label">{label}</span>}
          {showPercent && <span className="progress-percent">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={`progress-track progress-${size}`}>
        <div
          className={`progress-fill progress-fill-${variant}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
