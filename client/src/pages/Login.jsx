import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Ruler, Shield, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login = () => {
  const [loginId, setLoginId] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin@123');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!loginId || !password) {
      error('Please enter email/username and password');
      return;
    }

    try {
      setIsLoading(true);
      await login({ login: loginId, password });
      success('Welcome back to TailorFit Pro!');
      navigate('/dashboard');
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email, pass) => {
    setLoginId(email);
    setPassword(pass);
    login({ login: email, password: pass })
      .then(() => {
        success('Logged in with demo credentials!');
        navigate('/dashboard');
      })
      .catch((err) => {
        error(err.response?.data?.message || err.message || 'Demo login failed');
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-xl shadow-brand-500/25 mb-4">
          <Ruler className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">TailorFit Pro</h2>
        <p className="mt-2 text-sm text-slate-400">
          Clothing Measurement & Uniform Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>One-Click Demo Roles:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@example.com', 'Admin@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-brand-300">Super Admin</div>
                <div className="text-[10px] text-slate-500">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('mehul.admin@example.com', 'Admin@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-amber-300">Admin</div>
                <div className="text-[10px] text-slate-500">Orgs & Templates</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('measurer@example.com', 'User@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Measurer</div>
                <div className="text-[10px] text-slate-500">Dynamic Forms</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('production@example.com', 'User@123')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-purple-300">Production</div>
                <div className="text-[10px] text-slate-500">Orders & Status</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
