import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Presentation as PresentationIcon, Loader, Download, Upload, CheckCircle2, 
  FileText, Sparkles, Layout, ChevronLeft, ChevronRight, Eye, RefreshCw, Layers
} from 'lucide-react';

export default function PresentationStudio() {
  const { profile, API_BASE } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  
  const [pitchText, setPitchText] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Template States
  const [selectedTemplate, setSelectedTemplate] = useState('template-gamma');
  const [customFile, setCustomFile] = useState(null);
  const [customAnalysis, setCustomAnalysis] = useState(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const builtInTemplates = [
    { 
      id: 'template-gamma', 
      name: 'Gamma AI Ultra (Recommended)', 
      desc: 'Gamma.app 16:9 obsidian cards with pill badges & metric blocks', 
      slides: 10,
      bg: 'linear-gradient(135deg, #090a0f 0%, #12141e 100%)',
      accentColor: '#a855f7',
      borderColor: 'rgba(168,85,247,0.6)'
    },
    { 
      id: 'template-1', 
      name: 'Cyber Neon Executive', 
      desc: 'Dark theme with purple glow & tech boxes', 
      slides: 10,
      bg: 'linear-gradient(135deg, #0d0614 0%, #170b29 50%, #0d0614 100%)',
      accentColor: '#a855f7',
      borderColor: 'rgba(168,85,247,0.3)'
    },
    { 
      id: 'template-2', 
      name: 'Minimalist Modern Tech', 
      desc: 'Clean, sleek layout with crisp typography', 
      slides: 11,
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      accentColor: '#38bdf8',
      borderColor: 'rgba(56,189,248,0.3)'
    },
    { 
      id: 'template-3', 
      name: 'Vibrant Launchpad', 
      desc: 'Dynamic pitch design with metric cards', 
      slides: 11,
      bg: 'linear-gradient(135deg, #18002e 0%, #2e0054 100%)',
      accentColor: '#f43f5e',
      borderColor: 'rgba(244,63,94,0.3)'
    },
    { 
      id: 'template-4', 
      name: 'Enterprise Architecture', 
      desc: 'Comprehensive technical & workflow deck', 
      slides: 13,
      bg: 'linear-gradient(135deg, #091224 0%, #111f38 100%)',
      accentColor: '#34d399',
      borderColor: 'rgba(52,211,153,0.3)'
    },
    { 
      id: 'template-5', 
      name: 'Futuristic AI Studio', 
      desc: 'Obsidian gradient style for AI presentations', 
      slides: 10,
      bg: 'linear-gradient(135deg, #050508 0%, #12101e 100%)',
      accentColor: '#c084fc',
      borderColor: 'rgba(192,132,252,0.3)'
    }
  ];

  const fetchSessions = async () => {
    if (!profile) return;
    try {
      const res = await axios.get(`${API_BASE}/sessions`, {
        params: { profile_id: profile.id }
      });
      const planSessions = res.data.filter(s => s.status === 'execution' || s.status === 'completed' || s.status === 'planning');
      setSessions(planSessions);
      if (planSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(planSessions[0].id);
      }
    } catch (e) {
      console.error("Error loading sessions for presentation studio:", e);
    }
  };

  const [sessionTasks, setSessionTasks] = useState([]);

  const fetchSessionDetails = async () => {
    if (!activeSessionId) return;
    try {
      const res = await axios.get(`${API_BASE}/sessions/${activeSessionId}`);
      setActiveSession(res.data);
      if (res.data.pitch_outline && res.data.pitch_outline.full_raw) {
        setPitchText(res.data.pitch_outline.full_raw);
      } else {
        setPitchText('');
      }

      // Fetch tasks for task metrics slide
      try {
        const tasksRes = await axios.get(`${API_BASE}/tasks/session/${activeSessionId}`);
        setSessionTasks(tasksRes.data || []);
      } catch (tErr) {
        setSessionTasks([]);
      }
    } catch (e) {
      console.error("Error loading presentation details:", e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [profile]);

  useEffect(() => {
    fetchSessionDetails();
  }, [activeSessionId]);

  const handleCustomFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.pptx')) {
      alert('Please upload a valid .pptx presentation file.');
      return;
    }

    setCustomFile(file);
    setIsAnalyzingCustom(true);
    setCustomAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/sessions/${activeSessionId}/pitch/analyze-custom-template`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCustomAnalysis(res.data.analysis);
      setSelectedTemplate('custom');
    } catch (err) {
      console.error("Error analyzing custom template:", err);
      alert("Failed to analyze uploaded PPTX template.");
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const handleDownloadPPTX = async () => {
    if (!activeSessionId) return;
    setIsDownloading(true);

    try {
      const formData = new FormData();
      if (selectedTemplate === 'custom' && customFile) {
        formData.append('file', customFile);
      } else {
        formData.append('template_id', selectedTemplate);
      }

      const res = await axios.post(`${API_BASE}/sessions/${activeSessionId}/pitch/export-pptx`, formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeSession?.name || 'KAIROS'}_Presentation.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading PPTX:", err);
      alert("Failed to download PPTX file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!activeSessionId) return;
    setIsDownloading(true);

    try {
      const res = await axios.post(`${API_BASE}/sessions/${activeSessionId}/pitch/export-pdf`, {}, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeSession?.name || 'KAIROS'}_Presentation.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getSlidePreviews = () => {
    const title = activeSession?.name || 'Project Pitch';
    const problem = activeSession?.problem_statement || 'Addressing hackathon project planning and execution challenges.';
    const idea = activeSession?.user_idea || 'AI Hackathon Execution Platform';

    const milestones = activeSession?.milestones || [];
    const msBullets = milestones.map(m => `${m.title || 'Milestone'}: ${m.status || 'In Progress'}`);

    const taskBullets = sessionTasks.slice(0, 6).map(t => `${t.name || 'Task'} [${t.priority || 'High'}]`);

    const rawOutline = activeSession?.pitch_outline?.full_raw || '';

    const userName = profile?.full_name || 'Innovator';
    const userRole = profile?.tech_stack ? profile.tech_stack.split(',')[0] : 'Fullstack Engineer';
    const userSkills = profile?.tech_stack || 'Python, React, FastAPI';

    return [
      {
        num: 1,
        title: title,
        subtitle: idea,
        category: 'Title & Vision',
        bullets: ['AI-Driven Co-Founder Engine', 'Real-Time Task Syncing', 'Zero-Overflow Slide Generation']
      },
      {
        num: 2,
        title: 'Problem Statement & Vision',
        subtitle: problem,
        category: 'Problem & Value',
        bullets: ['Loss of project momentum during hackathons', 'Unstructured milestone management', 'Manual pitch slide design overhead']
      },
      {
        num: 3,
        title: 'Core Solution & Product Demo',
        subtitle: rawOutline ? rawOutline.slice(0, 100) + '...' : 'Real-time AI workflow engine for execution teams.',
        category: 'Product Demo',
        bullets: ['Interactive AI Coach Room', 'Task Board with AI Blocker Assistance', 'Instant PPTX & PDF Presentation Suite']
      },
      {
        num: 4,
        title: 'System Architecture & Stack',
        subtitle: 'FastAPI backend, Supabase DB, React 19 UI.',
        category: 'Architecture',
        bullets: ['FastAPI Async Backend', 'Supabase Database & Auth', 'Claude LLM Broker & Agents']
      },
      {
        num: 5,
        title: 'Roadmap & Execution Plan',
        subtitle: 'Sprint Milestones',
        category: 'Roadmap',
        bullets: msBullets.length > 0 ? msBullets : ['Phase 1: Architecture & DB Setup', 'Phase 2: AI Coach & Task Sync', 'Phase 3: Presentation Studio Export']
      },
      {
        num: 6,
        title: 'Sprint Tasks & Progress',
        subtitle: 'Execution Metrics',
        category: 'Task Metrics',
        bullets: taskBullets.length > 0 ? taskBullets : ['Task 1: Supabase Setup', 'Task 2: AI Scope Review', 'Task 3: Slide Export Engine']
      },
      {
        num: 7,
        title: 'Team & Technical Mastery',
        subtitle: `Lead: ${userName} (${userRole})`,
        category: 'Team Profile',
        bullets: [`Lead: ${userName}`, `Role: ${userRole}`, `Skills: ${userSkills}`]
      },
      {
        num: 8,
        title: 'Pitch Showcase & Impact',
        subtitle: rawOutline ? rawOutline.slice(0, 100) + '...' : 'KAIROS provides an end-to-end execution co-founder.',
        category: 'Value Showcase',
        bullets: ['Reduces pitch compilation time by 90%', 'Guarantees zero text overflow across all templates', 'Professional PPTX and PDF output streams']
      },
      {
        num: 9,
        title: 'Risk Mitigation & Support',
        subtitle: 'Resilience Strategy',
        category: 'Risk Management',
        bullets: ['LLM rate-limit fallback routing', 'Resilient database connection pools', 'Validated slide placeholder mapping']
      },
      {
        num: 10,
        title: 'Conclusion & Next Steps',
        subtitle: 'Ready for Live Execution',
        category: 'Call to Action',
        bullets: ['Launch local servers', 'Test live presentation decks', 'Submit project to judges']
      }
    ];
  };

  const slides = getSlidePreviews();
  const currentSlide = slides[activeSlideIndex] || slides[0];
  const activeT = builtInTemplates.find(t => t.id === selectedTemplate) || builtInTemplates[0];

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, overflowY: 'auto', paddingBottom: '60px' }}>
      {/* Top Header */}
      <div className="dashboard-header" style={{ marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PresentationIcon size={32} style={{ color: '#a855f7' }} /> Presentation Studio & Live PPTX Preview
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Preview slides in real-time, switch templates with zero text overflow, and export `.pptx` or `.pdf`.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleDownloadPPTX} 
            disabled={isDownloading || !activeSessionId} 
            className="btn btn-primary" 
            style={{ padding: '12px 20px', fontSize: '14px', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', boxShadow: '0 4px 14px rgba(168,85,247,0.4)' }}
          >
            <Download size={16} /> {isDownloading ? 'Exporting...' : 'Download .PPTX'}
          </button>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading || !activeSessionId} 
            className="btn btn-secondary" 
            style={{ padding: '12px 20px', fontSize: '14px' }}
          >
            <FileText size={16} /> Download .PDF
          </button>
        </div>
      </div>

      {/* Session Switcher Header Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 600 }}>Active Project Session:</span>
          <select 
            className="form-input" 
            style={{ padding: '8px 16px', minWidth: '240px', background: 'rgba(0,0,0,0.4)' }}
            value={activeSessionId}
            onChange={(e) => setActiveSessionId(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
            ))}
          </select>
        </div>

        <button onClick={fetchSessionDetails} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Slide Template Selection Bar */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layout size={18} style={{ color: '#c084fc' }} /> Slide Template Engine (Master `.pptx` Files Preserved)
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>
              Replaces placeholder text directly inside your original template files (`Template-1.pptx` – `Template-5.pptx`) while retaining all background graphics, layout shapes, and vector designs intact.
            </p>
          </div>

          <label className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={14} />
            {isAnalyzingCustom ? 'Analyzing...' : 'Upload Custom .PPTX'}
            <input type="file" accept=".pptx" onChange={handleCustomFileUpload} style={{ display: 'none' }} disabled={isAnalyzingCustom} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
          {builtInTemplates.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: selectedTemplate === t.id ? `2px solid ${t.accentColor}` : '1px solid rgba(255,255,255,0.06)',
                background: selectedTemplate === t.id ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedTemplate === t.id ? `0 0 16px ${t.accentColor}40` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{t.name}</span>
                {selectedTemplate === t.id && <CheckCircle2 size={16} style={{ color: t.accentColor }} />}
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px 0', lineHeight: '1.4' }}>{t.desc}</p>
              <span style={{ fontSize: '10px', color: t.accentColor, background: `${t.accentColor}20`, padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {t.slides} Slides
              </span>
            </div>
          ))}

          {customFile && (
            <div
              onClick={() => setSelectedTemplate('custom')}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: selectedTemplate === 'custom' ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.06)',
                background: selectedTemplate === 'custom' ? 'rgba(52,211,153,0.15)' : 'rgba(0,0,0,0.25)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {customFile.name}
                </span>
                {selectedTemplate === 'custom' && <CheckCircle2 size={16} style={{ color: '#34d399' }} />}
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 8px 0' }}>Uploaded PPTX Template</p>
              {customAnalysis && (
                <span style={{ fontSize: '10px', color: '#34d399', background: 'rgba(52,211,153,0.2)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Mapped {customAnalysis.slide_count} Slides
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive PPT Preview Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', flexGrow: 1 }}>
        
        {/* Left Pane - Slide Thumbnails List */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '620px', overflowY: 'auto' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#a1a1aa', letterSpacing: '0.05em', margin: '0 0 4px 0', fontWeight: 700 }}>
            Slide Deck ({slides.length})
          </h4>

          {slides.map((s, idx) => (
            <div
              key={s.num}
              onClick={() => setActiveSlideIndex(idx)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeSlideIndex === idx ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                border: activeSlideIndex === idx ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: activeSlideIndex === idx ? '#a855f7' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.num}
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <h5 style={{ fontSize: '12px', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                  {s.title}
                </h5>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>{s.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Pane - Full 16:9 Interactive Slide Canvas Preview */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', minHeight: '540px' }}>
          
          {/* Slide Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} style={{ color: activeT.accentColor }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                Slide {currentSlide.num} of {slides.length} — <span style={{ color: activeT.accentColor }}>{currentSlide.category}</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                disabled={activeSlideIndex === 0}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button 
                onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 16:9 Presentation Frame Preview Box */}
          <div 
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: activeT.bg,
              borderRadius: '12px',
              border: `1px solid ${activeT.borderColor}`,
              boxShadow: `0 12px 36px rgba(0,0,0,0.6)`,
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Template Glow Accent */}
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: activeT.accentColor, filter: 'blur(80px)', opacity: 0.25 }} />

            {/* Slide Header */}
            <div>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: activeT.accentColor, fontWeight: 700 }}>
                {activeSession?.name || 'KAIROS PRESENTATION'}
              </span>
              <h2 style={{ fontSize: '28px', color: '#fff', fontWeight: 800, margin: '8px 0 4px 0', lineHeight: 1.2 }}>
                {currentSlide.title}
              </h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Slide Bullet Items (Anti-Overflow Layout Box) */}
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentSlide.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeT.accentColor}` }}>
                  <Sparkles size={14} style={{ color: activeT.accentColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>{b}</span>
                </div>
              ))}
            </div>

            {/* Slide Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>KAIROS Anti-Overflow Slide Engine</span>
              <span style={{ fontSize: '11px', color: activeT.accentColor, fontWeight: 700 }}>Slide {currentSlide.num}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
