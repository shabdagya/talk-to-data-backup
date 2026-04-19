import React, { useState, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './FileUpload.css';

export default function FileUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError("Please select a valid CSV file.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateFile(selected)) setFile(selected);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) setFile(selected);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(true);
      setTimeout(() => {
        onUploadSuccess(response.data.schema, response.data.blocked_columns);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || "An error occurred during upload.");
      setLoading(false);
    }
  };

  return (
    <div className="fu-container">
      <div className="fu-content">
        <div className="fu-header">
          <svg className="fu-logo" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <h1 className="fu-title">Talk to Your Data</h1>
          <p className="fu-subtitle">Upload a CSV and ask questions in plain English. No SQL needed.</p>
        </div>

        <div 
          className={`fu-dropzone ${dragActive ? 'fu-drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input 
            ref={inputRef}
            type="file" 
            accept=".csv" 
            onChange={handleChange} 
            className="fu-input" 
          />
          <svg className="fu-upload-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
             <polyline points="17 8 12 3 7 8"></polyline>
             <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p>Drag your CSV here, or <span className="fu-link">click to browse</span></p>
        </div>

        {error && <div className="fu-error">{error}</div>}

        {file && !success && (
          <div className="fu-file-info">
            <div className="fu-file-details">
              <span className="fu-filename">{file.name}</span>
              <span className="fu-filesize">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button className="fu-submit-btn" onClick={handleUpload} disabled={loading}>
              {loading ? <span className="fu-spinner"></span> : "Upload & Analyze"}
            </button>
          </div>
        )}

        {success && (
          <div className="fu-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span className="fu-success-text">Dataset analyzed successfully!</span>
          </div>
        )}

        <div className="fu-footer">
          🔒 Sensitive columns (email, SSN, etc.) are automatically detected and hidden
        </div>
      </div>
    </div>
  );
}
