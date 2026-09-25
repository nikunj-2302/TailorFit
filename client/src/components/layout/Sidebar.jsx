import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  Ruler,
  Layers,
  Sparkles,
  Shirt,
  ShoppingBag,
  BarChart3,
  Settings,
  ShieldAlert,
  PlusCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { isSuperAdmin, isAdmin, canAddMeasurements, canUpdateProduction } = useAuth();

  const navItems = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      group: 'Organizations',
      items: [
        { name: 'Organizations', path: '/organizations', icon: Building2 },
        { name: 'Branches', path: '/branches', icon: GitBranch },
      ],
    },
    {
      group: 'Customers & Staff',
      items: [
        { name: 'Persons / Employees', path: '/persons', icon: Users },
      ],
    },
    {
      group: 'Measurement Engine',
      items: [
        { name: 'Measurements', path: '/measurements', icon: Ruler, exact: true },
        ...(canAddMeasurements
          ? [{ name: '+ Add Measurement', path: '/measurements/new', icon: PlusCircle, highlight: true }]
          : []),
        ...(isAdmin
          ? [
              { name: 'Templates Builder', path: '/measurement-templates', icon: Layers },
              { name: 'Master Fields', path: '/measurement-fields', icon: Sparkles },
            ]
          : []),
      ],
    },
    {
      group: 'Apparel & Uniforms',
      items: [
        { name: 'Garment Types', path: '/garments', icon: Shirt },
      ],
    },
    {
      group: 'Production & Orders',
      items: [
        { name: 'Orders & Tracking', path: '/orders', icon: ShoppingBag },
      ],
    },
    {
      group: 'Intelligence',
      items: [
        { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      ],
    },
    ...(isAdmin
      ? [
          {
            group: 'Administration',
            items: [
              { name: 'User Management', path: '/settings/users', icon: Settings },
              { name: 'Audit Trail', path: '/settings/audit-logs', icon: ShieldAlert },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
              TF
            </div>
            <span className="font-bold text-white text-base">TailorFit Pro</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {navItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {section.group}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        item.highlight
                          ? isActive
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                            : 'bg-brand-950/60 text-brand-300 border border-brand-500/30 hover:bg-brand-900/60 hover:text-white'
                          : isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="text-[11px] text-slate-500 text-center">
            TailorFit Enterprise v1.0 • Dynamic MTM
          </div>
        </div>
      </aside>
    </>
  );
};
