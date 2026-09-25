import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Edit2, Trash2, Tag, Compass } from 'lucide-react';
import { measurementFieldService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const FIELD_CATEGORIES = [
  'Upper Body',
  'Lower Body',
  'Suit / Blazer',
  "Women's Measurements",
  'Other',
];

export const MeasurementFieldsList = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Upper Body',
    unit: 'Inch',
    description: '',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const res = await measurementFieldService.getAll({
        search,
        category: categoryFilter,
      });
      if (res.data.success) {
        setFields(res.data.data);
      }
    } catch (err) {
      error('Failed to load measurement fields: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, error]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleOpenAdd = () => {
    setEditingField(null);
    setFormData({
      name: '',
      code: '',
      category: 'Upper Body',
      unit: 'Inch',
      description: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      code: field.code,
      category: field.category,
      unit: field.unit || 'Inch',
      description: field.description || '',
      status: field.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      error('Field Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingField) {
        await measurementFieldService.update(editingField._id, formData);
        success('Measurement field updated successfully');
      } else {
        await measurementFieldService.create(formData);
        success('Measurement field created successfully');
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save measurement field');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (field) => {
    if (!window.confirm(`Are you sure you want to deactivate field "${field.name}"?`)) return;
    try {
      await measurementFieldService.delete(field._id);
      success('Measurement field deactivated successfully');
      fetchFields();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const columns = [
    {
      header: 'Field Name & Code',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-black text-xs">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.name}</div>
            <div className="text-xs text-brand-400 font-mono text-[11px]">{row.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <Badge
          variant={
            row.category === 'Upper Body'
              ? 'brand'
              : row.category === 'Lower Body'
              ? 'cyan'
              : row.category === "Women's Measurements"
              ? 'purple'
              : 'default'
          }
        >
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Default Unit',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
          {row.unit || 'Inch'}
        </span>
      ),
    },
    {
      header: 'Description / Measuring Guide',
      cell: (row) => (
        <div className="text-xs text-slate-400 max-w-xs truncate" title={row.description}>
          {row.description || '—'}
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
                title="Edit Field"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                title="Delete Field"
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
            <Sparkles className="w-6 h-6 text-brand-400" />
            Measurement Field Master
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global catalog of anatomical measurement points available to build dynamic garment templates.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Measurement Field
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={fields}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search field name, code, category..."
        emptyTitle="No Measurement Fields"
        emptyDescription="Create anatomical measurement points like Length, Chest, Shoulder, Bicep, etc."
        emptyActionText={isAdmin ? "+ Add Field" : undefined}
        onEmptyAction={isAdmin ? handleOpenAdd : undefined}
        filters={
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Categories</option>
            {FIELD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        }
      />

      {/* Add / Edit Field Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingField ? `Edit Field: ${editingField.name}` : 'Add Master Measurement Field'}
        subtitle="Define new anatomical measurement parameter for template construction"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Field Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bicep, Collar Height"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Field Code (e.g. BICEP)
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
                {FIELD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Inch">Inch (Inches)</option>
                <option value="cm">cm (Centimeters)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Tailor Instructions
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Instructions on where and how to place the measuring tape..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingField ? 'Update Field' : 'Create Field'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
