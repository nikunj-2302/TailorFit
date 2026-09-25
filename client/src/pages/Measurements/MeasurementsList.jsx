import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ruler,
  Plus,
  History,
  Copy,
  Trash2,
  Eye,
  ShoppingBag,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  measurementService,
  organizationService,
  garmentService,
  personService,
} from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { MeasurementHistoryDrawer } from '../../components/measurements/MeasurementHistoryDrawer';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const MeasurementsList = () => {
  const [measurements, setMeasurements] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [garmentFilter, setGarmentFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [isLatestOnly, setIsLatestOnly] = useState('true');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // History Drawer & Duplicate Modal States
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateTargetPersonId, setDuplicateTargetPersonId] = useState('');
  const [allPersons, setAllPersons] = useState([]);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const { success, error } = useToast();
  const { canAddMeasurements, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchMeasurements = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await measurementService.getAll({
        search,
        organization: orgFilter || undefined,
        garment: garmentFilter || undefined,
        gender: genderFilter !== 'All' ? genderFilter : undefined,
        isLatestOnly,
        page,
        limit: 10,
      });
      if (res.data.success) {
        setMeasurements(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      error('Failed to load measurements: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, orgFilter, garmentFilter, genderFilter, isLatestOnly, error]);

  const loadFilterData = async () => {
    try {
      const [orgRes, garmentRes, personRes] = await Promise.all([
        organizationService.getAll({ limit: 100 }),
        garmentService.getAll(),
        personService.getAll({ limit: 100 }),
      ]);
      if (orgRes.data.success) setOrganizations(orgRes.data.data);
      if (garmentRes.data.success) setGarments(garmentRes.data.data);
      if (personRes.data.success) setAllPersons(personRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchMeasurements(1);
  }, [fetchMeasurements]);

  const handleOpenHistory = async (measurement) => {
    try {
      const res = await measurementService.getById(measurement._id);
      if (res.data.success) {
        setSelectedMeasurement(res.data.data);
        setHistoryDrawerOpen(true);
      }
    } catch (err) {
      error('Failed to load version history');
    }
  };

  const handleOpenDuplicate = (measurement) => {
    setSelectedMeasurement(measurement);
    setDuplicateTargetPersonId(measurement.person?._id || '');
    setIsDuplicateOpen(true);
  };

  const handleConfirmDuplicate = async () => {
    try {
      setIsDuplicating(true);
      await measurementService.duplicate(selectedMeasurement._id, {
        targetPersonId: duplicateTargetPersonId,
      });
      success('Measurement duplicated successfully!');
      setIsDuplicateOpen(false);
      fetchMeasurements(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to duplicate measurement');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async (measurement) => {
    if (!window.confirm(`Are you sure you want to archive measurement ${measurement.measurementNumber}?`)) return;
    try {
      await measurementService.delete(measurement._id);
      success('Measurement archived successfully');
      fetchMeasurements(pagination.page);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete measurement');
    }
  };

  const columns = [
    {
      header: 'Measurement #',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono font-bold text-white text-xs">{row.measurementNumber}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-950 text-brand-300 border border-brand-500/30">
                v{row.version}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {row.unit || 'Inch'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer / Person',
      cell: (row) => (
        <div>
          <div className="font-bold text-white text-sm">{row.person?.fullName || 'Customer'}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <span className="font-mono text-[11px] text-slate-300">{row.person?.personId}</span>
            <span>•</span>
            <span className="text-cyan-400">{row.person?.professionType}</span>
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
      header: 'Garment & Template',
      cell: (row) => (
        <div>
          <div className="text-xs font-bold text-white">{row.garment?.name || 'Garment'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{row.template?.name || 'Dynamic Template'}</div>
        </div>
      ),
    },
    {
      header: 'Measurement Values Preview',
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(row.values || []).slice(0, 4).map((v, idx) => (
            <span
              key={idx}
              className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200"
            >
              {v.fieldName || v.fieldCode}: <span className="text-brand-300 font-bold">{v.value}</span>
            </span>
          ))}
          {(row.values || []).length > 4 && (
            <span className="text-[10px] text-slate-500 self-center">
              +{row.values.length - 4} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenHistory(row)}
            title="View History & Versions"
            className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
          </button>

          {canAddMeasurements && (
            <button
              onClick={() => handleOpenDuplicate(row)}
              title="Duplicate Measurement"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleDelete(row)}
              title="Archive Measurement"
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
            <Ruler className="w-6 h-6 text-brand-400" />
            Measurements Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse all versioned measurements, inspect fitting records, duplicate values, or create new revisions.
          </p>
        </div>

        {canAddMeasurements && (
          <Button variant="primary" icon={Plus} onClick={() => navigate('/measurements/new')}>
            + New Measurement
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={measurements}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by number, person name, employee ID..."
        emptyTitle="No Measurements Found"
        emptyDescription="Capture tailored dynamic measurements for staff and customers."
        emptyActionText={canAddMeasurements ? "+ New Measurement" : undefined}
        onEmptyAction={canAddMeasurements ? () => navigate('/measurements/new') : undefined}
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
              value={garmentFilter}
              onChange={(e) => setGarmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Garments</option>
              {garments.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={isLatestOnly}
              onChange={(e) => setIsLatestOnly(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="true">Latest Versions Only</option>
              <option value="false">All Versions / Full History</option>
            </select>
          </>
        }
        pagination={pagination}
        onPageChange={(p) => fetchMeasurements(p)}
      />

      {/* History Drawer */}
      <MeasurementHistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        measurement={selectedMeasurement}
        onVersionCreated={() => fetchMeasurements(pagination.page)}
      />

      {/* Duplicate Measurement Modal */}
      <Modal
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
        title="Duplicate Measurement Record"
        subtitle={`Copy fitting parameters from ${selectedMeasurement?.measurementNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Select the target customer/employee who will receive a copy of these measurement values:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Person *
            </label>
            <select
              value={duplicateTargetPersonId}
              onChange={(e) => setDuplicateTargetPersonId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {allPersons.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.personId || 'No ID'} • {p.organization?.name || ''})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isDuplicating}
              onClick={handleConfirmDuplicate}
            >
              Duplicate Measurement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
