import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onEmptyAction,
  emptyActionText,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  filters,
  pagination,
  onPageChange,
  keyField = '_id',
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Top Search & Filter Bar */}
      {(onSearchChange || filters) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          )}
          {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <LoadingSpinner />
          ) : data.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                onAction={onEmptyAction}
                actionText={emptyActionText}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800/90 bg-slate-900/80">
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`px-5 py-3.5 font-semibold text-xs tracking-wider uppercase text-slate-400 ${
                        col.className || ''
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.map((row, rowIndex) => (
                  <tr
                    key={row[keyField] || rowIndex}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-5 py-4 text-slate-300 align-middle ${col.cellClassName || ''}`}
                      >
                        {col.cell ? col.cell(row, rowIndex) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-200">{pagination.total}</span> records
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-300">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
