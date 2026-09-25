import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Check, Edit3, User, Building2, Shirt } from 'lucide-react';

export const MeasurementReviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  person,
  organization,
  branch,
  garmentEntries = [],
  isSubmitting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Measurements Before Saving"
      subtitle="Please verify the customer information and garment measurements below"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Person & Organization Summary Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-950/80 border border-brand-500/30 text-brand-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Customer / Employee</div>
              <div className="text-sm font-bold text-white">{person?.fullName}</div>
              <div className="text-xs text-slate-400">
                ID: {person?.personId} • {person?.gender} • {person?.professionType}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Organization & Branch</div>
              <div className="text-sm font-bold text-white">{organization?.name}</div>
              <div className="text-xs text-slate-400">{branch?.name || 'Main / All Branches'}</div>
            </div>
          </div>
        </div>

        {/* Garment Entries Breakdown */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Garment Measurements to Save ({garmentEntries.length})
          </div>

          {garmentEntries.map((entry, index) => {
            const valuesList = Object.entries(entry.values || {}).filter(([_, val]) => val !== '' && val !== null);

            return (
              <div
                key={index}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-brand-400" />
                    <span className="font-bold text-white text-sm">
                      {index + 1}. {entry.garmentName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {entry.unit || 'Inch'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{valuesList.length} values recorded</span>
                </div>

                {valuesList.length === 0 ? (
                  <p className="text-xs text-amber-400 italic">No measurement values entered for this garment.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {valuesList.map(([code, val]) => {
                      const meta = entry.fieldMeta?.[code];
                      return (
                        <div key={code} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[11px] text-slate-400 truncate">{meta?.name || code}</div>
                          <div className="text-sm font-bold text-slate-100 font-mono">
                            {val} <span className="text-[10px] text-slate-500">{entry.unit || 'Inch'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {entry.notes && (
                  <div className="text-xs text-slate-400 pt-1">
                    <span className="font-semibold text-slate-300">Notes:</span> {entry.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting} icon={Edit3}>
            Edit Measurements
          </Button>
          <Button variant="success" onClick={onConfirm} isLoading={isSubmitting} icon={Check}>
            Save All Measurements
          </Button>
        </div>
      </div>
    </Modal>
  );
};
