import axios from 'axios';
import { getCurrentFormData } from './errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        // Log API errors (skip error-logs endpoint to avoid loops)
        if (!error.config?.url?.includes('error-logs')) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const errorData = {
                message: error.response?.data?.message || error.message || 'API Error',
                stack: error.stack,
                type: 'api',
                url: error.config?.url,
                method: error.config?.method?.toUpperCase(),
                statusCode: error.response?.status,
                userId: userData._id || userData.id,
                userEmail: userData.email,
                userRole: userData.role,
                companyId: userData.companyId,
                userAgent: navigator.userAgent,
                pageUrl: window.location.href,
                meta: {
                    requestData: (() => {
                        try {
                            if (!error.config?.data) return undefined;
                            const parsed = typeof error.config.data === 'string'
                                ? JSON.parse(error.config.data)
                                : error.config.data;
                            // Strip sensitive fields
                            if (parsed && typeof parsed === 'object') {
                                const { password, newPassword, ...safe } = parsed;
                                return safe;
                            }
                            return parsed;
                        } catch { return error.config?.data; }
                    })(),
                    responseData: error.response?.data,
                    formData: getCurrentFormData() || undefined,
                },
            };
            axios.post(`${API_URL}/error-logs`, errorData, {
                headers: { 'Content-Type': 'application/json' },
            }).catch(() => { });
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    verify: () => api.post('/auth/verify'),
};

// Super Admin API
export const superAdminAPI = {
    getDashboard: () => api.get('/super-admin/dashboard'),
    getProfile: () => api.get('/super-admin/profile'),
    getPassengerCounts: () => api.get('/super-admin/passenger-counts'),
    getPassengers: (params = {}) => api.get('/super-admin/passengers', { params }),
    getGroups: () => api.get('/super-admin/groups'),
    getReports: (companyId) => api.get(`/super-admin/reports?companyId=${companyId}`),
    getUnassignedCounts: () => api.get('/super-admin/unassigned-counts'),
    downloadBackup: () => api.get('/super-admin/backup', { responseType: 'blob' }),
};

// Companies API
export const companiesAPI = {
    getAll: () => api.get('/companies'),
    getById: (id) => api.get(`/companies/${id}`),
    create: (data) => api.post('/companies', data),
    update: (id, data) => api.put(`/companies/${id}`, data),
    delete: (id) => api.delete(`/companies/${id}`),
    getAdmins: (id) => api.get(`/companies/${id}/admins`),
    createAdmin: (id, data) => api.post(`/companies/${id}/admins`, data),
    updateAdmin: (companyId, adminId, data) =>
        api.put(`/companies/${companyId}/admins/${adminId}`, data),
    deleteAdmin: (companyId, adminId) =>
        api.delete(`/companies/${companyId}/admins/${adminId}`),
    resetAdminPassword: (companyId, adminId, newPassword) =>
        api.post(`/companies/${companyId}/admins/${adminId}/reset-password`, { newPassword }),
};

// Passengers API
export const passengersAPI = {
    getAll: () => api.get('/passengers'),
    getUnassigned: () => api.get('/passengers/unassigned'),
    create: (data) => api.post('/passengers', data),
    bulkImport: (passengers) => api.post('/passengers/bulk-import', { passengers }),
    update: (id, data) => api.put(`/passengers/${id}`, data),
    delete: (id) => api.delete(`/passengers/${id}`),
    getStats: () => api.get('/passengers/stats'),
};

// Hotels API
export const hotelsAPI = {
    getAll: () => api.get('/hotels'),
    create: (data) => api.post('/hotels', data),
    update: (id, data) => api.put(`/hotels/${id}`, data),
    delete: (id) => api.delete(`/hotels/${id}`),
};

// Groups API
export const groupsAPI = {
    getAll: () => api.get('/groups'),
    getById: (id) => api.get(`/groups/${id}`),
    create: (data) => api.post('/groups', data),
    update: (id, data) => api.put(`/groups/${id}`, data),
    delete: (id) => api.delete(`/groups/${id}`),
    getPassengers: (id) => api.get(`/groups/${id}/passengers`),
    assignPassengers: (data) => api.put('/groups/assign-passengers', data),
};

// Error Logs API
export const errorLogsAPI = {
    send: (errorData) => {
        // Use raw axios to avoid interceptor loops
        return axios.post(`${API_URL}/error-logs`, errorData, {
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => { }); // silently fail - don't cause more errors
    },
    getAll: (params = {}) => api.get('/error-logs', { params }),
    toggleResolve: (id) => api.put(`/error-logs/${id}/resolve`),
    clearResolved: () => api.delete('/error-logs/clear'),
};

export default api;
