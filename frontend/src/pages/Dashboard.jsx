import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';
import { getTechIconUrl } from '../utils/techIcons';

export default function Dashboard() {
  const { profile, API_BASE, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allBlockers, setAllBlockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('telemetry');

  // Predefined Ongoing Hackathons
  const ongoingHackathons = [
    { id: 1, name: "Google GSOC Hackathon 2026", date: "June 20 - July 18, 2026", prize: "$50,000 Pool" },
    { id: 2, name: "Supabase open source Challenge", date: "July 01 - July 15, 2026", prize: "Developer Grants" },
    { id: 3, name: "Global Gemini GenAI hackathon", date: "August 10 - August 25, 2026", prize: "Cloud Credits" }
  ];

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // 1. Fetch user teams
      const teamsRes = await axios.get(`${API_BASE}/teams/user/${profile.id}`);
      setTeams(teamsRes.data);

      // 2. Fetch all sessions
      const sessionsRes = await axios.get(`${API_BASE}/sessions`);
      const userSessions = sessionsRes.data.filter(s => 
        s.creator_id === profile.id || teamsRes.data.some(t => t.id === s.team_id)
      );
      setSessions(userSessions);

      // 3. For each session, fetch tasks & blockers
      let compiledTasks = [];
      let compiledBlockers = [];
      
      for (const s of userSessions) {
        try {
          const tasksRes = await axios.get(`${API_BASE}/sessions/${s.id}/tasks`);
          compiledTasks = [...compiledTasks, ...tasksRes.data];

          const blockersRes = await axios.get(`${API_BASE}/sessions/${s.id}/blockers`);
          compiledBlockers = [...compiledBlockers, ...blockersRes.data.filter(b => b.status === 'open')];
        } catch (e) {
          console.error(`Error loading data for session ${s.id}`, e);
        }
      }
      
      setAllTasks(compiledTasks);
      setAllBlockers(compiledBlockers);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ animation: 'spinSlow 2s linear infinite', color: '#ec4899', fontSize: '24px' }}>●</div>
      </div>
    );
  }

  const completedTasksCount = allTasks.filter(t => t.status === 'completed').length;
  const completionPercentage = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;

  return (
    <div className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Space */}
      <div className="dashboard-header-container">
        <div className="dashboard-header-top">
          <div className="welcome-section">
            <h1 className="welcome-title">Dashboard</h1>
            <p className="welcome-subtitle">
              Welcome back, <span className="welcome-name">Azhaan Ali Siddiqui</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Modular Dashboard Grid */}
      <div className="kairos-dashboard-grid">
        
        {/* Card 1: KAIROS Data Insights */}
        <div className="kairos-col-left">
          {/* Card 1a: Profile Status */}
          <div className="kairos-card">
            <div className="kairos-card-header">/// PROFILE_STATUS</div>
            <div className="kairos-metric-large" style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px' }}>
              {profile?.primary_role || "Full Stack Developer"}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
              LEVEL: <span style={{ color: '#ffffff', fontWeight: '600' }}>{(profile?.experience_level || "Intermediate").toUpperCase()}</span>
            </div>
          </div>

          {/* Card 1b: Tech Stack tag cluster */}
          <div className="kairos-card" style={{ flexGrow: 1 }}>
            <div className="kairos-card-header">/// TECH_STACK</div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', 
              gap: '10px',
              marginTop: '12px'
            }}>
              {(profile?.tech_stack && profile.tech_stack.length > 0 ? profile.tech_stack : ["React", "FastAPI", "Python", "Docker", "Supabase"]).map(tech => (
                <div 
                  key={tech} 
                  title={tech}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(236, 72, 153, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <img 
                    src={getTechIconUrl(tech)} 
                    alt={tech} 
                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('.fallback-icon-text')) {
                        const span = document.createElement('span');
                        span.className = 'fallback-icon-text';
                        span.style.fontSize = '10px';
                        span.style.fontWeight = 'bold';
                        span.style.fontFamily = 'monospace';
                        span.style.color = '#ec4899';
                        span.innerText = tech.slice(0, 2).toUpperCase();
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Workspace Health */}
        <div className="kairos-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="kairos-card-header">/// WORKSPACE_HEALTH</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', fontFamily: 'monospace', minWidth: '40px' }}>
                {allTasks.length}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tasks</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#00FF66', fontFamily: 'monospace', minWidth: '40px', textShadow: '0 0 10px rgba(0, 255, 102, 0.4)' }}>
                {completedTasksCount}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{ 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  fontFamily: 'monospace', 
                  minWidth: '40px',
                  color: allBlockers.length === 0 ? '#00FF66' : '#ec4899', 
                  textShadow: allBlockers.length === 0 ? '0 0 10px rgba(0, 255, 102, 0.3)' : '0 0 10px rgba(236, 72, 153, 0.3)'
                }}
              >
                {allBlockers.length}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Blockers</div>
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ color: '#9ca3af' }}>TASK PROGRESS</span>
              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{completionPercentage}% Done</span>
            </div>
            <div className="progress-bar-container-kairos">
              <div 
                className="progress-bar-fill-kairos" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Active Teams */}
        <div className="kairos-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="kairos-card-header">/// ACTIVE_TEAMS</div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {teams.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '12px', lineHeight: '1.6' }}>
                You haven't created or joined any teams yet... head to the Teams page.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {teams.slice(0, 4).map(t => (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '80px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8b5cf6', marginTop: '2px', fontWeight: 'bold' }}>
                        {t.code}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px' }}>
                      {t.members.length} member{t.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row span cards */}
        <div className="kairos-row-bottom">
          
          {/* Card 4: System-Level Insights / Kernel Decisions */}
          <div className="kairos-card kairos-card-velvet" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
            <div>
              <div className="kairos-card-header">/// KERNEL_DECISIONS</div>
              <p style={{ color: '#ffffff', fontSize: '13px', lineHeight: '1.6', marginTop: '8px' }}>
                All tasks are running smoothly. No open blockers.
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button onClick={fetchData} className="btn-kairos-action" style={{ width: '100%' }}>
                RE-INITIALIZE SEQUENCE
              </button>
            </div>
          </div>

          {/* Card 5: Ongoing Hackathons */}
          <div className="kairos-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', minHeight: '180px' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div className="kairos-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>/// ONGOING_HACKATHONS</span>
                <span style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'monospace' }}>ACTIVE FEED: 3</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {ongoingHackathons.map(h => (
                  <div key={h.id} className="hackathon-list-item">
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                        {h.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                        {h.date}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {h.prize}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
