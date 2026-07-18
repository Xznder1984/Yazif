import React from 'react';
import './Tab.css';


export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tab: React.FC<TabProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
