import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { API_URL } from '../config';
import './AnswerCard.css';

export default function AnswerCard({
  question, answer, confidence, confidence_label, key_insight, data_note,
  sql_used, sql_explanation, results, loading, error, chart_config,
  blocked_columns, dataset_name, row_count
}) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    setExportError(false);
    setExportSuccess(false);
    
    const report_data = { 
      question, answer, confidence, confidence_label, key_insight, data_note,
      sql_used, sql_explanation, results,
      blocked_columns, dataset_name, row_count
    };
    
    try {
      const response = await fetch(`${API_URL}/export/pdf/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report_data)
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'answer-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch(e) {
      setExportError(true);
      setTimeout(() => setExportError(false), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  const formatNumber = (value) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(1)}K`;
    return `£${value}`;
  };

  const renderChart = () => {
    if (!chart_config || chart_config.type === "none") return null;

    if (chart_config.type === "single_number") {
      const val = Object.values(results[0])[0];
      const colName = Object.keys(results[0])[0];
      return (
        <div className="ac-single-number">
          <div className="ac-single-val">{formatNumber(val)}</div>
          <div className="ac-single-lbl">{colName}</div>
        </div>
      );
    }

    if (chart_config.type === "line") {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey={chart_config.x_key} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatNumber} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => formatNumber(value)} cursor={{ stroke: '#e2e8f0' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey={chart_config.y_key} stroke="#6366f1" strokeWidth={2} dot={{r:4}} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chart_config.type === "pie") {
      const COLORS = ["#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#e0e7ff","#4f46e5"];
      return (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={results} dataKey={chart_config.value_key} nameKey={chart_config.name_key}
                 cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                 labelLine={false}>
              {results.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chart_config.type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey={chart_config.x_key} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
            <Tooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey={chart_config.y_key} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="ac-wrapper">
      <div className="ac-user-bubble">
        {question}
      </div>

      {loading && (
        <div className="ac-ai-card">
          <div className="ac-skeleton">
            <div className="ac-skel-bar w-3/4"></div>
            <div className="ac-skel-bar w-full"></div>
            <div className="ac-skel-bar w-5/6"></div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="ac-ai-card ac-error-card">
          <div className="ac-error-title">⚠ Could not answer this question</div>
          <div className="ac-error-message">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="ac-ai-card">
          <div className="ac-header">
            <div className="ac-brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v4h2v2h-4v-2h2V8h-1a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                 <rect x="4" y="14" width="16" height="8" rx="2" ry="2"></rect>
              </svg>
              Talk to Data
            </div>
            <div className={`ac-badge ac-badge-${(confidence_label || '').toLowerCase()}`}>
              ● {confidence_label} confidence
            </div>
          </div>

          <div className="ac-answer">{answer}</div>
          
          {key_insight && <div className="ac-insight">{key_insight}</div>}
          {data_note && <div className="ac-note">{data_note}</div>}

          {chart_config && chart_config.type !== "none" && (
            <div className="ac-chart-container">
              {renderChart()}
              <div className="ac-chart-reason">Chart type: {chart_config.type.charAt(0).toUpperCase() + chart_config.type.slice(1)} — {chart_config.reason}</div>
            </div>
          )}

          {sql_used && (
            <div className="ac-sql-section">
              <button className="ac-sql-toggle" onClick={() => setSqlOpen(!sqlOpen)}>
                {sqlOpen ? 'Hide SQL ▲' : 'View SQL ▼'}
              </button>
              <div className={`ac-sql-content ${sqlOpen ? 'open' : ''}`}>
                <pre>{sql_used}</pre>
                {sql_explanation && <div className="ac-sql-explanation">{sql_explanation}</div>}
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '8px' }}>
            <button className="ac-copy" style={{ position: 'relative', bottom: 'auto', right: 'auto', background: exportLoading ? '#e2e8f0' : 'white', border: '1px solid #6366f1', color: exportError ? '#dc2626' : (exportSuccess ? '#16a34a' : '#6366f1') }} onClick={handleExportPDF} disabled={exportLoading}>
              {exportLoading ? '⏳ Generating...' : exportSuccess ? '✓ Downloaded!' : exportError ? 'Export failed' : '📄 Export PDF'}
            </button>
            <button className="ac-copy" style={{ position: 'relative', bottom: 'auto', right: 'auto' }} onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy answer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
