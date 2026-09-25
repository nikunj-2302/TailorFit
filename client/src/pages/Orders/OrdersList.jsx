import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Eye,
  Trash2,
  Calendar,
  Building2,
  User,
  Clock,
  Shirt,
} from 'lucide-react';
import { orderService, organizationService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { OrderDetailModal } from './OrderDetailModal';
import { CreateOrderModal } from './CreateOrderModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = [
  'All',
  'Measurement',
  'Cutting',
  'Stitching',
  'Quality Check',
  'Ready',
  'Delivered',
  'Cancelled',
];

export const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orgFilter, setOrgFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { success, error } = useToast();
  const { isAdmin, canAddMeasurements } = useAuth();

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await orderService.getAll({
        search,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        organization: orgFilter || undefined,
        page,
        limit: 10,
      });
      if (res.data.success) {
        setOrders(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      error('Failed to load orders: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, orgFilter, error]);

  const loadOrgs = async () => {
    try {
      const res = await organizationService.getAll({ limit: 100 });
      if (res.data.success) setOrganizations(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Are you sure you want to cancel/archive order ${order.orderNumber}?`)) return;
    try {
      await orderService.delete(order._id);
      success('Order archived successfully');
      fetchOrders(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to archive order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Measurement':
        return <Badge variant="default" dot>{status}</Badge>;
      case 'Cutting':
        return <Badge variant="cyan" dot>{status}</Badge>;
      case 'Stitching':
        return <Badge variant="brand" dot>{status}</Badge>;
      case 'Quality Check':
        return <Badge variant="purple" dot>{status}</Badge>;
      case 'Ready':
        return <Badge variant="warning" dot>{status}</Badge>;
      case 'Delivered':
        return <Badge variant="success" dot>{status}</Badge>;
      case 'Cancelled':
        return <Badge variant="danger" dot>{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const columns = [
    {
      header: 'Order #',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono font-bold text-white text-xs">{row.orderNumber}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{new Date(row.orderDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer / Recipient',
      cell: (row) => (
        <div>
          <div className="font-bold text-white text-sm">{row.person?.fullName || 'Customer'}</div>
          <div className="text-xs text-slate-400">
            {row.person?.personId} • {row.person?.professionType}
          </div>
        </div>
      ),
    },
    {
      header: 'Organization & Branch',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-200">{row.organization?.name || '—'}</div>
          <div className="text-slate-400">{row.branch?.name || 'Main Campus'}</div>
        </div>
      ),
    },
    {
      header: 'Items Summary',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-slate-200">
            {row.items?.length || 0} {row.items?.length === 1 ? 'Garment Item' : 'Garment Items'}
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-xs">
            {(row.items || []).map((i) => `${i.quantity}x ${i.garment?.name || 'Item'}`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      cell: (row) => (
        <div className="text-xs font-mono font-bold text-emerald-400">
          {row.totalAmount > 0 ? `₹${row.totalAmount.toLocaleString()}` : '—'}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenDetail(row)}
            title="View Details & Update Status"
            className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => handleDelete(row)}
              title="Archive Order"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-brand-400" />
            Orders & Production Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track bulk uniform orders through cutting, stitching, quality check, and final dispatch.
          </p>
        </div>

        {canAddMeasurements && (
          <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
            + Create Order
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order #, customer name, notes..."
        emptyTitle="No Orders Found"
        emptyDescription="Create bulk uniform orders linked directly to saved measurement profiles."
        emptyActionText={canAddMeasurements ? "+ Create Order" : undefined}
        onEmptyAction={canAddMeasurements ? () => setCreateModalOpen(true) : undefined}
        filters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} Status</option>
              ))}
            </select>

            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>
          </>
        }
        pagination={pagination}
        onPageChange={(p) => fetchOrders(p)}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onOrderCreated={() => fetchOrders(1)}
      />

      {/* Order Detail & Status Progression Modal */}
      <OrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        order={selectedOrder}
        onStatusUpdated={(updated) => {
          setSelectedOrder(updated);
          fetchOrders(pagination.page);
        }}
      />
    </div>
  );
};
