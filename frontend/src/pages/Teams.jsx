import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Key, RefreshCw, Layers, Shield } from 'lucide-react';

import { Component as ThreeDotsLoader } from '../components/ui/3-dots-loader';

export default function Teams() {
  const { profile, API_BASE } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activeTeam, setActiveTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/teams/user/${profile.id}`);
      setTeams(res.data);
      if (res.data.length > 0 && !activeTeamId) {
        setActiveTeamId(res.data[0].id);
      }
    } catch (e) {
      console.error("Error loading teams:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTeamDetails = async () => {
    if (!activeTeamId) return;
    try {
      const res = await axios.get(`${API_BASE}/teams/${activeTeamId}`);
      setActiveTeam(res.data);
    } catch (e) {
      console.error("Error fetching team details:", e);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [profile]);

  useEffect(() => {
    fetchActiveTeamDetails();
  }, [activeTeamId]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/teams`, {
        name: teamName,
        leader_id: profile.id
      });
      setTeamName('');
      alert(`Team created successfully! Code: ${res.data.code}`);
      await fetchTeams();
      setActiveTeamId(res.data.id);
    } catch (err) {
      console.error("Error creating team:", err);
      alert("Error creating team.");
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!teamCode.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/teams/join`, {
        code: teamCode.trim(),
        profile_id: profile.id
      });
      setTeamCode('');
      alert(`Successfully joined team: ${res.data.name}`);
      await fetchTeams();
      setActiveTeamId(res.data.id);
    } catch (err) {
      console.error("Error joining team:", err);
      alert(err.response?.data?.detail || "Error joining team. Check your code.");
    }
  };

  const handleSyncDetails = async () => {
    if (!activeTeamId) return;
    try {
      const res = await axios.post(`${API_BASE}/teams/${activeTeamId}/sync`);
      setActiveTeam(res.data);
      alert("Synchronized master JSON with updated member details!");
    } catch (err) {
      console.error("Error syncing master JSON:", err);
      alert("Failed to sync team details.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <ThreeDotsLoader />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>Teams Dashboard</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Coordinate and sync skills profiles with teammates.
          </p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Create / Join Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
              <Plus size={18} style={{ color: '#10b981' }} /> Create Team
            </h3>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aegis Hackers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Create Team
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
              <Key size={18} style={{ color: '#8b5cf6' }} /> Join Team
            </h3>
            <form onSubmit={handleJoinTeam}>
              <div className="form-group">
                <label className="form-label">Join Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. KAI-ABCD"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                Join Team
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '16px' }}>
              <Users size={18} style={{ color: '#ec4899' }} /> Your Teams
            </h3>
            {teams.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>You aren't in any teams yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTeamId(t.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: activeTeamId === t.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                      border: activeTeamId === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border-color)',
                      color: activeTeamId === t.id ? '#60a5fa' : '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{t.name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8b5cf6', fontWeight: 'bold' }}>
                      {t.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Details & Master JSON */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTeam ? (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', color: '#fff' }}>{activeTeam.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      CODE: {activeTeam.code}
                    </span>
                    {activeTeam.leader_id === profile.id && (
                      <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} /> Team Leader
                      </span>
                    )}
                  </div>
                </div>
                
                {activeTeam.leader_id === profile.id && (
                  <button onClick={handleSyncDetails} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    <RefreshCw size={14} /> Fetch Latest Details
                  </button>
                )}
              </div>

              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>Team Members</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {activeTeam.members.map(m => (
                  <div key={m.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{m.full_name}</strong>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{m.primary_role}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{m.experience_level}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                      {m.tech_stack.map(tech => (
                        <span key={tech} style={{ fontSize: '9px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px' }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '12px' }}>
                <Layers size={16} style={{ color: '#8b5cf6' }} /> Synchronized Skills Master JSON
              </h3>
              <div style={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#34d399' }}>
                  {JSON.stringify(activeTeam.master_json, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#9ca3af' }}>Select or create a team to see synchronization details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
