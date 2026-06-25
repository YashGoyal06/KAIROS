import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Award, Clock, Brain, RefreshCw, Plus, Check } from 'lucide-react';

export default function Tasks() {
  const { profile, API_BASE } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  const [tasks, setTasks] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [syncingBoard, setSyncingBoard] = useState(false);

  // Manual Task Creation State (Leader view)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newMilestoneId, setNewMilestoneId] = useState('phase_1');

  const fetchSessions = async () => {
    if (!profile) return;
    try {
      const res = await axios.get(`${API_BASE}/sessions`, {
        params: { profile_id: profile.id }
      });
      // Only show sessions that are in execution or completed phase
      const execSessions = res.data.filter(s => s.status === 'execution' || s.status === 'completed');
      setSessions(execSessions);
      if (execSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(execSessions[0].id);
      }
    } catch (e) {
      console.error("Error loading sessions for task board:", e);
    }
  };

  const fetchSessionDetails = async () => {
    if (!activeSessionId) return;
    setSyncingBoard(true);
    try {
      const sRes = await axios.get(`${API_BASE}/sessions/${activeSessionId}`);
      setActiveSession(sRes.data);

      const tasksRes = await axios.get(`${API_BASE}/sessions/${activeSessionId}/tasks`);
      setTasks(tasksRes.data);

      const blockersRes = await axios.get(`${API_BASE}/sessions/${activeSessionId}/blockers`);
      setBlockers(blockersRes.data.filter(b => b.status === 'open'));

      // Fetch team members
      if (sRes.data.team_id) {
        const teamRes = await axios.get(`${API_BASE}/teams/${sRes.data.team_id}`);
        setTeamMembers(teamRes.data.members || []);
      } else {
        // Solo, only profile is member
        setTeamMembers([profile]);
      }
    } catch (e) {
      console.error("Error loading task board data:", e);
    } finally {
      setSyncingBoard(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [profile]);

  useEffect(() => {
    fetchSessionDetails();
    setAiSuggestions('');
  }, [activeSessionId]);

  const handleStatusChange = async (taskId, nextStatus) => {
    try {
      await axios.put(`${API_BASE}/tasks/${taskId}`, { status: nextStatus });
      await fetchSessionDetails();
    } catch (e) {
      console.error("Error updating task status:", e);
    }
  };

  const handleAssigneeChange = async (taskId, assigneeId) => {
    try {
      await axios.put(`${API_BASE}/tasks/${taskId}`, { assigned_to: assigneeId || null });
      await fetchSessionDetails();
    } catch (e) {
      console.error("Error re-assigning task:", e);
    }
  };

  const handleLoadSuggestions = async () => {
    if (!activeSessionId) return;
    setLoadingSuggestions(true);
    try {
      const res = await axios.get(`${API_BASE}/sessions/${activeSessionId}/task-suggestions`);
      setAiSuggestions(res.data.suggestions);
    } catch (e) {
      console.error("Error fetching AI suggestions:", e);
      setAiSuggestions("Unable to pull recommendations at this time.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !activeSessionId) return;

    try {
      await axios.post(`${API_BASE}/sessions/${activeSessionId}/tasks`, {
        name: newTaskName,
        assigned_to: newAssigneeId || null,
        priority: newPriority,
        milestone_id: newMilestoneId
      });
      setNewTaskName('');
      setShowAddForm(false);
      await fetchSessionDetails();
    } catch (err) {
      console.error("Error adding custom task:", err);
    }
  };

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>Project Task Board</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Coordinate task distribution, trace dependency pipelines, and resolve system blockers.
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
          <button onClick={fetchSessionDetails} className="btn btn-secondary" style={{ padding: '10px 16px' }} disabled={syncingBoard}>
            <RefreshCw size={16} /> Sync Board
          </button>
        </div>
      </div>

      {!activeSessionId ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <ShieldAlert size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
          <p style={{ color: '#9ca3af' }}>No projects currently in execution. Go to the Coach page and click "Accept & Start Execution" on an active roadmap first.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Advisor Panel */}
          <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={20} style={{ color: '#8b5cf6' }} />
                <h3 style={{ fontSize: '16px', color: '#fff' }}>KAIROS Execution Engine suggestions</h3>
              </div>
              <button onClick={handleLoadSuggestions} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} disabled={loadingSuggestions}>
                {loadingSuggestions ? 'Analyzing...' : 'Ask AI for Suggestions'}
              </button>
            </div>
            {aiSuggestions && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#e5e7eb', lineHeight: '1.6' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{aiSuggestions}</pre>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Blocker Reminders */}
            <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginBottom: '12px' }}>
                <ShieldAlert size={16} style={{ color: '#ef4444' }} /> Active Project Blockers
              </h3>
              {blockers.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Awesome! No active task blockages registered.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {blockers.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#f3f4f6' }}>{b.description}</span>
                      <span style={{ fontSize: '10px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        {b.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Task Injection */}
            {activeSession && activeSession.creator_id === profile.id && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {!showAddForm ? (
                  <button onClick={() => setShowAddForm(true)} className="btn btn-secondary" style={{ width: '100%' }}>
                    + Create Custom Task
                  </button>
                ) : (
                  <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Task details..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      required
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="form-select"
                        value={newAssigneeId}
                        onChange={(e) => setNewAssigneeId(e.target.value)}
                        style={{ flexGrow: 1, fontSize: '12px' }}
                      >
                        <option value="">Assignee...</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                      <select
                        className="form-select"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        style={{ fontSize: '12px' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, padding: '8px' }}>
                        <Check size={14} /> Add
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ padding: '8px' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Kanban Columns */}
          <div className="kanban-board">
            {['pending', 'in_progress', 'completed', 'blocked'].map(statusName => {
              const columnTasks = tasks.filter(t => t.status === statusName);
              return (
                <div key={statusName} className="kanban-column">
                  <div className="column-header">
                    <span style={{ textTransform: 'capitalize' }}>
                      {statusName === 'in_progress' ? 'In Progress' : statusName}
                    </span>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                      {columnTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {columnTasks.map(t => (
                      <div key={t.id} className="task-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className={`task-tag priority-${t.priority}`}>{t.priority}</span>
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                          {t.name}
                        </div>
                        
                        {/* Assignee & Allocation (Leader customizable) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Assignee:</span>
                          <select
                            value={t.assigned_to || ''}
                            onChange={(e) => handleAssigneeChange(t.id, e.target.value)}
                            disabled={activeSession && activeSession.creator_id !== profile.id}
                            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', cursor: 'pointer', maxWidth: '120px' }}
                          >
                            <option value="">Unassigned</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
