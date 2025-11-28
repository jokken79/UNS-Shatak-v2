import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', new URLSearchParams({ username, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

export const getMe = () => api.get('/auth/me');

// Apartments
export const getApartments = (params?: any) => api.get('/apartments/', { params });
export const getApartment = (id: string) => api.get(`/apartments/${id}`);
export const createApartment = (data: any) => api.post('/apartments/', data);
export const updateApartment = (id: string, data: any) => api.put(`/apartments/${id}`, data);
export const deleteApartment = (id: string) => api.delete(`/apartments/${id}`);
export const assignEmployee = (aptId: string, empId: string) => api.post(`/apartments/${aptId}/assign/${empId}`);
export const unassignEmployee = (aptId: string, empId: string) => api.post(`/apartments/${aptId}/unassign/${empId}`);
export const getApartmentStats = () => api.get('/apartments/stats');

// Employees
export const getEmployees = (params?: any) => api.get('/employees/', { params });
export const getEmployee = (id: string) => api.get(`/employees/${id}`);
export const createEmployee = (data: any) => api.post('/employees/', data);
export const updateEmployee = (id: string, data: any) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id: string) => api.delete(`/employees/${id}`);
export const getEmployeesWithoutApartment = () => api.get('/employees/without-apartment');
export const getEmployeeStats = () => api.get('/employees/stats');

// Factories
export const getFactories = (params?: any) => api.get('/factories/', { params });
export const getFactory = (id: string) => api.get(`/factories/${id}`);
export const createFactory = (data: any) => api.post('/factories/', data);
export const updateFactory = (id: string, data: any) => api.put(`/factories/${id}`, data);
export const deleteFactory = (id: string) => api.delete(`/factories/${id}`);
export const getFactoryStats = () => api.get('/factories/stats');

// Import
export const importFactories = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import/factories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const importEmployees = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import/employees', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getImportLogs = () => api.get('/import/logs');
export const getImportTemplate = (type: string) => api.get(`/import/template/${type}`);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
