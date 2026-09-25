import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Shirt,
  Building2,
  HelpCircle,
} from 'lucide-react';
import {
  templateService,
  garmentService,
  measurementFieldService,
  organizationService,
} from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_ROLES = [
  'All',
  'Doctor',
  'Nurse',
  'Dietician',
  'Pharmacist',
  'Lab Technician',
  'Receptionist',
  'Security',
  'Housekeeping',
  'Manager',
  'Staff',
  'Chef',
  'Driver',
  'Executive',
];

export const MeasurementTemplatesList = () => {
  const [templates, setTemplates] = useState([]);
  const [garments, setGarments] = useState([]);
  const [masterFields, setMasterFields] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');

  // Modal Builder State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    garment: '',
    gender: 'Male',
    applicableTypes: ['All'],
    organization: '',
    description: '',
    status: 'Active',
    fields: [], // [{ field: id, isRequired, displayOrder, unit, minVal, maxVal, helpText }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const { isAdmin } = useAuth();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await templateService.getAll({
        search,
        gender: genderFilter,
      });
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      error('Failed to load measurement templates: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter, error]);

  const loadDependencies = async () => {
    try {
      const [garmentRes, fieldRes, orgRes] = await Promise.all([
        garmentService.getAll(),
        measurementFieldService.getAll(),
        organizationService.getAll({ limit: 100 }),
      ]);
      if (garmentRes.data.success) setGarments(garmentRes.data.data);
      if (fieldRes.data.success) setMasterFields(fieldRes.data.data);
      if (orgRes.data.success) setOrganizations(orgRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      garment: garments[0]?._id || '',
      gender: 'Male',
      applicableTypes: ['All'],
      organization: '',
      description: '',
      status: 'Active',
      fields: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    const existingFields = (tmpl.fields || []).map((f, idx) => ({
      field: f.field?._id || f.field,
      isRequired: f.isRequired !== undefined ? f.isRequired : true,
      displayOrder: f.displayOrder || idx + 1,
      unit: f.unit || 'Inch',
      minVal: f.minVal || '',
      maxVal: f.maxVal || '',
      helpText: f.helpText || '',
    }));

    setFormData({
      name: tmpl.name,
      garment: tmpl.garment?._id || tmpl.garment || '',
      gender: tmpl.gender || 'Male',
      applicableTypes: tmpl.applicableTypes || ['All'],
      organization: tmpl.organization?._id || tmpl.organization || '',
      description: tmpl.description || '',
      status: tmpl.status || 'Active',
      fields: existingFields,
    });
    setIsModalOpen(true);
  };

  // Toggle field selection in builder
  const handleToggleField = (fieldId) => {
    const exists = formData.fields.some((f) => f.field === fieldId);
    if (exists) {
      const updated = formData.fields
        .filter((f) => f.field !== fieldId)
        .map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
      setFormData({ ...formData, fields: updated });
    } else {
      const fieldMaster = masterFields.find((f) => f._id === fieldId);
      const newField = {
        field: fieldId,
        isRequired: true,
        displayOrder: formData.fields.length + 1,
        unit: fieldMaster?.unit || 'Inch',
        minVal: '',
        maxVal: '',
        helpText: '',
      };
      setFormData({ ...formData, fields: [...formData.fields, newField] });
    }
  };

  // Update specific field settings in builder
  const handleUpdateFieldProp = (fieldId, prop, value) => {
    const updated = formData.fields.map((f) => {
      if (f.field === fieldId) {
        return { ...f, [prop]: value };
      }
      return f;
    });
    setFormData({ ...formData, fields: updated });
  };

  // Move field order Up/Down
  const handleMoveOrder = (index, direction) => {
    const fields = [...formData.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;

    // Recalculate displayOrder
    const reordered = fields.map((f, idx) => ({ ...f, displayOrder: idx + 1 }));
    setFormData({ ...formData, fields: reordered });
  };

  const handleToggleRole = (role) => {
    let roles = [...formData.applicableTypes];
    if (role === 'All') {
      roles = ['All'];
    } else {
      roles = roles.filter((r) => r !== 'All');
      if (roles.includes(role)) {
        roles = roles.filter((r) => r !== role);
        if (roles.length === 0) roles = ['All'];
      } else {
        roles.push(role);
      }
    }
    setFormData({ ...formData, applicableTypes: roles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.garment) {
      error('Template Name and Garment are required');
      return;
    }

    if (formData.fields.length === 0) {
      error('Please select at least one measurement field for this template.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        organization: formData.organization || null,
        fields: formData.fields.map((f, idx) => ({
          ...f,
          displayOrder: idx + 1,
          minVal: f.minVal ? Number(f.minVal) : null,
          maxVal: f.maxVal ? Number(f.maxVal) : null,
        })),
      };

      if (editingTemplate) {
        await templateService.update(editingTemplate._id, payload);
        success('Measurement template updated successfully');
      } else {
        await templateService.create(payload);
        success('Measurement template created successfully');
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tmpl) => {
    if (!window.confirm(`Are you sure you want to deactivate template "${tmpl.name}"?`)) return;
    try {
      await templateService.delete(tmpl._id);
      success('Measurement template deactivated successfully');
      fetchTemplates();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const columns = [
    {
      header: 'Template Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="text-cyan-400 font-semibold">{row.garment?.name || 'Garment'}</span>
              <span>•</span>
              <span className="text-slate-300">{row.gender}</span>
              {row.organization && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">{row.organization.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Configured Fields',
      cell: (row) => (
        <div>
          <div className="font-bold text-slate-200 text-xs">
            {row.fields?.length || 0} fields
          </div>
          <div className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5">
            {(row.fields || [])
              .map((f) => f.field?.name || 'Field')
              .join(', ')}
          </div>
        </div>
      ),
    },
    {
      header: 'Applicable Roles',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(row.applicableTypes || []).map((r) => (
            <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {r}
            </span>
          ))}
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
                title="Configure Template"
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
            <Layers className="w-6 h-6 text-brand-400" />
            Dynamic Measurement Templates Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure dynamic measurement forms for any garment without hardcoded code changes.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Create Template
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={templates}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search template name, garment, role..."
        emptyTitle="No Templates Found"
        emptyDescription="Create dynamic measurement templates to automatically generate custom forms."
        emptyActionText={isAdmin ? "+ Create Template" : undefined}
        onEmptyAction={isAdmin ? handleOpenAdd : undefined}
        filters={
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
        }
      />

      {/* Template Builder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? `Builder: ${editingTemplate.name}` : 'Template Builder'}
        subtitle="Define garment, gender, role applicability, and select required measurement fields"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Config Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Men's Doctor Shirt"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Garment *
              </label>
              <select
                required
                value={formData.garment}
                onChange={(e) => setFormData({ ...formData, garment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Select Garment --</option>
                {garments.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Applicable Profession Roles
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_ROLES.map((r) => {
                  const isSelected = formData.applicableTypes.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleToggleRole(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Master Field Selector & Selected Fields Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Select Measurement Fields for this Template ({formData.fields.length} selected)
              </h4>
            </div>

            {/* Quick Picker Buttons */}
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-semibold">
                Click to add / remove fields from master catalogue:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {masterFields.map((field) => {
                  const isChecked = formData.fields.some((f) => f.field === field._id);
                  return (
                    <button
                      key={field._id}
                      type="button"
                      onClick={() => handleToggleField(field._id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isChecked
                          ? 'bg-brand-950/90 border-brand-500 text-brand-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded flex items-center justify-center text-[10px] ${isChecked ? 'bg-brand-500 text-white' : 'border border-slate-600'}`}>
                        {isChecked && '✓'}
                      </span>
                      <span>{field.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configured Fields List with Order / Required / Min-Max */}
            {formData.fields.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Order</th>
                      <th className="px-3 py-2.5">Field Name</th>
                      <th className="px-3 py-2.5">Required?</th>
                      <th className="px-3 py-2.5">Unit</th>
                      <th className="px-3 py-2.5">Min / Max</th>
                      <th className="px-3 py-2.5">Help Text / Instruction</th>
                      <th className="px-3 py-2.5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {formData.fields.map((fItem, idx) => {
                      const master = masterFields.find((m) => m._id === fItem.field);
                      return (
                        <tr key={fItem.field} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-slate-400 w-4 text-center">
                                {idx + 1}
                              </span>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveOrder(idx, 'up')}
                                  className="text-slate-500 hover:text-white disabled:opacity-20"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === formData.fields.length - 1}
                                  onClick={() => handleMoveOrder(idx, 'down')}
                                  className="text-slate-500 hover:text-white disabled:opacity-20"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 font-bold text-white">
                            {master?.name || 'Field'}
                            <span className="block text-[10px] font-normal text-slate-500">
                              {master?.category}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fItem.isRequired}
                                onChange={(e) =>
                                  handleUpdateFieldProp(fItem.field, 'isRequired', e.target.checked)
                                }
                                className="rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-0"
                              />
                              <span className="text-slate-300 text-xs">
                                {fItem.isRequired ? 'Mandatory' : 'Optional'}
                              </span>
                            </label>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={fItem.unit}
                              onChange={(e) =>
                                handleUpdateFieldProp(fItem.field, 'unit', e.target.value)
                              }
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            >
                              <option value="Inch">Inch</option>
                              <option value="cm">cm</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="Min"
                                value={fItem.minVal}
                                onChange={(e) =>
                                  handleUpdateFieldProp(fItem.field, 'minVal', e.target.value)
                                }
                                className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-center"
                              />
                              <span className="text-slate-500">-</span>
                              <input
                                type="number"
                                placeholder="Max"
                                value={fItem.maxVal}
                                onChange={(e) =>
                                  handleUpdateFieldProp(fItem.field, 'maxVal', e.target.value)
                                }
                                className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono text-center"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="e.g. Under armpits, around chest"
                              value={fItem.helpText}
                              onChange={(e) =>
                                handleUpdateFieldProp(fItem.field, 'helpText', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleField(fItem.field)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingTemplate ? 'Update Template' : 'Save Dynamic Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
