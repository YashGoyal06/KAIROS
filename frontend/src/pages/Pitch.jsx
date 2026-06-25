import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Presentation, Loader, Play, Send, RefreshCw, Layers } from 'lucide-react';

export default function Pitch() {
  const { profile, API_BASE } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  
  const [pitchText, setPitchText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'slides' | 'showcase'
  const [inputText, setInputText] = useState('');

  const fetchSessions = async () => {
    if (!profile) return;
    try {
      const res = await axios.get(`${API_BASE}/sessions`, {
        params: { profile_id: profile.id }
      });
      // Only sessions in execution or completed can generate pitch
      const planSessions = res.data.filter(s => s.status === 'execution' || s.status === 'completed');
      setSessions(planSessions);
      if (planSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(planSessions[0].id);
      }
    } catch (e) {
      console.error("Error loading sessions for pitch builder:", e);
    }
  };

  const fetchSessionDetails = async (forceOverwrite = false) => {
    if (!activeSessionId) return;
    try {
      const res = await axios.get(`${API_BASE}/sessions/${activeSessionId}`);
      setActiveSession(res.data);
      if (res.data.pitch_outline && res.data.pitch_outline.full_raw) {
        setPitchText(res.data.pitch_outline.full_raw);
      } else if (forceOverwrite) {
        setPitchText('');
      }
      // If not forceOverwrite, keep existing pitchText intact
    } catch (e) {
      console.error("Error loading pitch outline details:", e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [profile]);

  useEffect(() => {
    fetchSessionDetails(true);
  }, [activeSessionId]);

  const handleGeneratePitch = async (customInstruction = '') => {
    if (!activeSessionId) return;
    setIsGenerating(true);
    setPitchText('');
    
    try {
      const response = await fetch(`${API_BASE}/sessions/${activeSessionId}/pitch?model_preference=gemini`, {
        method: 'POST'
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = '';
      let rawText = '';

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
                rawText += payload.content;
                setPitchText(rawText);
              }
            } catch (err) {}
          }
        }
      }

      // Save generated pitch outline to database
      try {
        await axios.put(`${API_BASE}/sessions/${activeSessionId}/pitch`, {
          pitch_outline: { full_raw: rawText }
        });
      } catch (saveErr) {
        console.error('Error saving pitch to DB:', saveErr);
      }
      setIsGenerating(false);
      // Don't call fetchSessionDetails - keep the streamed text as-is

    } catch (err) {
      console.error("Error generating pitch:", err);
      setIsGenerating(false);
    }
  };

  const handleRequestPitchChanges = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionId) return;
    
    setIsGenerating(true);
    setPitchText('');
    const promptMessage = `Please regenerate the presentation layout. Custom instruction: ${inputText}`;
    setInputText('');

    try {
      const response = await fetch(`${API_BASE}/sessions/${activeSessionId}/pitch?model_preference=claude`, {
        method: 'POST'
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = '';
      let rawText = '';

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
                rawText += payload.content;
                setPitchText(rawText);
              }
            } catch (err) {}
          }
        }
      }

      // Save back to DB
      try {
        await axios.put(`${API_BASE}/sessions/${activeSessionId}/pitch`, {
          pitch_outline: { full_raw: rawText }
        });
      } catch (saveErr) {
        console.error('Error saving pitch to DB:', saveErr);
      }
      setIsGenerating(false);
      // Don't call fetchSessionDetails - keep the streamed text as-is

    } catch (err) {
      console.error("Error updating pitch:", err);
      setIsGenerating(false);
    }
  };

  // Helper to split generated Markdown into tabs
  const parseSection = (sectionName) => {
    if (!pitchText) return 'Click "Generate Presentation Suite" to begin compiling pitch assets.';
    
    // Look for standard headers
    const demoFlowStart = pitchText.indexOf('## Demo Flow');
    const pitchOutlineStart = pitchText.indexOf('## Pitch Outline');
    const finalShowcaseStart = pitchText.indexOf('## Final Pitch Showcase');

    const sections = {
      demo: '',
      slides: '',
      showcase: ''
    };

    if (demoFlowStart !== -1 && pitchOutlineStart !== -1) {
      sections.demo = pitchText.substring(demoFlowStart, pitchOutlineStart).trim();
    } else {
      sections.demo = pitchText.substring(0, pitchOutlineStart !== -1 ? pitchOutlineStart : undefined).trim();
    }

    if (pitchOutlineStart !== -1) {
      sections.slides = pitchText.substring(pitchOutlineStart, finalShowcaseStart !== -1 ? finalShowcaseStart : undefined).trim();
    }

    if (finalShowcaseStart !== -1) {
      sections.showcase = pitchText.substring(finalShowcaseStart).trim();
    }

    return sections[sectionName] || pitchText;
  };

  const activeContent = parseSection(activeTab);

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>Presentation Pitch Studio</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Structure final slide talking points, demo sequences, and script showcase templates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {sessions.length > 0 && (
            <select
              className="form-select"
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              style={{ width: '220px' }}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button onClick={fetchSessionDetails} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
            <RefreshCw size={16} /> Sync Studio
          </button>
        </div>
      </div>

      {!activeSessionId ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Presentation size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
          <p style={{ color: '#9ca3af' }}>No roadmap execution sessions unlocked. Establish your planning milestones on the Coach tab first.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1 }}>
          
          {/* Main Layout Workspace */}
          {!pitchText && !isGenerating ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
              <Presentation size={64} style={{ color: '#8b5cf6', marginBottom: '24px' }} />
              <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}>Generate Presentation Package</h2>
              <p style={{ color: '#9ca3af', maxWidth: '500px', margin: '0 auto 32px auto', fontSize: '14px', lineHeight: '1.6' }}>
                KAIROS will consolidate task completion, assignees, technical architecture, and milestones into a coherent Pitch Outline, Demo Path, and Full Script.
              </p>
              <button onClick={() => handleGeneratePitch()} className="btn btn-primary" style={{ padding: '14px 32px' }}>
                <Play size={16} /> Compile Presentation Suite
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2.2fr', gap: '24px', flexGrow: 1 }}>
              
              {/* Left Pane - Presentation Viewer */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
                {/* Custom Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '24px', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('demo')}
                    className={`btn ${activeTab === 'demo' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '4px' }}
                  >
                    Demo Flow sequence
                  </button>
                  <button
                    onClick={() => setActiveTab('slides')}
                    className={`btn ${activeTab === 'slides' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '4px' }}
                  >
                    Slide structures
                  </button>
                  <button
                    onClick={() => setActiveTab('showcase')}
                    className={`btn ${activeTab === 'showcase' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '4px' }}
                  >
                    Final Showcase Script
                  </button>
                </div>

                {isGenerating && !pitchText ? (
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                    <Loader className="spin" size={32} style={{ color: '#3b82f6', animation: 'spinSlow 2s linear infinite' }} />
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>Compiling project assets and skills profiles...</span>
                  </div>
                ) : (
                  <div style={{ flexGrow: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', padding: '24px', borderRadius: '8px', maxHeight: '550px' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#e5e7eb', fontSize: '13px', lineHeight: '1.7' }}>
                      {activeContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Pane - Chat tuning interface */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
                  <Layers size={18} style={{ color: '#8b5cf6' }} /> Adjust Pitch Layout
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                  Instruct the AI Pitch Architect to modify specific slides, add technical depth, re-structure demo features, or edit speaking bullet points.
                </p>

                <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6b7280', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px', padding: '20px', textAlign: 'center', fontSize: '12px', marginBottom: '16px' }}>
                  {isGenerating ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader size={16} className="spin" style={{ animation: 'spinSlow 2s linear infinite' }} />
                      <span>Re-generating presentation slides...</span>
                    </div>
                  ) : (
                    <span>Ready for modification input. Example: "Add a slide explaining our database architecture."</span>
                  )}
                </div>

                <form onSubmit={handleRequestPitchChanges} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flexGrow: 1 }}
                    placeholder="Enter instructions to refine slides..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isGenerating}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
