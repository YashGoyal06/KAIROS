import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InfiniteArchitecture from '../components/InfiniteArchitecture';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const btnRef = useRef(null);

  // Spotlight button logic
  const handleMouseMove = (e) => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btnRef.current.style.setProperty('--x', `${x}px`);
      btnRef.current.style.setProperty('--y', `${y}px`);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#050505' }}>

      {/* ══════════════════════════════════════════════════════════════
          THE INFINITE CORRIDOR BACKGROUND (Z: 0)
          ══════════════════════════════════════════════════════════════ */}
      <InfiniteArchitecture />

      {/* ══════════════════════════════════════════════════════════════
          CINEMATIC OVERLAYS (Z: 5)
          ══════════════════════════════════════════════════════════════ */}
      <div className="film-grain" style={{ opacity: 0.1, zIndex: 5 }} />

      {/* Removed the vignette overlay entirely so it doesn't cover the fluid on the edges */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 5,
        pointerEvents: 'none'
      }} />

      {/* ══════════════════════════════════════════════════════════════
          FOREGROUND UI (Z: 10) - PERFECTLY CENTERED VANISHING POINT
          ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Perfect center to align with the 3D corridor
        pointerEvents: 'none' // Extremely important: lets mouse events pass through to the 3D Canvas!
      }}>

        {/* Extreme Contrast Micro-label */}
        <div
          className="geist-micro"
          style={{
            marginBottom: '40px',
            background: 'rgba(2,2,2,0.8)',
            padding: '8px 24px',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.05)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            letterSpacing: '0.2em'
          }}
        >
          ORCHESTRATION_KERNEL_ONLINE // V2.0
        </div>

        {/* Massive Brand Typograhpy */}
        <h1
          className="geist-heading"
          style={{
            color: '#ffffff',
            fontSize: '8rem', // Massive, but slightly scaled down from the monolith to fit the tunnel
            textShadow: '0 40px 80px rgba(0,0,0,1)',
            marginBottom: '40px',
            lineHeight: 0.8,
            letterSpacing: '-0.04em'
          }}
        >
          KAIROS
        </h1>

        {/* Cursor-Tracked Spotlight CTA */}
        <button
          ref={btnRef}
          className="btn-spotlight"
          onMouseMove={handleMouseMove}
          onClick={() => navigate(user ? '/dashboard' : '/onboarding')}
          style={{ pointerEvents: 'auto' }} // Re-enable pointer events just for the button
        >
          {user ? 'A c c e s s' : 'I n i t i a t e'}
          <div className="btn-spotlight-glow" />
        </button>

      </div>
    </div>
  );
}
