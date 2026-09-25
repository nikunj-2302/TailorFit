import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect if not on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const organizationService = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
};

export const branchService = {
  getAll: (params) => api.get('/branches', { params }),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

export const personService = {
  getAll: (params) => api.get('/persons', { params }),
  getById: (id) => api.get(`/persons/${id}`),
  create: (data) => api.post('/persons', data),
  update: (id, data) => api.put(`/persons/${id}`, data),
  delete: (id) => api.delete(`/persons/${id}`),
};

export const garmentService = {
  getAll: (params) => api.get('/garments', { params }),
  getById: (id) => api.get(`/garments/${id}`),
  create: (data) => api.post('/garments', data),
  update: (id, data) => api.put(`/garments/${id}`, data),
  delete: (id) => api.delete(`/garments/${id}`),
};

export const measurementFieldService = {
  getAll: (params) => api.get('/measurement-fields', { params }),
  getById: (id) => api.get(`/measurement-fields/${id}`),
  create: (data) => api.post('/measurement-fields', data),
  update: (id, data) => api.put(`/measurement-fields/${id}`, data),
  delete: (id) => api.delete(`/measurement-fields/${id}`),
};

export const templateService = {
  getAll: (params) => api.get('/measurement-templates', { params }),
  getById: (id) => api.get(`/measurement-templates/${id}`),
  resolve: (data) => api.post('/measurement-templates/resolve', data),
  create: (data) => api.post('/measurement-templates', data),
  update: (id, data) => api.put(`/measurement-templates/${id}`, data),
  delete: (id) => api.delete(`/measurement-templates/${id}`),
};

export const measurementService = {
  getAll: (params) => api.get('/measurements', { params }),
  getById: (id) => api.get(`/measurements/${id}`),
  getByPersonId: (personId) => api.get(`/measurements/person/${personId}`),
  saveBatch: (data) => api.post('/measurements/batch', data),
  createNewVersion: (id, data) => api.post(`/measurements/${id}/new-version`, data),
  duplicate: (id, data) => api.post(`/measurements/${id}/duplicate`, data),
  delete: (id) => api.delete(`/measurements/${id}`),
};

export const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getOrganizations: () => api.get('/reports/organizations'),
  getMeasurements: (params) => api.get('/reports/measurements', { params }),
  getOrders: (params) => api.get('/reports/orders', { params }),
  getAuditLogs: (params) => api.get('/reports/audit-logs', { params }),
};

export const systemService = {
  seed: () => api.post('/seed'),
};

export default api;
