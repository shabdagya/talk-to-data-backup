import React, { useState, useRef, useEffect, useMemo } from 'react';
import AnswerCard from './AnswerCard';
import './ChatWindow.css';

const SUGGESTIONS = [
  "Break that down further",
  "Compare with previous month",
  "Show me the top 5",
  "Filter to completed orders only",
  "Why did this change?",
  "Show me the trend over time"
];

const SuggestionChips = ({ msgId, onSelect }) => {
  const chips = useMemo(() => {
    return [...SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [msgId]);

  return (
    <div className="cw-suggestions">
      {chips.map((chip, idx) => (
        <button key={idx} className="cw-suggestion-chip" onClick={() => onSelect(chip)}>
          {chip}
        </button>
      ))}
    </div>
  );
};

export default function ChatWindow({ chatHistory, onNewMessage, onSummarize }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const isLoading = chatHistory.some(m => m.loading);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onNewMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="cw-container">
      <div className="cw-messages">
        {chatHistory.length === 0 ? (
          <div className="cw-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="cw-empty-icon">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h2>Ask a question about your data</h2>
            <p>Try: 'What is revenue by region?' or 'Show me monthly trends'</p>
            <button className="cw-summarize-btn" onClick={onSummarize} disabled={isLoading}>
              ✨ Generate Executive Summary
            </button>
          </div>
        ) : (
          <div className="cw-history">
            {chatHistory.map(msg => (
              <React.Fragment key={msg.id}>
                <AnswerCard {...msg} />
                {!msg.loading && !msg.error && (
                  <SuggestionChips msgId={msg.id} onSelect={handleSuggestionClick} />
                )}
              </React.Fragment>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      
      <div className="cw-input-area">
        <form className="cw-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="cw-textarea"
            placeholder="Ask a question about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button type="submit" className="cw-send-btn" disabled={!input.trim() || isLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
