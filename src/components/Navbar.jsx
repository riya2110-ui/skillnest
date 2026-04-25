import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { GraduationCap } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 md:px-12 py-5 relative z-50">
      <Link to="/" className="flex items-center gap-2 font-nunito text-2xl font-black text-navy tracking-tight">
        <GraduationCap size={32} className="text-blue-500" />
        SkillNest
      </Link>
      
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-8">
          {!user && (
            <>
              <span onClick={() => scrollTo('features')} className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--blue-primary)] transition-colors cursor-pointer">Features</span>
              <span onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--blue-primary)] transition-colors cursor-pointer">How it works</span>
              <span onClick={() => scrollTo('colleges')} className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--blue-primary)] transition-colors cursor-pointer">For colleges</span>
              <Link to="/login" className="text-sm font-bold text-[var(--blue-primary)] ml-4">Log in</Link>
              <button 
                onClick={() => navigate('/signup')}
                className="px-6 py-2.5 bg-[var(--navy)] text-white rounded-full font-dm-sans text-sm font-medium shadow-md shadow-[var(--navy)] hover:translate-y-[-1px] hover:shadow-lg transition-all"
              >
                Get Started Free →
              </button>
            </>
          )}
          
          {user && (
            <>
              <Link to="/dashboard" className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--blue-primary)]">Dashboard</Link>
              <Link to="/roadmap" className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--blue-primary)]">Roadmap</Link>
              <Link to="/missions" className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--blue-primary)]">Missions</Link>
              <Link to="/interview" className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--blue-primary)]">Interview</Link>
              <Link to="/tracker" className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--blue-primary)]">Tracker</Link>
              <Link to="/settings" className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--blue-primary)]">Settings</Link>
              <button 
                onClick={handleLogout}
                className="px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-bold text-sm hover:bg-rose-100 transition-all"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
