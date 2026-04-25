import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const operatorApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const customerApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptors
operatorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('operatorToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

operatorApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('operatorToken');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/display') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

customerApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('customerToken');
      if (window.location.pathname !== '/portal/login' && window.location.pathname !== '/portal/setup') {
        window.location.href = '/portal/login';
      }
    }
    return Promise.reject(err);
  }
);

export const slotsApi = {
  getAll: () => operatorApi.get('/api/slots'),
  updateStatus: (data) => operatorApi.post('/api/slots/update', data),
};

export const usersApi = {
  register: (data) => operatorApi.post('/api/users/register', data),
  scan: (qrToken) => operatorApi.post('/api/users/scan', { qrToken }),
  getById: (id) => operatorApi.get(`/api/users/${id}`),
  getPoints: (id) => operatorApi.get(`/api/users/${id}/points`),
  getPointsSummary: (id) => operatorApi.get(`/api/users/${id}/points-summary`),
  applyDiscount: (id, sessionId) => operatorApi.post(`/api/users/${id}/apply-discount`, { sessionId }),
  regenerateQr: (id) => operatorApi.post(`/api/users/${id}/regenerate-qr`),
  search: (q) => operatorApi.get(`/api/users/search?q=${encodeURIComponent(q)}`),
  getAll: () => operatorApi.get('/api/users'),
  update: (id, data) => operatorApi.put(`/api/users/${id}`, data),
  delete: (id) => operatorApi.delete(`/api/users/${id}`),
};

export const sessionsApi = {
  getActive: () => operatorApi.get('/api/sessions/active'),
  getBySlot: (slotId) => operatorApi.get(`/api/sessions/slot/${slotId}`),
  getById: (id) => operatorApi.get(`/api/sessions/slot/${id}`),
  entry: (data) => operatorApi.post('/api/sessions/entry', data),
  exit: (data) => operatorApi.post('/api/sessions/exit', data),
  getUserSessions: (userId) => operatorApi.get(`/api/sessions/user/${userId}`),
};

export const paymentsApi = {
  getBySession: (id) => operatorApi.get(`/api/payments/${id}`),
  pay: (id, method, appliedDiscount = 0) => operatorApi.post(`/api/payments/${id}/pay`, { method, appliedDiscount }),
  initiateKhalti: (id) => operatorApi.post(`/api/payments/${id}/khalti/initiate`),
  verifyKhalti: (data) => operatorApi.post('/api/payments/khalti/verify', data),
};

export const adminApi = {
  getDashboard: () => operatorApi.get('/api/admin/dashboard'),
  getSessions: (date) => operatorApi.get(`/api/admin/sessions?date=${date || ''}`),
  getRevenue: (period) => operatorApi.get(`/api/admin/analytics/revenue?period=${period}`),
  getPeakHours: () => operatorApi.get('/api/admin/analytics/peak-hours'),
  getSlotPerformance: () => operatorApi.get('/api/admin/analytics/slot-performance'),
  getMembersAnalytics: () => operatorApi.get('/api/admin/analytics/members'),
};

export const authApi = {
  operatorLogin: (data) => axios.post(`${API_URL}/api/auth/operator/login`, data),
  forgotOperatorPassword: (email) => axios.post(`${API_URL}/api/auth/operator/forgot-password`, { email }),
  resetOperatorPassword: (data) => axios.post(`${API_URL}/api/auth/operator/reset-password`, data),
  
  customerSetup: (data) => axios.post(`${API_URL}/api/auth/customer/setup-password`, data),
  customerLogin: (data) => axios.post(`${API_URL}/api/auth/customer/login`, data),
  forgotCustomerPassword: (emailOrPhone) => axios.post(`${API_URL}/api/auth/customer/forgot-password`, { emailOrPhone }),
  resetCustomerPassword: (data) => axios.post(`${API_URL}/api/auth/customer/reset-password`, data),
};

export const portalApi = {
  getProfile: () => customerApi.get('/api/users/my/profile'),
  getSessions: (page = 1) => customerApi.get(`/api/sessions/my?page=${page}`),
};

export default operatorApi;
