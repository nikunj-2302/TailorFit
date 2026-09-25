import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Ruler,
  History,
  Building2,
  GitBranch,
  Phone,
  Mail,
  Briefcase,
} from 'lucide-react';
import { personService, organizationService, branchService, measurementService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { MeasurementHistoryDrawer } from '../../components/measurements/MeasurementHistoryDrawer';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_PROFESSION_TYPES = [
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
  'Other',
];

export const PersonsList = () => {
  const [persons, setPersons] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modalBranches, setModalBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [professionFilter, setProfessionFilter] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    personId: '',
    fullName: '',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    organization: '',
    branch: '',
    department: '',
    designation: '',
    professionType: 'Doctor',
    notes: '',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Drawer State
  const [selectedMeasurementForHistory, setSelectedMeasurementForHistory] = useState(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const { success, error } = useToast();
  const { canAddMeasurements, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchPersons = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await personService.getAll({
        search,
        organization: orgFilter || undefined,
        gender: genderFilter !== 'All' ? genderFilter : undefined,
        professionType: professionFilter !== 'All' ? professionFilter : undefined,
        page,
        limit: 10,
      });
      if (res.data.success) {
        setPersons(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      error('Failed to load persons: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, orgFilter, genderFilter, professionFilter, error]);

  const loadInitialData = async () => {
    try {
      const orgRes = await organizationService.getAll({ limit: 100 });
      if (orgRes.data.success) setOrganizations(orgRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchPersons(1);
  }, [fetchPersons]);

  // Load modal branches when modal org changes
  const handleModalOrgChange = async (orgId) => {
    setFormData((prev) => ({ ...prev, organization: orgId, branch: '' }));
    if (orgId) {
      try {
        const res = await branchService.getAll({ organization: orgId });
        if (res.data.success) setModalBranches(res.data.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setModalBranches([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingPerson(null);
    const defaultOrg = organizations[0]?._id || '';
    setFormData({
      personId: '',
      fullName: '',
      gender: 'Male',
      mobileNumber: '',
      email: '',
      organization: defaultOrg,
      branch: '',
      department: '',
      designation: '',
      professionType: 'Doctor',
      notes: '',
      status: 'Active',
    });
    if (defaultOrg) {
      handleModalOrgChange(defaultOrg);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (person) => {
    setEditingPerson(person);
    const orgId = person.organization?._id || person.organization || '';
    setFormData({
      personId: person.personId || '',
      fullName: person.fullName,
      gender: person.gender || 'Male',
      mobileNumber: person.mobileNumber || '',
      email: person.email || '',
      organization: orgId,
      branch: person.branch?._id || person.branch || '',
      department: person.department || '',
      designation: person.designation || '',
      professionType: person.professionType || 'Staff',
      notes: person.notes || '',
      status: person.status || 'Active',
    });

    if (orgId) {
      const res = await branchService.getAll({ organization: orgId });
      if (res.data.success) setModalBranches(res.data.data);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.organization) {
      error('Full Name and Organization are required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPerson) {
        await personService.update(editingPerson._id, formData);
        success('Person details updated successfully');
      } else {
        await personService.create(formData);
        success('Person created successfully');
      }
      setIsModalOpen(false);
      fetchPersons(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save person');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (person) => {
    if (!window.confirm(`Are you sure you want to deactivate ${person.fullName}?`)) return;
    try {
      await personService.delete(person._id);
      success('Person deactivated successfully');
      fetchPersons(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete person');
    }
  };

  const handleViewPersonHistory = async (person) => {
    try {
      const res = await measurementService.getByPersonId(person._id);
      if (res.data.success && res.data.data.length > 0) {
        const latest = res.data.data[0];
        latest.versionHistory = res.data.data;
        setSelectedMeasurementForHistory(latest);
        setHistoryDrawerOpen(true);
      } else {
        error(`No measurements recorded yet for ${person.fullName}`);
      }
    } catch (err) {
      error('Failed to load history');
    }
  };

  const columns = [
    {
      header: 'Person / Employee',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-sm">
            {row.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.fullName}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-brand-400 text-[11px]">{row.personId || 'No ID'}</span>
              <span>•</span>
              <span className="text-slate-300">{row.gender}</span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">{row.professionType}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Organization & Branch',
      cell: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-200">{row.organization?.name || '—'}</div>
          <div className="text-slate-400 mt-0.5">{row.branch?.name || 'Main Campus'}</div>
        </div>
      ),
    },
    {
      header: 'Department / Role',
      cell: (row) => (
        <div className="text-xs text-slate-300">
          <div>{row.designation || 'Staff'}</div>
          {row.department && <div className="text-slate-500">{row.department}</div>}
        </div>
      ),
    },
    {
      header: 'Measurements',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.measurementCount > 0 ? 'success' : 'default'}>
            {row.measurementCount || 0} recorded
          </Badge>
          {row.measurementCount > 0 && (
            <button
              onClick={() => handleViewPersonHistory(row)}
              title="View Measurement History"
              className="p-1 text-slate-400 hover:text-brand-400 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (row) => (
        <div className="text-xs text-slate-400 font-mono">
          {row.mobileNumber || row.email || '—'}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {canAddMeasurements && (
            <button
              onClick={() => navigate(`/measurements/new?personId=${row._id}&orgId=${row.organization?._id || ''}&branchId=${row.branch?._id || ''}`)}
              title="Take Measurement"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600/80 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Measure</span>
            </button>
          )}

          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Person"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => handleDelete(row)}
              title="Delete"
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
            <Users className="w-6 h-6 text-brand-400" />
            Persons / Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage employees, doctors, nurses, security personnel, and corporate uniform recipients.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          + Add Person
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={persons}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search person name, employee ID, mobile, dept..."
        emptyTitle="No Persons Found"
        emptyDescription="Add employees/customers to begin taking dynamic garment measurements."
        emptyActionText="+ Add Person"
        onEmptyAction={handleOpenAdd}
        filters={
          <>
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

            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Roles</option>
              {DEFAULT_PROFESSION_TYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </>
        }
        pagination={pagination}
        onPageChange={(p) => fetchPersons(p)}
      />

      {/* Add / Edit Person Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerson ? `Edit: ${editingPerson.fullName}` : 'Add New Person / Employee'}
        subtitle="Fill in person profile and uniform role designation"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rahul Shah"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Person ID / Employee ID
              </label>
              <input
                type="text"
                value={formData.personId}
                onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gender *
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Profession / Role Type *
              </label>
              <select
                required
                value={formData.professionType}
                onChange={(e) => setFormData({ ...formData, professionType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {DEFAULT_PROFESSION_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization *
              </label>
              <select
                required
                value={formData.organization}
                onChange={(e) => handleModalOrgChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Select Organization --</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Branch / Campus
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Select Branch (Optional) --</option>
                {modalBranches.map((br) => (
                  <option key={br._id} value={br._id}>
                    {br.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Cardiology, ICU, Security"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior Consultant"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+91 98254 11001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@domain.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fitting / Body Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Fitting preferences, special requirements, pocket styles, etc."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingPerson ? 'Update Person' : 'Create Person'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Measurement History Drawer */}
      <MeasurementHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        measurement={selectedMeasurementForHistory}
        onVersionCreated={() => fetchPersons(pagination.page)}
      />
    </div>
  );
};
