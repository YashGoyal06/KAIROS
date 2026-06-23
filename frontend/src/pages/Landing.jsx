import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, AlertTriangle } from 'lucide-react';

export default function Landing() {
  const { user, profile, loginWithGoogle, loading, supabaseConfigured } = useAuth();
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

        {!supabaseConfigured && (
          <div style={{
            marginTop: '24px',
            padding: '14px 20px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'left'
          }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ color: '#fbbf24', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                Supabase not configured
              </div>
              <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: '1.6' }}>
                Add your credentials to <code style={{ color: '#f59e0b', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '3px' }}>frontend/.env</code>:
                <br />
                <code style={{ color: '#34d399', fontSize: '11px' }}>VITE_SUPABASE_URL</code> and <code style={{ color: '#34d399', fontSize: '11px' }}>VITE_SUPABASE_ANON_KEY</code>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
