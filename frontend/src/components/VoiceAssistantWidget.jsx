import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquare, X, Sparkles, Volume2, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';

export default function VoiceAssistantWidget({ sessionId = null, onCommand = null }) {
  const { profile, API_BASE } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I am Kairos Assistant. Ask me anything or click the mic for voice commands like *"Summarize blockers"* or *"Update task status"*.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setInputText(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your prompt.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSend = async (textToSend = inputText) => {
    const query = textToSend.trim();
    if (!query) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTranscript('');
    setIsLoading(true);

    // If caller provided custom command handler
    if (onCommand) {
      onCommand(query);
    }

    try {
      if (sessionId) {
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        history.push(userMsg);

        const response = await fetch(`${API_BASE}/sessions/${sessionId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            history: history,
            model_preference: 'deepseek'
          })
        });

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';
          let botResponse = '';
          
          setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const payload = JSON.parse(line.substring(5).trim());
                  if (payload.type === 'text_delta') {
                    botResponse += payload.content;
                    setMessages(prev => {
                      const updated = [...prev];
                      updated[updated.length - 1] = { role: 'assistant', content: botResponse };
                      return updated;
                    });
                  }
                } catch (e) {}
              }
            }
          }
        }
      } else {
        // Fallback intelligent response if no session active
        setTimeout(() => {
          let responseText = "I'm ready! Select an active coaching session or task board to perform specific actions.";
          const q = query.toLowerCase();
          if (q.includes('blocker') || q.includes('summary')) {
            responseText = "⚡ **Blocker Summary**: No critical blockers currently logged in active workspace. Keep pushing!";
          } else if (q.includes('task') || q.includes('done') || q.includes('update')) {
            responseText = "✅ Voice command received: *\"" + query + "\"*. Go to your Tasks page to verify status updates.";
          }
          setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        }, 600);
      }
    } catch (err) {
      console.error('Widget voice chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not process request. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 99999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          className="voice-widget-btn"
          title="Open Kairos Voice & Chat Assistant"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Popover Assistant Window */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '480px',
          background: 'rgba(15, 13, 24, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'widgetPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
              }}>
                <Sparkles size={16} style={{ color: '#fff' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>Kairos AI Companion</h4>
                <span style={{ fontSize: '10px', color: '#00FF66', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF66', display: 'inline-block' }} /> Voice & Chat Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div style={{
            flexGrow: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(99, 102, 241, 0.3))' : 'rgba(255, 255, 255, 0.05)',
                  border: m.role === 'user' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  color: '#fff'
                }}
              >
                <MarkdownRenderer content={m.content} />
              </div>
            ))}

            {isListening && (
              <div style={{
                alignSelf: 'center',
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '20px',
                color: '#f87171',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'pulse 1.5s infinite'
              }}>
                <Volume2 size={14} /> Listening... {transcript ? `"${transcript}"` : 'Speak now'}
              </div>
            )}

            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Kairos is typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div style={{
            padding: '6px 12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => handleSend("Summarize our current blockers")}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '4px 10px',
                color: '#d1d5db',
                fontSize: '10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Blockers summary
            </button>
            <button
              onClick={() => handleSend("What should I work on next?")}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '4px 10px',
                color: '#d1d5db',
                fontSize: '10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🎯 Next priority
            </button>
          </div>

          {/* Input Footer */}
          <div style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={toggleListening}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                border: isListening ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
              }}
              title={isListening ? 'Stop listening' : 'Start voice command'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              className="form-input"
              style={{
                flexGrow: 1,
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }}
              placeholder={isListening ? 'Listening...' : 'Type or speak command...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() ? 'pointer' : 'default',
                opacity: inputText.trim() ? 1 : 0.5,
                flexShrink: 0
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
