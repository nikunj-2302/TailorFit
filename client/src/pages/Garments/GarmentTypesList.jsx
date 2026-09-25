import React, { useState, useEffect, useCallback } from 'react';
import { Shirt, Plus, Edit2, Trash2, Layers, CheckSquare } from 'lucide-react';
import { garmentService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const GARMENT_CATEGORIES = ['Professional / Uniform', 'Clothing', 'Uniform', 'Other'];

export const GarmentTypesList = () => {
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Clothing',
    applicableGenders: ['Male', 'Female', 'Unisex'],
    description: '',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const fetchGarments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await garmentService.getAll({
        search,
        category: categoryFilter,
        gender: genderFilter,
      });
      if (res.data.success) {
        setGarments(res.data.data);
      }
    } catch (err) {
      error('Failed to load garment types: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, genderFilter, error]);

  useEffect(() => {
    fetchGarments();
  }, [fetchGarments]);

  const handleOpenAdd = () => {
    setEditingGarment(null);
    setFormData({
      name: '',
      code: '',
      category: 'Clothing',
      applicableGenders: ['Male', 'Female', 'Unisex'],
      description: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (garment) => {
    setEditingGarment(garment);
    setFormData({
      name: garment.name,
      code: garment.code,
      category: garment.category,
      applicableGenders: garment.applicableGenders || ['Male', 'Female', 'Unisex'],
      description: garment.description || '',
      status: garment.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleToggleGender = (gender) => {
    const current = [...formData.applicableGenders];
    if (current.includes(gender)) {
      if (current.length === 1) return; // Keep at least one
      setFormData({ ...formData, applicableGenders: current.filter((g) => g !== gender) });
    } else {
      setFormData({ ...formData, applicableGenders: [...current, gender] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      error('Garment name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingGarment) {
        await garmentService.update(editingGarment._id, formData);
        success('Garment type updated successfully');
      } else {
        await garmentService.create(formData);
        success('Garment type created successfully');
      }
      setIsModalOpen(false);
      fetchGarments();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save garment type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (garment) => {
    if (!window.confirm(`Are you sure you want to deactivate garment "${garment.name}"?`)) return;
    try {
      await garmentService.delete(garment._id);
      success('Garment type deactivated successfully');
      fetchGarments();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete garment');
    }
  };

  const columns = [
    {
      header: 'Garment / Apparel',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-black">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.name}</div>
            <div className="text-xs text-slate-400 font-mono text-[11px]">{row.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <Badge variant={row.category === 'Uniform' ? 'brand' : 'purple'}>
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Applicable Genders',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.applicableGenders || []).map((g) => (
            <span key={g} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {g}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Measurement Templates',
      cell: (row) => (
        <span className="font-semibold text-slate-200 text-xs">
          {row.templateCount || 0} active templates
        </span>
      ),
    },
    {
      header: 'Usage Records',
      cell: (row) => (
        <span className="text-xs text-slate-400">
          {row.usageCount || 0} measurements
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
                title="Edit Garment"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Shirt className="w-6 h-6 text-brand-400" />
            Garment & Apparel Types
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dynamic catalog of clothing types, uniform sets, scrubs, coats, and corporate attire.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Garment Type
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={garments}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search garment name, code, description..."
        emptyTitle="No Garment Types Found"
        emptyDescription="Add garment types such as Doctor Shirt, Lab Coat, Blazer, or Scrubs."
        emptyActionText={isAdmin ? "+ Add Garment Type" : undefined}
        onEmptyAction={isAdmin ? handleOpenAdd : undefined}
        filters={
          <>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Categories</option>
              {GARMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unisex">Unisex</option>
            </select>
          </>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGarment ? `Edit: ${editingGarment.name}` : 'Add New Garment Type'}
        subtitle="Configure garment properties and gender applicability"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Garment Type Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Doctor Shirt with Fabric"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Garment Code (e.g. SHIRT_FABRIC)
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
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {GARMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
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
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Applicable Genders *
              </label>
              <div className="flex flex-wrap gap-3">
                {['Male', 'Female', 'Unisex'].map((g) => {
                  const isChecked = formData.applicableGenders.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleToggleGender(g)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-brand-950/80 border-brand-500 text-brand-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-600'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Fabric Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of the garment styling or fabric details..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingGarment ? 'Update Garment' : 'Create Garment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
