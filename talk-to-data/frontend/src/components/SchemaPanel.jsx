import React, { useState } from 'react';
import './SchemaPanel.css';

export default function SchemaPanel({ schema, blockedColumns, metrics }) {
  const [activeTab, setActiveTab] = useState('columns');

  if (!schema) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const suggestions = [
    "Revenue by region?",
    "Top 5 products by sales?",
    "Monthly revenue trend?",
    "Why did revenue drop in February?"
  ];

  const displayMetrics = metrics && Object.keys(metrics).length > 0 ? metrics : {};

  return (
    <div className="sp-sidebar">
      <div className="sp-section">
        <div className="sp-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
          DATASET
        </div>
        <div className="sp-dataset-name">{schema.table_name || 'data'}</div>
        <div className="sp-dataset-rows">{schema.row_count} rows loaded</div>
      </div>

      <div className="sp-tabs">
        <div 
          className={`sp-tab ${activeTab === 'columns' ? 'active' : ''}`}
          onClick={() => setActiveTab('columns')}
        >
          Columns
        </div>
        <div 
          className={`sp-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Definitions
        </div>
      </div>

      {activeTab === 'columns' && (
        <>
          <div className="sp-section sp-scrollable">
            <ul className="sp-list">
              {schema.columns.map((col, idx) => (
                <li key={idx} className="sp-col-item">
                  <span>{col.name}</span>
                  <span className={`sp-badge ${col.type === 'REAL' ? 'sp-badge-real' : 'sp-badge-text'}`}>
                    {col.type}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {blockedColumns && blockedColumns.length > 0 && (
            <div className="sp-section">
              <div className="sp-header">HIDDEN FOR PRIVACY</div>
              <ul className="sp-list sp-blocked-list">
                {blockedColumns.map((col, idx) => (
                  <li key={idx} className="sp-col-item">
                    <span>🔒 {col}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeTab === 'metrics' && (
        <div className="sp-section sp-scrollable">
          <ul className="sp-list">
            {Object.keys(displayMetrics).length === 0 && (
               <div style={{opacity: 0.5, fontSize: '0.8rem', padding: '1rem'}}>No custom definitions loaded.</div>
            )}
            {Object.entries(displayMetrics).map(([key, formula]) => (
              <li key={key} className="sp-metric-item">
                <div className="sp-metric-name">{key}</div>
                <div className="sp-metric-formula">{formula}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sp-section border-none">
        <div className="sp-header">TRY ASKING</div>
        <div className="sp-suggestions">
          {suggestions.map((text, i) => (
            <div key={i} className="sp-chip" onClick={() => handleCopy(text)}>
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
