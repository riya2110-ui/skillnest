import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser, UserProvider } from './context/UserContext';
import { AnimatePresence } from 'framer-motion';

import Home      from './pages/Home';
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import Onboarding  from './pages/Onboarding';
import Dashboard   from './pages/Dashboard';
import Roadmap     from './pages/Roadmap';
import PracticeCenter from './pages/PracticeCenter';
import Applications from './pages/Applications';
import Missions    from './pages/Missions';
import Community   from './pages/Community';
import Settings    from './pages/Settings';
import Navbar      from './components/Navbar';
import LoadingScreen   from './components/LoadingScreen';

function SmartRoute({ children, requireAuth, requireOnboarding, guestOnly }) {
  const { user, loadingAuth } = useUser();

  if (loadingAuth) return <LoadingScreen />;

  const isUserOnboarded = user?.onboardingDone || !!user?.roadmap;

  if (guestOnly && user && isUserOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }
  if (guestOnly && user && !isUserOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && user && !isUserOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-1)] font-dm-sans selection:bg-blue-400/30">
          <AnimatePresence mode="wait">
            <Routes>
            <Route path="/" element={
              <SmartRoute guestOnly><Navbar /><Home /></SmartRoute>
            }/>
            <Route path="/login" element={
              <SmartRoute guestOnly><Login /></SmartRoute>
            }/>
            <Route path="/signup" element={
              <SmartRoute guestOnly><Signup /></SmartRoute>
            }/>

            <Route path="/onboarding" element={
              <SmartRoute requireAuth><Onboarding /></SmartRoute>
            }/>

            <Route path="/dashboard" element={
              <SmartRoute requireAuth requireOnboarding><Dashboard /></SmartRoute>
            }/>
            <Route path="/missions" element={
              <SmartRoute requireAuth requireOnboarding><Missions /></SmartRoute>
            }/>
            <Route path="/roadmap" element={
              <SmartRoute requireAuth requireOnboarding><Roadmap /></SmartRoute>
            }/>
            <Route path="/interview" element={
              <SmartRoute requireAuth requireOnboarding><PracticeCenter /></SmartRoute>
            }/>
            <Route path="/applications" element={
              <SmartRoute requireAuth requireOnboarding><Applications /></SmartRoute>
            }/>
            <Route path="/community" element={
              <SmartRoute requireAuth requireOnboarding><Community /></SmartRoute>
            }/>
            <Route path="/settings" element={
              <SmartRoute requireAuth requireOnboarding><Settings /></SmartRoute>
            }/>

            <Route path="*" element={<Navigate to="/" replace />}/>
          </Routes>
        </AnimatePresence>
      </div>
      </BrowserRouter>
    </UserProvider>
  );
}
