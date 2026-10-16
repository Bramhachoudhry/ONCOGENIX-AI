/**
 * ONCOGENIX AI - Login Page
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dna, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login({
        username_or_email: usernameOrEmail,
        password: password,
      });
      const dest = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(dest);
    } catch (err: any) {
      const msg = err.response?.data?.non_field_errors?.[0] ||
                  err.response?.data?.detail ||
                  "Invalid username or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsernameOrEmail("demooncologist");
    setPassword("Password123!");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-tech-grid relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-slate-800 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Dna className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access ONCOGENIX AI</h2>
          <p className="text-xs text-slate-400">
            Sign in to access your genomic profiling dashboard and analyses
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="oncologist@hospital.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Access Option */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center justify-center gap-1 mx-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Quick Demo Fill (Clinician Demo Account)
          </button>
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-medium">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
