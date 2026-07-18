import React from 'react';
import './Dropdown.css';


interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  placeholder,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`dropdown-wrapper ${error ? 'dropdown-error' : ''}`}>
      {label && <label className="dropdown-label">{label}</label>}
      <div className="dropdown-container">
        <select className={`dropdown ${className}`} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="dropdown-arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {error && <p className="dropdown-error-text">{error}</p>}
    </div>
  );
};
