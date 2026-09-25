import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, Eye, MapPin, Phone, Mail } from 'lucide-react';
import { organizationService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const ORG_TYPES = [
  'Hospital',
  'Bank',
  'Corporate',
  'School',
  'College',
  'Factory',
  'Hotel',
  'Restaurant',
  'Government',
  'Other',
];

export const OrganizationsList = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Hospital',
    contactPerson: '',
    contactNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    status: 'Active',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const fetchOrganizations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await organizationService.getAll({
        search,
        type: typeFilter,
        page,
        limit: 10,
      });
      if (res.data.success) {
        setOrganizations(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      error('Failed to load organizations: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, error]);

  useEffect(() => {
    fetchOrganizations(1);
  }, [fetchOrganizations]);

  const handleOpenAdd = () => {
    setEditingOrg(null);
    setFormData({
      name: '',
      code: '',
      type: 'Hospital',
      contactPerson: '',
      contactNumber: '',
      email: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      status: 'Active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      code: org.code,
      type: org.type,
      contactPerson: org.contactPerson || '',
      contactNumber: org.contactNumber || '',
      email: org.email || '',
      address: org.address || '',
      city: org.city || '',
      state: org.state || '',
      country: org.country || 'India',
      pincode: org.pincode || '',
      status: org.status || 'Active',
      notes: org.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      error('Organization Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingOrg) {
        await organizationService.update(editingOrg._id, formData);
        success('Organization updated successfully');
      } else {
        await organizationService.create(formData);
        success('Organization created successfully');
      }
      setIsModalOpen(false);
      fetchOrganizations(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (org) => {
    if (!window.confirm(`Are you sure you want to deactivate organization "${org.name}"?`)) return;
    try {
      await organizationService.delete(org._id);
      success('Organization deactivated successfully');
      fetchOrganizations(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete organization');
    }
  };

  const columns = [
    {
      header: 'Organization',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-black text-sm">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="font-mono text-brand-400">{row.code}</span>
              {row.city && <span>• {row.city}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (row) => <Badge variant="brand">{row.type}</Badge>,
    },
    {
      header: 'Branches',
      cell: (row) => (
        <span className="font-semibold text-slate-200">
          {row.branchCount || 0} {row.branchCount === 1 ? 'branch' : 'branches'}
        </span>
      ),
    },
    {
      header: 'Staff / Persons',
      cell: (row) => (
        <span className="font-semibold text-slate-200">
          {row.personCount || 0} persons
        </span>
      ),
    },
    {
      header: 'Contact Person',
      cell: (row) => (
        <div className="text-xs text-slate-300">
          <div>{row.contactPerson || '—'}</div>
          {row.contactNumber && <div className="text-slate-500 font-mono">{row.contactNumber}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                title="Edit Organization"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                title="Delete/Deactivate"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-brand-400" />
            Organizations Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage client hospitals, corporates, banks, schools, and uniform contract accounts.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Organization
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={organizations}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code, city, contact..."
        emptyTitle="No Organizations Found"
        emptyDescription="Create your first organization or adjust your search filter."
        emptyActionText={isAdmin ? "+ Add Organization" : undefined}
        onEmptyAction={isAdmin ? handleOpenAdd : undefined}
        filters={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Types</option>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        }
        pagination={pagination}
        onPageChange={(p) => fetchOrganizations(p)}
      />

      {/* Add / Edit Organization Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrg ? `Edit: ${editingOrg.name}` : 'Add New Organization'}
        subtitle="Fill in the organization details below"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sanjivini Hospital"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization Code (e.g. SANJ01)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Auto-generated if blank"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Dr. Kirit Shah"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+91 98250 11223"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@sanjivinihospital.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Address / Street
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Opp. Medical College, Race Course Road"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Vadodara"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Gujarat"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="390007"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contract terms, delivery preferences, etc."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingOrg ? 'Update Organization' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
