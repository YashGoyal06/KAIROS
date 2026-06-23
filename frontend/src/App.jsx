import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Coach from './pages/Coach';
import Tasks from './pages/Tasks';
import Pitch from './pages/Pitch';
import Profile from './pages/Profile';

// Route guards
const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#08090c' }}>
        <div style={{ fontFamily: 'Outfit', fontSize: '24px', letterSpacing: '0.1em', animation: 'spinSlow 2s linear infinite' }}>●</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div style={{ flexGrow: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Onboarding Page (Required for new authenticated users) */}
        <Route path="/onboarding" element={
          <ProtectedRouteOnboarding>
            <Onboarding />
          </ProtectedRouteOnboarding>
        } />

        {/* Protected Dashboard Workspace */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/teams" element={
          <ProtectedRoute>
            <MainLayout><Teams /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/coach" element={
          <ProtectedRoute>
            <MainLayout><Coach /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/tasks" element={
          <ProtectedRoute>
            <MainLayout><Tasks /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/pitch" element={
          <ProtectedRoute>
            <MainLayout><Pitch /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout><Profile /></MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Special guard for onboarding
const ProtectedRouteOnboarding = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#08090c' }}>
        <div style={{ fontFamily: 'Outfit', fontSize: '24px', letterSpacing: '0.1em', animation: 'spinSlow 2s linear infinite' }}>●</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
