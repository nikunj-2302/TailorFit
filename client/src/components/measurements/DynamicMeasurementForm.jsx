import React from 'react';
import { HelpCircle, AlertCircle, Sparkles } from 'lucide-react';

export const DynamicMeasurementForm = ({
  template,
  values = {},
  onChange,
  errors = {},
  unit = 'Inch',
  onUnitChange,
  readOnly = false,
}) => {
  if (!template || !template.fields || template.fields.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
        <Sparkles className="w-8 h-8 text-brand-400 mx-auto mb-2 opacity-60" />
        <p className="text-sm text-slate-300 font-medium">No measurement fields configured for this template.</p>
        <p className="text-xs text-slate-500 mt-1">Please select another garment or configure the template in Template Builder.</p>
      </div>
    );
  }

  // Group fields by category for a cleaner, organized experience
  const groupedFields = template.fields.reduce((acc, item) => {
    const cat = item.field?.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Template Header Info and Unit Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
        <div>
          <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
            Template: {template.name}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Applicable Gender: <span className="text-slate-200">{template.gender}</span> • Fields: <span className="text-slate-200">{template.fields.length}</span>
          </div>
        </div>

        {onUnitChange && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Unit:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              {['Inch', 'cm'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onUnitChange(u)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    unit === u
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Field Groups */}
      {Object.entries(groupedFields).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-2">
            <span>{category}</span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">({items.length} measurements)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => {
              const field = item.field;
              if (!field) return null;

              const code = field.code;
              const val = values[code] !== undefined ? values[code] : '';
              const error = errors[code];
              const fieldUnit = item.unit || unit || 'Inch';

              return (
                <div
                  key={field._id || idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    error
                      ? 'bg-rose-950/20 border-rose-500/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{field.name}</span>
                      {item.isRequired && <span className="text-rose-400 text-sm">*</span>}
                    </label>

                    {item.helpText && (
                      <span title={item.helpText} className="text-slate-500 hover:text-slate-300 cursor-help">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.25"
                      min={item.minVal || 0}
                      max={item.maxVal || 200}
                      disabled={readOnly}
                      value={val}
                      placeholder={item.isRequired ? 'Required' : 'Optional'}
                      onChange={(e) => onChange(code, e.target.value ? Number(e.target.value) : '', field)}
                      className="w-full pl-3 pr-14 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors font-mono font-medium disabled:bg-slate-900 disabled:text-slate-400"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-slate-400 uppercase pointer-events-none">
                      {fieldUnit}
                    </span>
                  </div>

                  {/* Range or validation error message */}
                  {error ? (
                    <div className="flex items-center gap-1 text-[11px] text-rose-400 mt-1.5 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : (item.minVal || item.maxVal) ? (
                    <div className="text-[10px] text-slate-500 mt-1">
                      Range: {item.minVal || '0'} - {item.maxVal || '∞'} {fieldUnit}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
