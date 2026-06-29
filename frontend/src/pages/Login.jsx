import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import DarkVeil from '../components/ui/DarkVeil';

const Login = () => {
    const { user, profile, loading, loginWithGoogle } = useAuth();

    // If user is already authenticated, redirect to appropriate view
    if (user && !loading) {
        if (profile) {
            return <Navigate to="/dashboard" replace />;
        } else {
            return <Navigate to="/onboarding" replace />;
        }
    }

    return (
        <div className="login-page-wrapper">
            {/* DarkVeil Background layer matching the website's purple theme (hueShift=280) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
                <DarkVeil 
                    hueShift={280} 
                    speed={0.4} 
                    noiseIntensity={0.06} 
                    scanlineIntensity={0.15} 
                    scanlineFrequency={1.8}
                    warpAmount={0.3}
                />
            </div>
            <style>{`
                @keyframes pageFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(1.02);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes cardSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .login-page-wrapper {
                    background-color: #050505;
                    color: #ffffff;
                    font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    animation: pageFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .login-page-wrapper * {
                    box-sizing: border-box;
                    -webkit-font-smoothing: antialiased;
                }

                /* Glassmorphism Interface Container */
                .auth-container {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 400px;
                    min-height: 380px;
                    padding: 70px 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    background: rgba(22, 19, 28, 0.45);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
                    border-radius: 16px;
                    animation: cardSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
                    opacity: 0;
                }

                .header {
                    margin-bottom: 60px;
                    text-align: center;
                }

                .header h1 {
                    font-family: var(--font-display), 'Dosis', sans-serif;
                    font-weight: 800;
                    font-size: 2.8rem;
                    line-height: 0.95;
                    letter-spacing: -1px;
                    margin: 0;
                    color: #ffffff;
                    text-transform: uppercase;
                }

                /* Simplified clean submit wrap */
                .submit-wrap {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .btn-base {
                    background: #ffffff;
                    color: #000000;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 12px 24px;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    width: 100%;
                    max-width: 250px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                }

                .btn-base:hover {
                    background: #f3f4f6;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(161, 0, 242, 0.25);
                }
            `}</style>

            <main className="auth-container">
                <header className="header">
                    <h1>ACCESS<br/>KAIROS</h1>
                </header>

                <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); loginWithGoogle(); }} style={{ width: '100%' }}>
                    <div className="submit-wrap">
                        <button type="submit" className="btn-base">
                            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                            </svg>
                            SIGN IN WITH GOOGLE
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default Login;
