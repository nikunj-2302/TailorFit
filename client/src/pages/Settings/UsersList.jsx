import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import { authService } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'measurement_user',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authService.getUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'measurement_user',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username || '',
      password: '',
      role: user.role,
      phone: user.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      error('Name and email are required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingUser) {
        await authService.updateUser(editingUser._id, formData);
        success('User updated successfully');
      } else {
        if (!formData.password) {
          error('Password is required for new user');
          setIsSubmitting(false);
          return;
        }
        await authService.createUser(formData);
        success('User account created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate user account for ${user.name}?`)) return;
    try {
      await authService.deleteUser(user._id);
      success('User deactivated successfully');
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      header: 'User Account',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.name}</div>
            <div className="text-xs text-slate-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      cell: (row) => {
        const colors = {
          super_admin: 'danger',
          admin: 'warning',
          measurement_user: 'cyan',
          production_user: 'purple',
        };
        return <Badge variant={colors[row.role] || 'default'}>{row.role.replace('_', ' ').toUpperCase()}</Badge>;
      },
    },
    {
      header: 'Phone',
      cell: (row) => <span className="font-mono text-xs text-slate-400">{row.phone || '—'}</span>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit User"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            title="Deactivate User"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-400" />
            User & Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage system users and configure role-based access permissions.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          + Add User Account
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        emptyTitle="No Users Found"
        emptyDescription="Create user accounts to assign roles."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit: ${editingUser.name}` : 'Create User Account'}
        subtitle="Set user role and authentication credentials"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password {editingUser && '(leave blank to keep unchanged)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              System Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="super_admin">Super Admin (Full Access)</option>
              <option value="admin">Admin (Orgs, Garments, Templates)</option>
              <option value="measurement_user">Measurement User (Persons & Measurements)</option>
              <option value="production_user">Production User (Orders & Stages)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
