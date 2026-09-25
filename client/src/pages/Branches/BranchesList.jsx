import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Plus, Edit2, Trash2, Building2, MapPin, Phone } from 'lucide-react';
import { branchService, organizationService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const BranchesList = () => {
  const [branches, setBranches] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    organization: '',
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    status: 'Active',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await branchService.getAll({
        search,
        organization: selectedOrgFilter || undefined,
      });
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (err) {
      error('Failed to load branches: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, selectedOrgFilter, error]);

  const fetchOrgs = async () => {
    try {
      const res = await organizationService.getAll({ limit: 100 });
      if (res.data.success) {
        setOrganizations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load organizations for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      organization: selectedOrgFilter || (organizations[0]?._id || ''),
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      status: 'Active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      organization: branch.organization?._id || branch.organization || '',
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || 'India',
      pincode: branch.pincode || '',
      contactPerson: branch.contactPerson || '',
      contactNumber: branch.contactNumber || '',
      email: branch.email || '',
      status: branch.status || 'Active',
      notes: branch.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organization || !formData.name) {
      error('Organization and Branch Name are required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBranch) {
        await branchService.update(editingBranch._id, formData);
        success('Branch updated successfully');
      } else {
        await branchService.create(formData);
        success('Branch created successfully');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (branch) => {
    if (!window.confirm(`Are you sure you want to deactivate branch "${branch.name}"?`)) return;
    try {
      await branchService.delete(branch._id);
      success('Branch deactivated successfully');
      fetchBranches();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  const columns = [
    {
      header: 'Branch Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-black text-xs">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.name}</div>
            <div className="text-xs text-slate-400 font-mono text-[11px]">{row.code || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Organization',
      cell: (row) => (
        <div className="text-xs font-semibold text-brand-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span>{row.organization?.name || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Location / City',
      cell: (row) => (
        <div className="text-xs text-slate-300 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{row.city ? `${row.city}, ${row.state || ''}` : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      cell: (row) => (
        <div className="text-xs text-slate-300">
          <div>{row.contactPerson || '—'}</div>
          {row.contactNumber && <div className="text-slate-500 font-mono text-[11px]">{row.contactNumber}</div>}
        </div>
      ),
    },
    {
      header: 'Assigned Staff',
      cell: (row) => (
        <span className="font-semibold text-slate-200 text-xs">
          {row.personCount || 0} staff
        </span>
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
                title="Edit Branch"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                title="Delete Branch"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-cyan-400" />
            Branch Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage individual location campuses, satellite offices, and branches per organization.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Branch
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={branches}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search branch name, code, city..."
        emptyTitle="No Branches Found"
        emptyDescription="Create a branch or choose another organization filter."
        emptyActionText={isAdmin ? "+ Add Branch" : undefined}
        onEmptyAction={isAdmin ? handleOpenAdd : undefined}
        filters={
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Add / Edit Branch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Branch'}
        subtitle="Fill in branch location and contact details"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Parent Organization *
              </label>
              <select
                required
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Select Organization --</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Branch Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vadodara Branch"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SANJ-BR-VAD"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Branch in-charge name"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+91 98250 11224"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Branch Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vadodara@sanjivinihospital.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Campus address"
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
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingBranch ? 'Update Branch' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
