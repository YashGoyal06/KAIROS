import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FooterCTA() {
  const navigate = useNavigate();

  return (
    <footer style={{
      width: '100%',
      background: '#010101',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8rem 2rem 4rem 2rem',
      position: 'relative',
      zIndex: 20,
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center', marginBottom: '6rem' }}>
        <h2 className="geist-heading" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.02em', marginBottom: '2rem' }}>
          Ready to Orchestrate?
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', marginBottom: '3rem', fontWeight: 300 }}>
          Initialize your architecture with the KAIROS kernel today.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            background: 'transparent',
            color: '#C679A8',
            border: '1px solid #C679A8',
            padding: '1rem 3rem',
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(198,121,168,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(198,121,168,0.1)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(198,121,168,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(198,121,168,0.2)';
          }}
        >
          Initialize Sequence
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        <div className="geist-heading" style={{ fontSize: '1.5rem', letterSpacing: '-0.04em' }}>
          KAIROS
        </div>
        <div className="geist-micro" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', display: 'flex', gap: '2rem' }}>
          <span style={{ cursor: 'pointer' }}>KERNEL DOCS</span>
          <span style={{ cursor: 'pointer' }}>ARCHITECTURE</span>
          <span style={{ cursor: 'pointer' }}>SYSTEM STATUS</span>
        </div>
        <div className="geist-micro" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
          © 2026 KAIROS ORCHESTRATION. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
