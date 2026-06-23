import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, CheckSquare, Calendar, Award, Code, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { profile, API_BASE } = useAuth();
  const [teams, setTeams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allBlockers, setAllBlockers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div style={{ animation: 'spinSlow 2s linear infinite' }}>●</div>
      </div>
    );
  }

  const myTasks = allTasks.filter(t => t.assigned_to === profile.id);
  const pendingTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const blockedTasks = myTasks.filter(t => t.status === 'blocked');
  const completedTasksCount = allTasks.filter(t => t.status === 'completed').length;
  const completionPercentage = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>Dashboard</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Welcome back, <span style={{ color: '#3b82f6', fontWeight: 600 }}>{profile.full_name}</span>.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
          <RefreshCw size={16} /> Sync Details
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Personal Details Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
              <Code size={18} style={{ color: '#3b82f6' }} /> Profile Status
            </h3>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Role: <strong style={{ color: '#fff' }}>{profile.primary_role}</strong></p>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px' }}>Level: <strong style={{ color: '#fff' }}>{profile.experience_level}</strong></p>
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>TECH STACK:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {profile.tech_stack?.map(tech => (
                  <span key={tech} className="tag" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Task Summary Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
            <CheckSquare size={18} style={{ color: '#10b981' }} /> Workspace Health
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>{allTasks.length}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Tasks</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{completedTasksCount}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Completed</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{allBlockers.length}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Active Blockers</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'right', marginTop: '8px' }}>
            {completionPercentage}% Tasks Done
          </div>
        </div>

        {/* Blocker Reminders Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
            <ShieldAlert size={18} style={{ color: '#ef4444' }} /> Reminders & Blockers
          </h3>
          {allBlockers.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>All tasks are running smoothly! No open blockers.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {allBlockers.map(b => (
                <div key={b.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px' }}>
                  <ShieldAlert size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#f3f4f6' }}>{b.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '24px' }}>
        {/* Teams List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
            <Users size={18} style={{ color: '#8b5cf6' }} /> Active Teams
          </h3>
          {teams.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>You haven't created or joined any teams yet. Head over to the Teams page to get started!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '12px 8px' }}>Team Name</th>
                  <th style={{ padding: '12px 8px' }}>Code</th>
                  <th style={{ padding: '12px 8px' }}>Members</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '600' }}>{t.name}</td>
                    <td style={{ padding: '12px 8px', color: '#8b5cf6', fontFamily: 'monospace', fontWeight: 'bold' }}>{t.code}</td>
                    <td style={{ padding: '12px 8px' }}>{t.members.length} member(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Ongoing Hackathons */}
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
            <Calendar size={18} style={{ color: '#ec4899' }} /> Ongoing Hackathons
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ongoingHackathons.map(h => (
              <div key={h.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>{h.name}</strong>
                  <span style={{ fontSize: '10px', color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {h.prize}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>{h.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
