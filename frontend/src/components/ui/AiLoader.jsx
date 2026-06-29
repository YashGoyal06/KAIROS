import React from 'react';
import './AiLoader.css';

export default function AiLoader({ text = "Generating" }) {
  return (
    <div className="ai-loader-container">
      <div className="ai-loader-sphere">
        <span className="ai-loader-text">{text}</span>
      </div>
    </div>
  );
}
