import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  GitBranch,
  Users,
  Ruler,
  ShoppingBag,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { reportService } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, canManageMaster, canAddMeasurements } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await reportService.getDashboard();
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard analytics..." />;

  const statCards = [
    {
      title: 'Organizations',
      value: stats?.totalOrganizations || 0,
      icon: Building2,
      color: 'from-blue-600 to-cyan-500',
      path: '/organizations',
    },
    {
      title: 'Branches',
      value: stats?.totalBranches || 0,
      icon: GitBranch,
      color: 'from-cyan-600 to-teal-500',
      path: '/branches',
    },
    {
      title: 'Persons / Staff',
      value: stats?.totalPersons || 0,
      icon: Users,
      color: 'from-indigo-600 to-purple-500',
      path: '/persons',
    },
    {
      title: 'Measurements',
      value: stats?.totalMeasurements || 0,
      icon: Ruler,
      color: 'from-brand-600 to-blue-500',
      path: '/measurements',
    },
    {
      title: 'Active Orders',
      value: stats?.activeOrders || 0,
      icon: ShoppingBag,
      color: 'from-amber-600 to-orange-500',
      path: '/orders',
    },
    {
      title: 'Completed Orders',
      value: stats?.completedOrders || 0,
      icon: CheckCircle,
      color: 'from-emerald-600 to-green-500',
      path: '/orders',
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Measurement':
        return <Badge variant="default">Measurement</Badge>;
      case 'Cutting':
        return <Badge variant="cyan">Cutting</Badge>;
      case 'Stitching':
        return <Badge variant="brand">Stitching</Badge>;
      case 'Quality Check':
        return <Badge variant="purple">Quality Check</Badge>;
      case 'Ready':
        return <Badge variant="warning">Ready</Badge>;
      case 'Delivered':
        return <Badge variant="success">Delivered</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-brand-950/60 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Dynamic MTM Uniform Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.name || 'Welcome'} 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Manage corporate contracts, dynamic measurement templates, version history, and production lifecycle from a single unified hub.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canAddMeasurements && (
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => navigate('/measurements/new')}
                className="shadow-lg shadow-brand-600/30"
              >
                + Add Measurement
              </Button>
            )}

            {canManageMaster && (
              <Button
                variant="secondary"
                size="md"
                icon={Building2}
                onClick={() => navigate('/organizations')}
              >
                + Add Organization
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              icon={ShoppingBag}
              onClick={() => navigate('/orders')}
            >
              View Orders
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white group-hover:text-brand-300 transition-colors">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Pipeline Overview */}
      {stats?.ordersByStatus && (
        <Card
          title="Order Production Pipeline"
          subtitle="Real-time order progress across tailoring and quality stages"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Measurement', key: 'Measurement', count: stats.ordersByStatus.Measurement || 0, color: 'border-slate-700 text-slate-300' },
              { label: 'Cutting', key: 'Cutting', count: stats.ordersByStatus.Cutting || 0, color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/20' },
              { label: 'Stitching', key: 'Stitching', count: stats.ordersByStatus.Stitching || 0, color: 'border-brand-500/40 text-brand-300 bg-brand-950/20' },
              { label: 'Quality Check', key: 'QualityCheck', count: stats.ordersByStatus.QualityCheck || 0, color: 'border-purple-500/40 text-purple-300 bg-purple-950/20' },
              { label: 'Ready', key: 'Ready', count: stats.ordersByStatus.Ready || 0, color: 'border-amber-500/40 text-amber-300 bg-amber-950/20' },
              { label: 'Delivered', key: 'Delivered', count: stats.ordersByStatus.Delivered || 0, color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20' },
            ].map((step, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border ${step.color} flex flex-col justify-between`}>
                <div className="text-[11px] font-semibold uppercase tracking-wider">{step.label}</div>
                <div className="text-xl font-extrabold mt-2 font-mono">{step.count}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity: 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Persons */}
        <Card
          title="Recent Persons"
          subtitle="Latest employees and staff registered"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/persons')}>
              View All
            </Button>
          }
        >
          <div className="space-y-3">
            {(stats?.recentPersons || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No recent persons added.</p>
            ) : (
              (stats?.recentPersons || []).map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate('/persons')}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-brand-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                      {p.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.organization?.name} • {p.professionType}
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">{p.gender}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Measurements */}
        <Card
          title="Recent Measurements"
          subtitle="Dynamic fittings recently captured"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/measurements')}>
              View All
            </Button>
          }
        >
          <div className="space-y-3">
            {(stats?.recentMeasurements || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No measurements recorded.</p>
            ) : (
              (stats?.recentMeasurements || []).map((m) => (
                <div
                  key={m._id}
                  onClick={() => navigate('/measurements')}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{m.person?.fullName || 'Customer'}</div>
                    <div className="text-[11px] text-slate-400">
                      {m.garment?.name} • v{m.version || 1}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-brand-400 bg-brand-950/60 border border-brand-500/30 px-2 py-0.5 rounded-lg">
                    {m.measurementNumber}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card
          title="Recent Orders"
          subtitle="Latest bulk uniform requirements"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
              View All
            </Button>
          }
        >
          <div className="space-y-3">
            {(stats?.recentOrders || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No recent orders.</p>
            ) : (
              (stats?.recentOrders || []).map((o) => (
                <div
                  key={o._id}
                  onClick={() => navigate('/orders')}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{o.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">
                      {o.person?.fullName || o.organization?.name}
                    </div>
                  </div>
                  {getStatusBadge(o.status)}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
