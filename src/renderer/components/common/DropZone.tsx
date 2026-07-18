import React, { useState, useRef } from 'react';
import './DropZone.css';


interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onDrop,
  accept,
  multiple = true,
  children,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCountRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (accept) {
      const filtered = files.filter((f) =>
        accept.some((a) => f.name.toLowerCase().endsWith(a.toLowerCase()))
      );
      onDrop(filtered);
    } else {
      onDrop(files);
    }
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children || (
        <div className="dropzone-content">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 6V22M16 6L10 12M16 6L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 26H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Drag & drop files here</p>
          <span className="dropzone-hint">or click to browse</span>
        </div>
      )}
    </div>
  );
};
