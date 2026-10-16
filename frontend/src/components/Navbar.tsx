/**
 * ONCOGENIX AI - Navigation Bar
 * Responsive biotech navbar with glowing accents, route highlights, and authentication state.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dna, Activity, User as UserIcon, LogOut, Menu, X, Shield, History, GitCompare } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem('oncogenix_user');
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-dark-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 shadow-cyan-glow transition-all">
            <Dna className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-white">ONCOGENIX</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500 text-dark-950">AI</span>
            </div>
            <span className="text-[9px] tracking-widest text-slate-400 font-mono -mt-1 uppercase">Precision Oncology</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              isActive('/dashboard') ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/analysis"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              isActive('/analysis') ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            DNA Analysis
          </Link>
          <Link
            to="/comparison"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              isActive('/comparison') ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Comparison
          </Link>
          <Link
            to="/history"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              isActive('/history') ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            History
          </Link>
          <Link
            to="/about"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              isActive('/about') ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Methodology
          </Link>
          {user?.is_staff && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/admin') ? 'text-violet-400 bg-violet-950/40 border border-violet-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Auth CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800">
                <UserIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-slate-200">{user.username}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono uppercase">
                  {user.role || 'Patient'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-dark-900/80 border border-slate-800 hover:border-slate-700 transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-xl text-sm font-semibold text-dark-950 bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 shadow-cyan-glow transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-dark-950 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            Dashboard
          </Link>
          <Link
            to="/analysis"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            DNA Analysis
          </Link>
          <Link
            to="/comparison"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            Patient Comparison
          </Link>
          <Link
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            History & Reports
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            Methodology & Limitations
          </Link>

          <div className="pt-3 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyan-300 font-mono">{user.username} ({user.role})</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 text-xs"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg border border-slate-800 text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-cyan-400 text-dark-950 text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
