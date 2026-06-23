import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play } from 'lucide-react';

export default function Landing() {
  const { user, profile, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (profile) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#08090c' }}>
        <div style={{ fontFamily: 'Outfit', fontSize: '24px', letterSpacing: '0.1em', animation: 'spinSlow 2s linear infinite' }}>●</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100vw',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.15) 0%, rgba(8, 9, 12, 1) 70%)',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        <div style={{
          fontFamily: 'Outfit',
          fontSize: '64px',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
          letterSpacing: '-0.03em'
        }}>
          KAIROS
        </div>
        <p style={{
          fontFamily: 'Outfit',
          fontSize: '24px',
          color: '#f3f4f6',
          marginBottom: '24px',
          fontWeight: 400
        }}>
          Your Intelligent Hackathon Co-Founder & Execution Engine
        </p>
        <p style={{
          fontFamily: 'Plus Jakarta Sans',
          fontSize: '16px',
          color: '#9ca3af',
          lineHeight: '1.7',
          marginBottom: '40px',
          maxWidth: '600px',
          marginRight: 'auto',
          marginLeft: 'auto'
        }}>
          Translate raw ideas into scoped roadmaps, synchronize member profiles, track dependency blockers in real-time, and auto-generate pitch decks configured to win.
        </p>
        <button
          onClick={loginWithGoogle}
          className="btn btn-primary"
          style={{
            fontSize: '16px',
            padding: '16px 36px',
            borderRadius: '30px'
          }}
        >
          <Play size={18} /> Sign In with Google
        </button>
      </div>
    </div>
  );
}
