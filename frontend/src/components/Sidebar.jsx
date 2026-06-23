import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, MessageSquare, CheckSquare, Presentation, User, LogOut, Compass } from 'lucide-react';

export default function Sidebar() {
  const { logout, profile } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Compass size={28} style={{ color: '#8b5cf6' }} />
        <span>KAIROS</span>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/teams" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Teams</span>
        </NavLink>

        <NavLink to="/coach" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Coach Room</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <CheckSquare size={20} />
          <span>Task Board</span>
        </NavLink>

        <NavLink to="/pitch" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Presentation size={20} />
          <span>Pitch Deck</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      {profile && (
        <div style={{
          marginTop: 'auto',
          padding: '16px 0 0 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '14px'
            }}>
              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {profile.full_name}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {profile.primary_role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-link"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '10px 12px'
            }}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
