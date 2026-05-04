import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

const adminClient = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export async function submitTest(payload) {
  const { data } = await apiClient.post('/analyze', payload);
  return data;
}

export const adminApi = {
  login: (credentials) =>
    adminClient.post('/login', credentials).then((r) => r.data),

  dashboard: () =>
    adminClient.get('/dashboard').then((r) => r.data),

  getPersonnel: (params) =>
    adminClient.get('/personnel', { params }).then((r) => r.data),

  getPersonnelDetail: (id) =>
    adminClient.get(`/personnel/${id}`).then((r) => r.data),

  getComparison: (ids) =>
    adminClient.get('/compare', { params: { ids } }).then((r) => r.data),

  exportExcel: () => {
    const token = localStorage.getItem('adminToken');
    return adminClient
      .get('/export/excel', { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const url = URL.createObjectURL(r.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'personel-raporu.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      });
  },
  
  exportPDF: (ids) => {
    const token = localStorage.getItem('adminToken');
    const url = `${API_BASE_URL}/api/admin/export/pdf?ids=${ids.join(',')}&token=${token}`;
    window.location.href = url;
  },
  
  exportSinglePDF: (id) => {
    const token = localStorage.getItem('adminToken');
    const url = `${API_BASE_URL}/api/admin/personnel/${id}/pdf?token=${token}`;
    window.location.href = url;
  },
};
