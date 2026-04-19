import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import FileUpload from './components/FileUpload';
import SchemaPanel from './components/SchemaPanel';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const [schema, setSchema] = useState(null);
  const [blockedColumns, setBlockedColumns] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [datasetReportLoading, setDatasetReportLoading] = useState(false);

  const handleUploadSuccess = async (newSchema, newBlockedColumns) => {
    setSchema(newSchema);
    setBlockedColumns(newBlockedColumns);
    
    try {
      const res = await axios.get(`${API_URL}/metrics`);
      setMetrics(res.data.metrics);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
    
    setSchemaLoaded(true);
  };

  const handleReset = async () => {
    try {
      await axios.post(`${API_URL}/reset`);
      setSchemaLoaded(false);
      setSchema(null);
      setBlockedColumns([]);
      setChatHistory([]);
      setMetrics({});
    } catch (err) {
      console.error("Failed to reset:", err);
    }
  };

  const handleDatasetReport = async () => {
    setDatasetReportLoading(true);
    try {
      const response = await fetch(`${API_URL}/export/pdf/dataset`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Report generation failed");
    } finally {
      setDatasetReportLoading(false);
    }
  };

  const handleNewMessage = async (question) => {
    const loadingId = Date.now();
    const loadingMessage = {
      id: loadingId,
      question,
      answer: "",
      confidence: 0,
      confidence_label: "",
      key_insight: "",
      data_note: "",
      sql_used: "",
      sql_explanation: "",
      results: [],
      loading: true,
      error: null,
      blocked_columns: blockedColumns,
      dataset_name: schema?.table_name || "dataset",
      row_count: schema?.row_count || 0
    };
    
    setChatHistory(prev => [...prev, loadingMessage]);

    try {
      const res = await axios.post(`${API_URL}/query`, { question });
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { ...msg, ...res.data, loading: false } : msg
      ));
    } catch (err) {
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          loading: false, 
          error: err.response?.data?.error || "Failed to fetch answer. Please try again." 
        } : msg
      ));
    }
  };

  const handleSummarize = async () => {
    const loadingId = Date.now();
    const loadingMessage = {
      id: loadingId,
      question: "Generate Executive Summary",
      answer: "",
      confidence: 0,
      confidence_label: "",
      key_insight: "",
      data_note: "",
      sql_used: "",
      sql_explanation: "",
      results: [],
      loading: true,
      isSummaryMessage: true,
      error: null
    };
    
    setChatHistory(prev => [...prev, loadingMessage]);

    try {
      const res = await axios.post(`${API_URL}/summarize`);
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { ...msg, ...res.data, loading: false } : msg
      ));
    } catch (err) {
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingId ? { 
          ...msg, 
          loading: false, 
          error: err.response?.data?.error || "Failed to generate summary." 
        } : msg
      ));
    }
  };

  if (!schemaLoaded) {
    return <FileUpload onUploadSuccess={handleUploadSuccess} />;
  }

  return (
    <div className="app-layout fade-in">
      <SchemaPanel schema={schema} blockedColumns={blockedColumns} metrics={metrics} />
      <div className="app-main">
        <header className="app-nav">
          <div className="app-brand">Talk to Data</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              style={{
                background: '#6366f1', color: 'white', border: 'none', 
                padding: '8px 16px', borderRadius: '6px', cursor: datasetReportLoading ? 'not-allowed' : 'pointer',
                fontWeight: '500', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                opacity: datasetReportLoading ? 0.7 : 1
              }} 
              onClick={handleDatasetReport} 
              disabled={datasetReportLoading}
            >
              {datasetReportLoading ? '⏳ Generating Report...' : '📊 Full Dataset Report'}
            </button>
            <button className="app-reset-btn" onClick={handleReset}>Reset</button>
          </div>
        </header>
        <ChatWindow chatHistory={chatHistory} onNewMessage={handleNewMessage} onSummarize={handleSummarize} />
      </div>
    </div>
  );
}

export default App;
