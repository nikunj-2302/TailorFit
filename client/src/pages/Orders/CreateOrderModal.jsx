import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Plus, Trash2, ShoppingBag, Ruler } from 'lucide-react';
import {
  organizationService,
  branchService,
  personService,
  garmentService,
  measurementService,
  orderService,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const CreateOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const { success, error } = useToast();

  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [persons, setPersons] = useState([]);
  const [garments, setGarments] = useState([]);
  const [personMeasurements, setPersonMeasurements] = useState([]);

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Items list
  const [items, setItems] = useState([
    {
      garment: '',
      measurement: '',
      fabricRequired: '',
      fabricProvidedByCustomer: false,
      quantity: 1,
      price: 0,
      discount: 0,
      notes: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [orgRes, garmentRes] = await Promise.all([
          organizationService.getAll({ limit: 100 }),
          garmentService.getAll(),
        ]);
        if (orgRes.data.success) {
          setOrganizations(orgRes.data.data);
          if (orgRes.data.data.length > 0) {
            handleOrgChange(orgRes.data.data[0]._id);
          }
        }
        if (garmentRes.data.success) setGarments(garmentRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (isOpen) {
      loadInitial();
    }
  }, [isOpen]);

  const handleOrgChange = async (orgId) => {
    setSelectedOrgId(orgId);
    setSelectedBranchId('');
    setSelectedPersonId('');
    setPersonMeasurements([]);

    if (orgId) {
      try {
        const [branchRes, personRes] = await Promise.all([
          branchService.getAll({ organization: orgId }),
          personService.getAll({ organization: orgId, limit: 100 }),
        ]);
        if (branchRes.data.success) setBranches(branchRes.data.data);
        if (personRes.data.success) setPersons(personRes.data.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePersonChange = async (personId) => {
    setSelectedPersonId(personId);
    if (personId) {
      try {
        const res = await measurementService.getByPersonId(personId);
        if (res.data.success) {
          setPersonMeasurements(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setPersonMeasurements([]);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        garment: garments[0]?._id || '',
        measurement: '',
        fabricRequired: '',
        fabricProvidedByCustomer: false,
        quantity: 1,
        price: 0,
        discount: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrgId || !selectedPersonId) {
      error('Organization and Person are required');
      return;
    }

    if (items.length === 0 || !items[0].garment) {
      error('At least one order item is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await orderService.create({
        organization: selectedOrgId,
        branch: selectedBranchId || null,
        person: selectedPersonId,
        items,
        deliveryDate: deliveryDate || undefined,
        notes,
      });

      success('Uniform Order created successfully!');
      if (onOrderCreated) onOrderCreated(res.data.data);
      onClose();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Uniform Order"
      subtitle="Assemble uniform garments, link customer measurements, and schedule delivery"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer / Org Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Organization *
            </label>
            <select
              required
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Select Org --</option>
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
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Main / All Branches</option>
              {branches.map((br) => (
                <option key={br._id} value={br._id}>
                  {br.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Person / Staff Member *
            </label>
            <select
              required
              value={selectedPersonId}
              onChange={(e) => handlePersonChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Select Person --</option>
              {persons.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.professionType})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
            </input>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Order Notes & Delivery Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Include embroidered logo on front chest pocket"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Order Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Order Items ({items.length})
            </h4>
            <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddItem}>
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-300">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-500 hover:text-rose-400 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Garment Type *
                    </label>
                    <select
                      required
                      value={item.garment}
                      onChange={(e) => handleItemChange(index, 'garment', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="">-- Choose Garment --</option>
                      {garments.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Link Saved Measurement
                    </label>
                    <select
                      value={item.measurement}
                      onChange={(e) => handleItemChange(index, 'measurement', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="">-- Select Measurement --</option>
                      {personMeasurements.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.measurementNumber} ({m.garment?.name} v{m.version})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Fabric Required
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2.25 Meters"
                      value={item.fabricRequired}
                      onChange={(e) => handleItemChange(index, 'fabricRequired', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Fabric Provider
                    </label>
                    <select
                      value={item.fabricProvidedByCustomer ? 'true' : 'false'}
                      onChange={(e) =>
                        handleItemChange(index, 'fabricProvidedByCustomer', e.target.value === 'true')
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="false">Provided by Uniform Vendor</option>
                      <option value="true">Provided by Customer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
