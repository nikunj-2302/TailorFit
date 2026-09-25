import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { History, Calendar, User, Copy, ArrowRight, Clock, PlusCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { measurementService } from '../../services/api';

export const MeasurementHistoryDrawer = ({
  isOpen,
  onClose,
  measurement,
  onVersionCreated,
}) => {
  const { success, error } = useToast();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isEditingNewVersion, setIsEditingNewVersion] = useState(false);
  const [newValues, setNewValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!measurement) return null;

  const history = measurement.versionHistory || [measurement];

  const handleStartNewVersion = (source) => {
    const valMap = {};
    (source.values || []).forEach((v) => {
      valMap[v.fieldCode] = v.value;
    });
    setNewValues(valMap);
    setIsEditingNewVersion(true);
  };

  const handleSaveNewVersion = async () => {
    try {
      setIsSubmitting(true);
      const formattedValues = Object.entries(newValues).map(([code, val]) => ({
        fieldCode: code,
        fieldName: code,
        value: Number(val),
        unit: measurement.unit || 'Inch',
      }));

      const res = await measurementService.createNewVersion(measurement._id, {
        values: formattedValues,
        unit: measurement.unit,
        notes: `Updated version v${measurement.version + 1}`,
      });

      success('New measurement version created successfully!');
      setIsEditingNewVersion(false);
      if (onVersionCreated) onVersionCreated(res.data.data);
      onClose();
    } catch (err) {
      error('Failed to create new version: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Measurement Version History: ${measurement.person?.fullName || ''} - ${measurement.garment?.name || ''}`}
      subtitle={`Measurement # ${measurement.measurementNumber} • Total Versions: ${history.length}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Timeline of versions */}
        <div className="space-y-4">
          {history.map((ver, idx) => {
            const isLatest = ver.isLatest || idx === 0;
            return (
              <div
                key={ver._id || idx}
                className={`p-5 rounded-2xl border transition-all ${
                  isLatest
                    ? 'bg-slate-900/90 border-brand-500/40 shadow-lg shadow-brand-950/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-brand-400">
                      v{ver.version}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          Version {ver.version}
                        </span>
                        {isLatest ? (
                          <Badge variant="brand" size="sm">Current Active Version</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Archived</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(ver.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {ver.createdBy?.name && (
                          <span>• Recorded by <span className="text-slate-300">{ver.createdBy.name}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLatest && !isEditingNewVersion && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlusCircle}
                        onClick={() => handleStartNewVersion(ver)}
                      >
                        Create Version {ver.version + 1}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Values Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {(ver.values || []).map((valItem, vIdx) => (
                    <div key={vIdx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        {valItem.fieldName || valItem.fieldCode}
                      </div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {valItem.value}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">{valItem.unit || ver.unit || 'Inch'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {ver.notes && (
                  <div className="mt-3 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                    <span className="font-semibold text-slate-300">Notes:</span> {ver.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick New Version Creator Form */}
        {isEditingNewVersion && (
          <div className="p-5 rounded-2xl bg-brand-950/30 border border-brand-500/40 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-brand-500/20 pb-2">
              <h4 className="text-sm font-bold text-brand-300 flex items-center gap-2">
                <History className="w-4 h-4" />
                Drafting Version {measurement.version + 1}
              </h4>
              <button
                onClick={() => setIsEditingNewVersion(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Update the fields below. A new version record will be created while preserving all historical fitting data.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(measurement.values || []).map((fieldItem) => (
                <div key={fieldItem.fieldCode} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {fieldItem.fieldName || fieldItem.fieldCode}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      value={newValues[fieldItem.fieldCode] !== undefined ? newValues[fieldItem.fieldCode] : ''}
                      onChange={(e) =>
                        setNewValues({
                          ...newValues,
                          [fieldItem.fieldCode]: e.target.value ? Number(e.target.value) : '',
                        })
                      }
                      className="w-full pl-2.5 pr-10 py-1.5 bg-slate-950 border border-slate-700 rounded text-sm text-white font-mono"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      {measurement.unit || 'Inch'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsEditingNewVersion(false)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" isLoading={isSubmitting} onClick={handleSaveNewVersion}>
                Save as Version {measurement.version + 1}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
