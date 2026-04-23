import api from './api';
export const superService = {
    // ==================== DASHBOARD ====================
    getDashboardStats: async () => {
        return api.get('/super/dashboard/stats');
    },
    getSystemAlerts: async () => {
        return api.get('/super/alerts');
    },
    // ==================== CLINICS ====================
    getClinics: async () => {
        return api.get('/super/clinics');
    },
    createClinic: async (data) => {
        return api.post('/super/clinics', data);
    },
    updateClinic: async (id, data) => {
        return api.patch(`/super/clinics/${id}`, data);
    },
    toggleClinicStatus: async (id) => {
        return api.patch(`/super/clinics/${id}/status`);
    },
    deleteClinic: async (id) => {
        return api.delete(`/super/clinics/${id}`);
    },
    updateModules: async (id, modules) => {
        return api.patch(`/super/clinics/${id}/modules`, modules);
    },
    getClinicInsights: async (id) => {
        return api.get(`/super/clinics/${id}/insights`);
    },
    updateSubscription: async (id, data) => {
        return api.patch(`/super/clinics/${id}/subscription`, data);
    },
    // ==================== STAFF ====================
    getStaff: async () => {
        return api.get('/super/staff');
    },
    createClinicAdmin: async (clinicId, userData) => {
        return api.post(`/super/clinics/${clinicId}/admin`, userData);
    },
    updateStaff: async (id, data) => {
        return api.patch(`/super/staff/${id}`, data);
    },
    toggleStaffStatus: async (id) => {
        return api.patch(`/super/staff/${id}/status`);
    },
    deleteStaff: async (id) => {
        return api.delete(`/super/staff/${id}`);
    },
    resetUserPassword: async (userId, password) => {
        return api.post('/super/users/reset-password', { userId, password });
    },
    // ==================== AUDIT LOGS ====================
    getAuditLogs: async (filters) => {
        const params = new URLSearchParams(filters).toString();
        return api.get(`/super/audit-logs?${params}`);
    },
    // ==================== SETTINGS ====================
    getSettings: async () => {
        return api.get('/super/settings');
    },
    updateSecuritySettings: async (data) => {
        return api.patch('/super/settings/security', data);
    },
    getStorageStats: async () => {
        return api.get('/super/system/storage');
    },
    triggerBackup: async () => {
        return api.post('/super/system/backup');
    },
    // ==================== INVOICES & BILLING ====================
    getInvoices: async (filters) => {
        const params = new URLSearchParams(filters).toString();
        return api.get(`/super/invoices?${params}`);
    },
    getReports: async (filters) => {
        const params = new URLSearchParams(filters).toString();
        return api.get(`/super/reports?${params}`);
    },
    updateInvoiceStatus: async (id, status) => {
        return api.patch(`/super/invoices/${id}/status`, { status });
    }
};
