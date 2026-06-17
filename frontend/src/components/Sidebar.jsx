import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, MessageSquare, CheckSquare, Presentation, User, LogOut, Compass, Settings, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const { logout, profile } = useAuth();

  return (
    <div className="sidebar-kairos">
      <div className="sidebar-logo-kairos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '32px' }}>
        <span style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)', color: '#ffffff', fontWeight: 'bold', fontSize: '24px', letterSpacing: '0.05em' }}>KAIROS</span>
      </div>

      <nav className="sidebar-menu-kairos">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link-kairos ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/teams" className={({ isActive }) => `sidebar-link-kairos ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Teams</span>
        </NavLink>

        <NavLink to="/coach" className={({ isActive }) => `sidebar-link-kairos ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Coach Room</span>
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `sidebar-link-kairos ${isActive ? 'active' : ''}`}>
          <CheckSquare size={20} />
          <span>Task Board</span>
        </NavLink>

        <NavLink to="/pitch" className={({ isActive }) => `sidebar-link-kairos ${isActive ? 'active' : ''}`}>
          <Presentation size={20} />
          <span>Pitch Deck</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `sidebar-link-kairos ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {profile && (
          <button
            onClick={logout}
            className="sidebar-link-kairos"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '12px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: '#6b7280'
            }}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}

