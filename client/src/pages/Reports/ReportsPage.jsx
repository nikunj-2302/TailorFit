import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Building2,
  Ruler,
  ShoppingBag,
  FileSpreadsheet,
} from 'lucide-react';
import { reportService } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('organizations');
  const [loading, setLoading] = useState(true);
  const [orgReport, setOrgReport] = useState([]);
  const [measurementReport, setMeasurementReport] = useState([]);
  const [orderReport, setOrderReport] = useState([]);

  const { success, error } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [orgRes, measRes, orderRes] = await Promise.all([
          reportService.getOrganizations(),
          reportService.getMeasurements(),
          reportService.getOrders(),
        ]);
        if (orgRes.data.success) setOrgReport(orgRes.data.data);
        if (measRes.data.success) setMeasurementReport(measRes.data.data);
        if (orderRes.data.success) setOrderReport(orderRes.data.data);
      } catch (err) {
        error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Export to CSV helper
  const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      error('No data available to export');
      return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) => {
          return keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported ${filename} successfully!`);
  };

  const handleExport = () => {
    if (activeTab === 'organizations') {
      const data = orgReport.map((o) => ({
        Organization: o.name,
        Code: o.code,
        Type: o.type,
        City: o.city,
        Branches: o.branchCount,
        Persons: o.personCount,
        Measurements: o.measurementCount,
        Orders: o.orderCount,
        Status: o.status,
      }));
      exportToCSV('Organizations_Report', data);
    } else if (activeTab === 'measurements') {
      const data = measurementReport.map((m) => ({
        MeasurementNumber: m.measurementNumber,
        Person: m.person?.fullName,
        EmployeeID: m.person?.personId,
        Organization: m.organization?.name,
        Branch: m.branch?.name,
        Garment: m.garment?.name,
        Version: m.version,
        Unit: m.unit,
        Date: new Date(m.createdAt).toLocaleDateString(),
      }));
      exportToCSV('Measurements_Report', data);
    } else if (activeTab === 'orders') {
      const data = orderReport.map((o) => ({
        OrderNumber: o.orderNumber,
        Customer: o.person?.fullName,
        Organization: o.organization?.name,
        Branch: o.branch?.name,
        ItemsCount: o.items?.length,
        TotalAmount: o.totalAmount,
        Status: o.status,
        OrderDate: new Date(o.orderDate).toLocaleDateString(),
        DeliveryDate: o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '',
      }));
      exportToCSV('Orders_Report', data);
    }
  };

  if (loading) return <LoadingSpinner text="Generating intelligence reports..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-400" />
            Executive Reports & Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated business intelligence for organizations, measurements, and production orders.
          </p>
        </div>

        <Button variant="primary" icon={Download} onClick={handleExport}>
          Export to CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { id: 'organizations', label: 'Organization Report', icon: Building2, count: orgReport.length },
          { id: 'measurements', label: 'Measurement Report', icon: Ruler, count: measurementReport.length },
          { id: 'orders', label: 'Order Report', icon: ShoppingBag, count: orderReport.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization Report */}
      {activeTab === 'organizations' && (
        <Card title="Organization Contract Summary" subtitle="Total branches, persons, measurements, and orders per client">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Branches</th>
                  <th className="px-4 py-3">Staff / Persons</th>
                  <th className="px-4 py-3">Measurements</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orgReport.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-bold text-white">
                      {org.name}
                      <span className="block text-[10px] font-mono text-brand-400 font-normal">{org.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="brand">{org.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-300">{org.branchCount}</td>
                    <td className="px-4 py-3 font-semibold text-slate-300">{org.personCount}</td>
                    <td className="px-4 py-3 font-semibold text-cyan-400">{org.measurementCount}</td>
                    <td className="px-4 py-3 font-semibold text-amber-400">{org.orderCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={org.status === 'Active' ? 'success' : 'default'} dot>
                        {org.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Measurement Report */}
      {activeTab === 'measurements' && (
        <Card title="Measurements Fitting Log" subtitle="Comprehensive record of captured garment measurements">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Measurement #</th>
                  <th className="px-4 py-3">Customer / Person</th>
                  <th className="px-4 py-3">Organization & Branch</th>
                  <th className="px-4 py-3">Garment</th>
                  <th className="px-4 py-3">Values Recorded</th>
                  <th className="px-4 py-3">Recorded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {measurementReport.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-mono font-bold text-brand-400">
                      {m.measurementNumber}
                      <span className="block text-[10px] text-slate-500 font-normal">v{m.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{m.person?.fullName}</div>
                      <div className="text-[10px] text-slate-400">{m.person?.personId} • {m.person?.professionType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 font-medium">{m.organization?.name}</div>
                      <div className="text-[10px] text-slate-500">{m.branch?.name || 'Main'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{m.garment?.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(m.values || []).slice(0, 3).map((v, i) => (
                          <span key={i} className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                            {v.fieldName}: <b className="text-brand-400">{v.value}</b>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Order Report */}
      {activeTab === 'orders' && (
        <Card title="Orders & Production Status Report" subtitle="All uniform purchase and production orders">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orderReport.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-mono font-bold text-white">{o.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{o.person?.fullName}</td>
                    <td className="px-4 py-3 text-slate-300">{o.organization?.name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-300">{o.items?.length} items</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {o.totalAmount > 0 ? `₹${o.totalAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="brand" dot>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(o.orderDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
