import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Plus, Send, Check, Trash2, Calendar, FileText, Download, User, ArrowLeft, Loader } from 'lucide-react';

export default function Coach() {
  const { profile, API_BASE } = useAuth();
  
  // Navigation View: 'sessions' | 'create' | 'workspace'
  const [view, setView] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  
  // Forms state
  const [hackathonName, setHackathonName] = useState('');
  const [isTeam, setIsTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [myTeams, setMyTeams] = useState([]);
  const [probText, setProbText] = useState('');
  const [probFile, setProbFile] = useState(null);
  const [userIdea, setUserIdea] = useState('');
  const [modelPref, setModelPref] = useState('claude');

  // Interactive Workspace State
  const [critique, setCritique] = useState('');
  const [roadmap, setRoadmap] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const chatEndRef = useRef(null);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sessions`);
      setSessions(res.data);
    } catch (e) {
      console.error("Error loading sessions:", e);
    }
  };

  const fetchMyTeams = async () => {
    if (!profile) return;
    try {
      const res = await axios.get(`${API_BASE}/teams/user/${profile.id}`);
      setMyTeams(res.data);
      if (res.data.length > 0) {
        setSelectedTeamId(res.data[0].id);
      }
    } catch (e) {
      console.error("Error fetching user teams:", e);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchMyTeams();
  }, [profile]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, critique]);

  const handleStartNewSession = () => {
    setView('create');
  };

  const selectSession = async (sess) => {
    setActiveSession(sess);
    setRoadmap(sess.milestones || []);
    // Seed initial message if milestones exist
    setMessages([
      { role: 'assistant', content: `Welcome back to KAIROS Coach Room! Here is your generated roadmap. Let me know if you would like to edit or adjust any milestones.` }
    ]);
    setView('workspace');
  };

  const handleFileChange = (e) => {
    setProbFile(e.target.files[0]);
  };

  const handleCreateSessionSubmit = async (e) => {
    e.preventDefault();
    if (!hackathonName.trim()) return;

    try {
      // 1. Initialize session on backend
      const res = await axios.post(`${API_BASE}/sessions`, {
        name: hackathonName,
        creator_id: profile.id,
        team_id: isTeam ? selectedTeamId : null
      });
      const session = res.data;
      setActiveSession(session);
      setView('workspace');
      setIsGenerating(true);
      setCritique('');
      setRoadmap([]);
      setMessages([]);

      // 2. Build form data for streaming concept analysis
      const formData = new FormData();
      formData.append("user_idea", userIdea);
      formData.append("problem_statement_text", probText);
      formData.append("model_preference", modelPref);
      if (probFile) {
        formData.append("problem_statement_file", probFile);
      }

      setGenerationStep("Critiquing project scope...");
      
      // 3. Trigger streaming request
      const response = await fetch(`${API_BASE}/sessions/${session.id}/concept`, {
        method: 'POST',
        body: formData
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported on response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let buffer = '';
      let rawText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the last incomplete line back to buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const payload = JSON.parse(line.substring(5).trim());
              if (payload.type === 'text_delta') {
                rawText += payload.content;
                setCritique(rawText);
              } else if (payload.type === 'system_info') {
                setGenerationStep(payload.content);
              }
            } catch (err) {
              // Ignore partial chunk parse failures
            }
          }
        }
      }

      // Finish up, parse out JSON if outputted
      setIsGenerating(false);
      
      // Look for the roadmap markers in the text
      const markerStart = rawText.indexOf('[ROADMAP_JSON_START]');
      const markerEnd = rawText.indexOf('[ROADMAP_JSON_END]');

      if (markerStart !== -1 && markerEnd !== -1) {
        const critiqueClean = rawText.substring(0, markerStart).trim();
        const jsonBlock = rawText.substring(markerStart + 20, markerEnd).trim();
        
        setCritique(critiqueClean);
        
        try {
          const parsedRoadmap = JSON.parse(jsonBlock);
          setRoadmap(parsedRoadmap);
          // Auto-save milestones to backend DB
          const updateRes = await axios.put(`${API_BASE}/sessions/${session.id}/roadmap`, {
            milestones: parsedRoadmap
          });
          setActiveSession(updateRes.data);
        } catch (jsonErr) {
          console.error("Roadmap parsing error:", jsonErr);
        }
      }

      // Refresh list of sessions in background
      fetchSessions();

    } catch (err) {
      console.error("Error creating session:", err);
      setIsGenerating(false);
      alert("Failed to initialize session. Make sure backend is running.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession) return;

    const userMsg = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    
    // Create payload history
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    history.push(userMsg);

    try {
      setIsGenerating(true);
      setGenerationStep("Coach is thinking...");
      
      const response = await fetch(`${API_BASE}/sessions/${activeSession.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: history,
          model_preference: modelPref
        })
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let buffer = '';
      let botResponse = '';
      const assistantMsg = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

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
            } catch (err) {}
          }
        }
      }
      setIsGenerating(false);

    } catch (err) {
      console.error("Chat error:", err);
      setIsGenerating(false);
    }
  };

  const handleAcceptRoadmap = async () => {
    if (!activeSession) return;
    try {
      const res = await axios.put(`${API_BASE}/sessions/${activeSession.id}/roadmap`, {
        milestones: roadmap
      });
      setActiveSession(res.data);
      alert("Roadmap successfully locked and task boards seeded!");
    } catch (e) {
      console.error("Error accepting roadmap:", e);
    }
  };

  const handleDownloadRoadmap = (format) => {
    if (!activeSession) return;
    let content = `# KAIROS Project Roadmap: ${activeSession.name}\n\n`;
    roadmap.forEach(m => {
      content += `## ${m.phase}: ${m.title}\n`;
      content += `- Deliverable: ${m.deliverable}\n`;
      content += `- Duration: ${m.duration_estimate}\n`;
      content += `- Risk: ${m.risk_level.toUpperCase()}\n\n`;
    });

    if (format === 'md') {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roadmap_${activeSession.name}.md`;
      a.click();
    } else {
      // General print/pdf fallback
      window.print();
    }
  };

  const handleMilestoneEdit = (idx, field, val) => {
    // Only creator/leader can edit
    if (activeSession.creator_id !== profile.id) return;
    const updated = [...roadmap];
    updated[idx][field] = val;
    setRoadmap(updated);
  };

  const handleDeleteMilestone = (idx) => {
    if (activeSession.creator_id !== profile.id) return;
    setRoadmap(roadmap.filter((_, i) => i !== idx));
  };

  const handleAddMilestone = () => {
    if (activeSession.creator_id !== profile.id) return;
    setRoadmap([
      ...roadmap,
      { phase: `Phase ${roadmap.length + 1}`, title: 'New Phase', deliverable: 'TBD', duration_estimate: '4 hours', dependencies: [], risk_level: 'low' }
    ]);
  };

  return (
    <div className="main-content">
      {view === 'sessions' && (
        <>
          <div className="dashboard-header">
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>AI Coach Rooms</h1>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
                Join an active coaching session or establish a new roadmap.
              </p>
            </div>
            <button onClick={handleStartNewSession} className="btn btn-primary">
              <Plus size={16} /> New Coaching Session
            </button>
          </div>

          <div className="dashboard-grid">
            {sessions.length === 0 ? (
              <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
                <MessageSquare size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
                <p style={{ color: '#9ca3af' }}>No coaching sessions set up. Click "New Coaching Session" above to start.</p>
              </div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', minHeight: '180px' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>{s.name}</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Status: <span style={{ color: s.status === 'planning' ? '#f59e0b' : '#10b981' }}>{s.status}</span>
                    </p>
                  </div>
                  <button onClick={() => selectSession(s)} className="btn btn-secondary" style={{ marginTop: '24px', width: '100%' }}>
                    Open Coach Room
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'create' && (
        <>
          <div className="dashboard-header">
            <button onClick={() => setView('sessions')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '24px' }}>Start Coaching Session</h2>
            
            <form onSubmit={handleCreateSessionSubmit}>
              <div className="form-group">
                <label className="form-label">Hackathon Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kairos Auth"
                  value={hackathonName}
                  onChange={(e) => setHackathonName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coaching Mode</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={!isTeam} onChange={() => setIsTeam(false)} /> Solo Mode
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={isTeam} onChange={() => setIsTeam(true)} /> Team Mode
                  </label>
                </div>
              </div>

              {isTeam && (
                <div className="form-group">
                  <label className="form-label">Select Your Team</label>
                  <select className="form-select" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
                    {myTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Preferred LLM Router Model</label>
                <select className="form-select" value={modelPref} onChange={(e) => setModelPref(e.target.value)}>
                  <option value="claude">Claude 3.5 Sonnet (Primary)</option>
                  <option value="gemini">Gemini 1.5 Flash (First Fallback)</option>
                  <option value="huggingface">Qwen 72B / Llama 3 (Free Hugging Face Fallback)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Problem Statement File (PDF / Docx)</label>
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Or paste Problem Statement Text</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Paste problem statement details..."
                  value={probText}
                  onChange={(e) => setProbText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Project Idea</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="What is your idea? Explain what you plan to build..."
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
                Launch Coach Pipeline
              </button>
            </form>
          </div>
        </>
      )}

      {view === 'workspace' && activeSession && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="dashboard-header" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setView('sessions')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                <ArrowLeft size={16} /> Leave Room
              </button>
              <h2 style={{ fontSize: '24px', color: '#fff' }}>{activeSession.name} Coach</h2>
            </div>
            {roadmap.length > 0 && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => handleDownloadRoadmap('md')} className="btn btn-secondary">
                  <Download size={14} /> Export MD
                </button>
                {activeSession.creator_id === profile.id && activeSession.status === 'planning' && (
                  <button onClick={handleAcceptRoadmap} className="btn btn-primary">
                    <Check size={14} /> Accept & Start Execution
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Animation Overlay during generation */}
          {isGenerating && roadmap.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', alignItems: 'center', background: 'rgba(8,9,12,0.85)', gap: '16px' }}>
              <Loader className="spin" size={48} style={{ color: '#8b5cf6', animation: 'spinSlow 2s linear infinite' }} />
              <div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{generationStep}</div>
              <p style={{ color: '#6b7280', fontSize: '12px' }}>KAIROS agents are assessing scope constraints...</p>
            </div>
          )}

          {/* Split Pane: Timeline left, Critique/Chat right */}
          {(!isGenerating || roadmap.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flexGrow: 1, minHeight: '0' }}>
              {/* Left timeline */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '0', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', color: '#fff' }}>Milestones Roadmap</h3>
                  {activeSession.creator_id === profile.id && activeSession.status === 'planning' && (
                    <button onClick={handleAddMilestone} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      + Add Phase
                    </button>
                  )}
                </div>

                {roadmap.length === 0 ? (
                  <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', color: '#6b7280' }}>
                    Roadmap milestones will render here.
                  </div>
                ) : (
                  <div className="timeline">
                    {roadmap.map((m, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot" style={{ background: m.risk_level === 'high' ? '#ef4444' : m.risk_level === 'medium' ? '#f59e0b' : '#10b981' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <input
                            type="text"
                            value={m.phase}
                            onChange={(e) => handleMilestoneEdit(idx, 'phase', e.target.value)}
                            disabled={activeSession.creator_id !== profile.id}
                            style={{ background: 'transparent', border: 'none', color: '#8b5cf6', fontWeight: 'bold', fontSize: '12px', width: '80%' }}
                          />
                          {activeSession.creator_id === profile.id && activeSession.status === 'planning' && (
                            <button onClick={() => handleDeleteMilestone(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => handleMilestoneEdit(idx, 'title', e.target.value)}
                          disabled={activeSession.creator_id !== profile.id}
                          style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: '600', fontSize: '15px', marginTop: '6px', width: '100%' }}
                        />
                        <div style={{ marginTop: '10px' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'bold' }}>DELIVERABLE:</span>
                          <input
                            type="text"
                            value={m.deliverable}
                            onChange={(e) => handleMilestoneEdit(idx, 'deliverable', e.target.value)}
                            disabled={activeSession.creator_id !== profile.id}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px', color: '#9ca3af', fontSize: '12px', width: '100%', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                          <div>
                            <span style={{ fontSize: '9px', color: '#6b7280' }}>ESTIMATE:</span>
                            <input
                              type="text"
                              value={m.duration_estimate}
                              onChange={(e) => handleMilestoneEdit(idx, 'duration_estimate', e.target.value)}
                              disabled={activeSession.creator_id !== profile.id}
                              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', width: '70px', display: 'block' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '9px', color: '#6b7280' }}>RISK:</span>
                            <select
                              value={m.risk_level}
                              onChange={(e) => handleMilestoneEdit(idx, 'risk_level', e.target.value)}
                              disabled={activeSession.creator_id !== profile.id}
                              style={{ background: 'transparent', border: 'none', color: m.risk_level === 'high' ? '#ef4444' : '#10b981', fontSize: '11px', display: 'block' }}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right critique/chat pane */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '0' }}>
                {/* Scrollable conversation */}
                <div className="glass-card" style={{ flexGrow: 1, minHeight: '0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
                  {critique && (
                    <div style={{ padding: '16px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px' }}>
                      <h4 style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>KAIROS Scope Critique</h4>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', color: '#d1d5db', lineHeight: '1.5' }}>
                        {critique}
                      </pre>
                    </div>
                  )}
                  
                  {messages.map((m, idx) => (
                    <div key={idx} style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: m.role === 'user' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                      border: m.role === 'user' ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--border-color)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}>
                        {m.role === 'user' ? 'YOU' : 'KAIROS COACH'}
                      </div>
                      <span style={{ color: '#e5e7eb' }}>{m.content}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flexGrow: 1 }}
                    placeholder="Request changes or ask coding questions..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isGenerating}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }} disabled={isGenerating}>
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
