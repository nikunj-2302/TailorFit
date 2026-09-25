import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Clock, User, Filter } from 'lucide-react';
import { reportService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  const { error } = useToast();

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await reportService.getAuditLogs({
        module: moduleFilter !== 'All' ? moduleFilter : undefined,
        action: actionFilter !== 'All' ? actionFilter : undefined,
        page,
        limit: 15,
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter, error]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const columns = [
    {
      header: 'Timestamp',
      cell: (row) => (
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date(row.createdAt).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'User',
      cell: (row) => (
        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-brand-400" />
          <span>{row.userName || 'System'}</span>
        </div>
      ),
    },
    {
      header: 'Module',
      cell: (row) => <Badge variant="brand">{row.module}</Badge>,
    },
    {
      header: 'Action',
      cell: (row) => {
        const colors = {
          CREATE: 'success',
          UPDATE: 'warning',
          DELETE: 'danger',
          VERSION_CREATE: 'purple',
          STATUS_CHANGE: 'cyan',
        };
        return <Badge variant={colors[row.action] || 'default'}>{row.action}</Badge>;
      },
    },
    {
      header: 'Activity Description',
      cell: (row) => (
        <div className="text-xs text-slate-300 max-w-md">{row.description}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-brand-400" />
          System Audit Trail & History
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Immutable audit logs of all measurement versionings, order status changes, and records mutations.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        emptyTitle="No Audit Logs"
        emptyDescription="System modifications and version history will appear here."
        filters={
          <>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Modules</option>
              <option value="Measurement">Measurement</option>
              <option value="Order">Order</option>
              <option value="Person">Person</option>
              <option value="Organization">Organization</option>
              <option value="MeasurementTemplate">MeasurementTemplate</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="VERSION_CREATE">VERSION_CREATE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </>
        }
        pagination={pagination}
        onPageChange={(p) => fetchLogs(p)}
      />
    </div>
  );
};
