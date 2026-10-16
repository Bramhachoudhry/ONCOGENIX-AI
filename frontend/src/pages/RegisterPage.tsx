/**
 * ONCOGENIX AI - Registration Page
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dna, Lock, User as UserIcon, Mail, Building, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
    role: 'oncologist',
    institution: '',
    consent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.consent) {
      setError("You must acknowledge the research and clinical data consent terms.");
      return;
    }

    setLoading(true);
    try {
      await api.register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.username?.[0] ||
                  err.response?.data?.email?.[0] ||
                  err.response?.data?.password?.[0] ||
                  "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-tech-grid relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel w-full max-w-lg rounded-2xl p-8 border border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Dna className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Clinical Account</h2>
          <p className="text-xs text-slate-400">
            Join the ONCOGENIX AI Precision Oncology Research Network
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Eleanor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Vance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Username *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="evance_onco"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vance@onco.org"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option value="oncologist">Clinical Oncologist</option>
                <option value="researcher">Bioinformatics Researcher</option>
                <option value="patient">Patient / Advocate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Institution / Hospital</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Cancer Institute"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password *</label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password *</label>
              <input
                type="password"
                required
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-dark-950 text-cyan-500 focus:ring-cyan-400"
              />
              <span className="text-xs text-slate-400 leading-relaxed">
                I understand that ONCOGENIX AI is a research decision-support tool. Uploaded genomic assays will be stored securely with patient data isolation.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-400 to-electric-500 hover:from-cyan-300 hover:to-electric-400 text-dark-950 shadow-cyan-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                Registering...
              </span>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
