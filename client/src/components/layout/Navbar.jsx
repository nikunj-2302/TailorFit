import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ShieldCheck, Menu, Database, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { systemService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const handleSeed = async () => {
    try {
      await systemService.seed();
      success('Database re-seeded with demo records!');
      window.location.reload();
    } catch (err) {
      error('Failed to seed database: ' + (err.response?.data?.message || err.message));
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40">Super Admin</span>;
      case 'admin':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">Admin</span>;
      case 'measurement_user':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">Measurer</span>;
      case 'production_user':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">Production</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass-dropdown border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/30">
            TF
          </div>
          <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">
            TailorFit <span className="text-brand-400 font-medium text-xs bg-brand-950/80 border border-brand-500/30 px-1.5 py-0.5 rounded-md ml-1">PRO</span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Add Measurement Button */}
        <button
          onClick={() => navigate('/measurements/new')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/90 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 border border-brand-400/30 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Measurement</span>
        </button>

        {/* Quick Demo Reset Data Button */}
        <button
          onClick={handleSeed}
          title="Reset database with realistic demo data"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Demo Data</span>
        </button>

        {/* User profile dropdown info */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
