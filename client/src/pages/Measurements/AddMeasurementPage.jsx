import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ruler,
  Building2,
  GitBranch,
  User,
  Shirt,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  organizationService,
  branchService,
  personService,
  garmentService,
  templateService,
  measurementService,
} from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DynamicMeasurementForm } from '../../components/measurements/DynamicMeasurementForm';
import { MeasurementReviewModal } from '../../components/measurements/MeasurementReviewModal';
import { useToast } from '../../context/ToastContext';

export const AddMeasurementPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Data catalogues
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [persons, setPersons] = useState([]);
  const [garments, setGarments] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Selection states
  const [selectedOrgId, setSelectedOrgId] = useState(searchParams.get('orgId') || '');
  const [selectedBranchId, setSelectedBranchId] = useState(searchParams.get('branchId') || '');
  const [selectedPersonId, setSelectedPersonId] = useState(searchParams.get('personId') || '');
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Multi-garment measurement entries array
  // Each item: { id, garmentId, garmentName, template, values: {}, unit: 'Inch', notes: '', fieldMeta: {}, errors: {} }
  const [garmentEntries, setGarmentEntries] = useState([]);
  const [resolvingTemplateIdx, setResolvingTemplateIdx] = useState(null);

  // Review & Submit modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [orgRes, garmentRes] = await Promise.all([
          organizationService.getAll({ limit: 100 }),
          garmentService.getAll(),
        ]);
        if (orgRes.data.success) setOrganizations(orgRes.data.data);
        if (garmentRes.data.success) setGarments(garmentRes.data.data);

        // Pre-select first organization if none provided
        if (!selectedOrgId && orgRes.data.data.length > 0) {
          setSelectedOrgId(orgRes.data.data[0]._id);
        }
      } catch (err) {
        error('Failed to load initial form data');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, []);

  // When Org changes -> fetch its branches & persons
  useEffect(() => {
    if (!selectedOrgId) {
      setBranches([]);
      setPersons([]);
      return;
    }

    const loadOrgBranchesAndPersons = async () => {
      try {
        const [branchRes, personRes] = await Promise.all([
          branchService.getAll({ organization: selectedOrgId }),
          personService.getAll({ organization: selectedOrgId, limit: 100 }),
        ]);

        if (branchRes.data.success) setBranches(branchRes.data.data);
        if (personRes.data.success) {
          setPersons(personRes.data.data);
          if (selectedPersonId) {
            const found = personRes.data.data.find((p) => p._id === selectedPersonId);
            if (found) setSelectedPerson(found);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadOrgBranchesAndPersons();
  }, [selectedOrgId]);

  // When Branch filter changes
  useEffect(() => {
    if (!selectedOrgId) return;

    const loadPersonsForBranch = async () => {
      try {
        const res = await personService.getAll({
          organization: selectedOrgId,
          branch: selectedBranchId || undefined,
          limit: 100,
        });
        if (res.data.success) setPersons(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadPersonsForBranch();
  }, [selectedBranchId]);

  // When Person changes -> set selected person object
  const handleSelectPerson = (personId) => {
    setSelectedPersonId(personId);
    const p = persons.find((item) => item._id === personId);
    setSelectedPerson(p || null);

    // If person changes, re-resolve templates for existing garments
    if (p && garmentEntries.length > 0) {
      garmentEntries.forEach((entry, idx) => {
        if (entry.garmentId) {
          resolveGarmentTemplate(idx, entry.garmentId, p);
        }
      });
    }
  };

  // Add a new garment slot to the entry form
  const handleAddGarmentSlot = () => {
    if (!selectedPerson) {
      error('Please select a Person / Customer first.');
      return;
    }

    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      garmentId: '',
      garmentName: '',
      template: null,
      values: {},
      unit: 'Inch',
      notes: '',
      fieldMeta: {},
      errors: {},
    };

    setGarmentEntries((prev) => [...prev, newEntry]);
  };

  // Resolve template dynamically from backend
  const resolveGarmentTemplate = async (index, garmentId, person = selectedPerson) => {
    if (!garmentId || !person) return;

    try {
      setResolvingTemplateIdx(index);
      const garmentObj = garments.find((g) => g._id === garmentId);

      const res = await templateService.resolve({
        garment: garmentId,
        gender: person.gender,
        professionType: person.professionType,
        organization: selectedOrgId,
      });

      if (res.data.success && res.data.data) {
        const template = res.data.data;
        const metaMap = {};
        const initialVals = {};

        template.fields.forEach((fItem) => {
          if (fItem.field) {
            metaMap[fItem.field.code] = fItem.field;
          }
        });

        setGarmentEntries((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            garmentId,
            garmentName: garmentObj?.name || 'Garment',
            template,
            fieldMeta: metaMap,
            unit: template.fields[0]?.unit || 'Inch',
            values: initialVals,
            errors: {},
          };
          return updated;
        });
      }
    } catch (err) {
      error(err.response?.data?.message || 'No measurement template configured for this garment');
    } finally {
      setResolvingTemplateIdx(null);
    }
  };

  // Remove a garment slot
  const handleRemoveGarmentSlot = (index) => {
    setGarmentEntries((prev) => prev.filter((_, i) => i !== index));
  };

  // Update measurement field value for a garment
  const handleFieldValueChange = (entryIndex, fieldCode, value, fieldObj) => {
    setGarmentEntries((prev) => {
      const updated = [...prev];
      const entry = { ...updated[entryIndex] };
      entry.values = { ...entry.values, [fieldCode]: value };
      if (fieldObj && !entry.fieldMeta[fieldCode]) {
        entry.fieldMeta[fieldCode] = fieldObj;
      }
      if (entry.errors[fieldCode]) {
        entry.errors = { ...entry.errors, [fieldCode]: null };
      }
      updated[entryIndex] = entry;
      return updated;
    });
  };

  // Validate all garments and open review modal
  const handleProceedToReview = () => {
    if (!selectedPerson) {
      error('Please select a Person / Customer');
      return;
    }

    if (garmentEntries.length === 0) {
      error('Please add at least one garment measurement');
      return;
    }

    let hasErrors = false;
    const updatedEntries = garmentEntries.map((entry) => {
      const entryErrors = {};

      if (!entry.garmentId || !entry.template) {
        hasErrors = true;
        return { ...entry, errors: { general: 'Please select a valid garment and template' } };
      }

      // Check required fields according to template
      (entry.template.fields || []).forEach((fItem) => {
        const field = fItem.field;
        if (!field) return;

        const val = entry.values[field.code];
        if (fItem.isRequired && (val === '' || val === undefined || val === null)) {
          entryErrors[field.code] = `${field.name} measurement is required`;
          hasErrors = true;
        } else if (val !== '' && val !== undefined && val !== null) {
          if (val < 0) {
            entryErrors[field.code] = 'Cannot be negative';
            hasErrors = true;
          }
        }
      });

      return { ...entry, errors: entryErrors };
    });

    setGarmentEntries(updatedEntries);

    if (hasErrors) {
      error('Please fill in all mandatory measurement values before proceeding');
      return;
    }

    setIsReviewOpen(true);
  };

  // Final batch submission to backend
  const handleConfirmSave = async () => {
    try {
      setIsSubmitting(true);

      const garmentsPayload = garmentEntries.map((entry) => {
        const formattedValues = Object.entries(entry.values)
          .filter(([_, val]) => val !== '' && val !== null)
          .map(([code, val]) => {
            const fieldObj = entry.fieldMeta[code];
            return {
              fieldId: fieldObj?._id || null,
              fieldCode: code,
              fieldName: fieldObj?.name || code,
              value: Number(val),
              unit: entry.unit || 'Inch',
            };
          });

        return {
          garmentId: entry.garmentId,
          templateId: entry.template?._id || null,
          values: formattedValues,
          unit: entry.unit || 'Inch',
          notes: entry.notes,
        };
      });

      const res = await measurementService.saveBatch({
        personId: selectedPerson._id,
        organizationId: selectedOrgId,
        branchId: selectedBranchId || selectedPerson.branch,
        garments: garmentsPayload,
      });

      success(res.data.message || 'All measurements saved successfully!');
      setIsReviewOpen(false);
      navigate('/measurements');
    } catch (err) {
      error('Failed to save measurements: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner text="Initializing Dynamic Measurement Studio..." />;
  }

  const selectedOrg = organizations.find((o) => o._id === selectedOrgId);
  const selectedBranch = branches.find((b) => b._id === selectedBranchId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-950 text-brand-300 text-xs font-semibold border border-brand-500/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dynamic MTM Studio</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Ruler className="w-6 h-6 text-brand-400" />
            New Garment Measurement Entry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Select an employee and capture tailored dynamic measurements for single or multiple garments at once.
          </p>
        </div>

        <Button variant="secondary" onClick={() => navigate('/measurements')}>
          Back to List
        </Button>
      </div>

      {/* Step 1 to 4: Organization, Branch & Person Context Bar */}
      <Card
        title="1. Customer & Organization Context"
        subtitle="Select the target organization and customer profile to auto-bind template parameters"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Organization *</span>
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Branch / Campus</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">All Branches / Main</option>
              {branches.map((br) => (
                <option key={br._id} value={br._id}>
                  {br.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Person / Employee *</span>
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => handleSelectPerson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Select Person --</option>
              {persons.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.gender} • {p.professionType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Person Banner */}
        {selectedPerson && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-brand-500/30 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-950 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-sm">
                {selectedPerson.fullName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{selectedPerson.fullName}</div>
                <div className="text-xs text-slate-400">
                  ID: <span className="font-mono text-slate-300">{selectedPerson.personId}</span> • Dept: <span className="text-slate-300">{selectedPerson.department || 'General'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="brand" size="md">Gender: {selectedPerson.gender}</Badge>
              <Badge variant="purple" size="md">Role: {selectedPerson.professionType}</Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Step 5: Multi-Garment Measurements Engine */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Shirt className="w-5 h-5 text-brand-400" />
              2. Garments & Dynamic Measurements
            </h2>
            <p className="text-xs text-slate-400">
              Add all uniform garments for this person (e.g. Shirt, Pant, Coat) and enter measurements.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleAddGarmentSlot}
            disabled={!selectedPerson}
          >
            + Add Another Garment
          </Button>
        </div>

        {garmentEntries.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <Shirt className="w-10 h-10 text-brand-500 mx-auto mb-3 opacity-50" />
            <h4 className="text-base font-bold text-slate-200">No Garments Added Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
              {selectedPerson
                ? `Click '+ Add Another Garment' to select Doctor Shirt, Pant, Scrubs or Lab Coat for ${selectedPerson.fullName}.`
                : 'Select a Person above to begin entering garments and measurements.'}
            </p>
            {selectedPerson && (
              <Button variant="primary" icon={Plus} onClick={handleAddGarmentSlot}>
                Add First Garment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {garmentEntries.map((entry, index) => (
              <Card
                key={entry.id}
                title={`Garment #${index + 1}: ${entry.garmentName || 'Select Garment'}`}
                action={
                  <button
                    type="button"
                    onClick={() => handleRemoveGarmentSlot(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Remove this garment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
                className="border-slate-800"
              >
                <div className="space-y-5">
                  {/* Garment Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Select Garment Type *
                      </label>
                      <select
                        value={entry.garmentId}
                        onChange={(e) => resolveGarmentTemplate(index, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="">-- Choose Garment Type --</option>
                        {garments.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.name} ({g.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Garment Notes / Custom Requirements
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Double pocket, pencil pocket on sleeve"
                        value={entry.notes}
                        onChange={(e) => {
                          const updated = [...garmentEntries];
                          updated[index].notes = e.target.value;
                          setGarmentEntries(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Dynamic Form Render */}
                  {resolvingTemplateIdx === index ? (
                    <LoadingSpinner text="Resolving dynamic measurement template..." />
                  ) : entry.template ? (
                    <DynamicMeasurementForm
                      template={entry.template}
                      values={entry.values}
                      errors={entry.errors}
                      unit={entry.unit}
                      onUnitChange={(newUnit) => {
                        const updated = [...garmentEntries];
                        updated[index].unit = newUnit;
                        setGarmentEntries(updated);
                      }}
                      onChange={(code, val, fieldObj) =>
                        handleFieldValueChange(index, code, val, fieldObj)
                      }
                    />
                  ) : entry.garmentId ? (
                    <p className="text-xs text-amber-400 italic">
                      No matching measurement template found for this garment and gender.
                    </p>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review & Save Bottom Action Bar */}
      {garmentEntries.length > 0 && (
        <div className="sticky bottom-4 z-20 p-4 rounded-2xl glass-dropdown border border-brand-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white">
              Ready to Save Measurements?
            </div>
            <div className="text-xs text-slate-400">
              {garmentEntries.length} garment(s) configured for {selectedPerson?.fullName}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleAddGarmentSlot} icon={Plus}>
              + Add Garment
            </Button>
            <Button
              variant="accent"
              size="lg"
              icon={ArrowRight}
              onClick={handleProceedToReview}
              className="shadow-xl shadow-cyan-500/20"
            >
              Review & Save Measurements
            </Button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <MeasurementReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmSave}
        isSubmitting={isSubmitting}
        person={selectedPerson}
        organization={selectedOrg}
        branch={selectedBranch}
        garmentEntries={garmentEntries}
      />
    </div>
  );
};
