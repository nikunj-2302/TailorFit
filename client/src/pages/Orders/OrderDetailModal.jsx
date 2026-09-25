import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  ShoppingBag,
  User,
  Building2,
  Calendar,
  Clock,
  Ruler,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_STEPS = [
  'Measurement',
  'Cutting',
  'Stitching',
  'Quality Check',
  'Ready',
  'Delivered',
];

export const OrderDetailModal = ({
  isOpen,
  onClose,
  order,
  onStatusUpdated,
}) => {
  const { canUpdateProduction } = useAuth();
  const { success, error } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');

  if (!order) return null;

  const currentStatusIdx = STATUS_STEPS.indexOf(order.status);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      const res = await orderService.updateStatus(order._id, {
        status: newStatus,
        notes: statusNotes || undefined,
      });
      success(`Order status updated to ${newStatus}`);
      setStatusNotes('');
      if (onStatusUpdated) onStatusUpdated(res.data.data);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderNumber}`}
      subtitle={`Created on ${new Date(order.orderDate).toLocaleDateString()} • Current Status: ${order.status}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Status Stepper Tracker */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Production Stage Progression
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStatusIdx;
              const isCurrent = idx === currentStatusIdx;

              return (
                <div
                  key={step}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-brand-600/20 border-brand-500 text-brand-300 font-bold shadow-lg'
                      : isPast
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 mb-0.5">Stage {idx + 1}</div>
                  <div className="text-xs font-semibold">{step}</div>
                  {isPast && <CheckCircle2 className="w-3.5 h-3.5 mx-auto mt-1 text-emerald-400" />}
                </div>
              );
            })}
          </div>

          {/* Quick Production Status Advancement Buttons */}
          {canUpdateProduction && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Advance workflow to next station:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_STEPS.map((step, idx) => {
                  if (idx <= currentStatusIdx) return null;
                  return (
                    <Button
                      key={step}
                      variant="primary"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(step)}
                    >
                      Move to {step} →
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Customer & Organization Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Customer / Recipient</div>
            <div className="text-sm font-bold text-white">{order.person?.fullName}</div>
            <div className="text-xs text-slate-400">
              ID: {order.person?.personId} • {order.person?.gender} • {order.person?.professionType}
            </div>
            {order.person?.mobileNumber && (
              <div className="text-xs text-cyan-400 font-mono pt-1">
                Phone: {order.person.mobileNumber}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Organization & Delivery</div>
            <div className="text-sm font-bold text-white">{order.organization?.name}</div>
            <div className="text-xs text-slate-400">{order.branch?.name || 'Main Campus'}</div>
            {order.deliveryDate && (
              <div className="text-xs text-amber-400 font-mono pt-1">
                Expected Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Order Items & Linked Measurements */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Order Items ({order.items?.length || 0})
          </div>

          <div className="space-y-3">
            {(order.items || []).map((item, index) => (
              <div
                key={item._id || index}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-brand-400 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {item.garment?.name || 'Garment'}
                    </span>
                    <Badge variant="brand">Qty: {item.quantity}</Badge>
                  </div>

                  {item.total > 0 && (
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      ₹{item.total.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Fabric specifications */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-300">Fabric Required:</span>{' '}
                    {item.fabricRequired || 'Standard spec'}
                  </div>
                  <div>
                    <span className="text-slate-300">Fabric Provided:</span>{' '}
                    {item.fabricProvidedByCustomer ? 'By Customer' : 'By Uniform Vendor'}
                  </div>
                </div>

                {/* Linked Measurement Values */}
                {item.measurement && item.measurement.values && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[11px] font-semibold text-brand-400 flex items-center gap-1.5 mb-1.5">
                      <Ruler className="w-3 h-3" />
                      <span>Linked Tailoring Measurements ({item.measurement.measurementNumber}):</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {item.measurement.values.map((valItem, vIdx) => (
                        <div key={vIdx} className="text-[11px]">
                          <span className="text-slate-400 block truncate">{valItem.fieldName || valItem.fieldCode}</span>
                          <span className="font-bold text-white font-mono">{valItem.value} {valItem.unit || 'in'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div className="text-xs text-slate-400 italic">
                    Note: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-slate-200">Notes & Logs:</span>
            <pre className="mt-1 font-sans text-xs text-slate-400 whitespace-pre-wrap">{order.notes}</pre>
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
