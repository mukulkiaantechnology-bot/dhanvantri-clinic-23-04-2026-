import api from './api';
export const billingService = {
    getInvoices: async () => {
        return api.get('/billing/invoices');
    },
    getAccountingDashboardStats: async () => {
        return api.get('/billing/dashboard-stats');
    },
    getPendingItems: async (patientId) => {
        return api.get(`/billing/pending/${patientId}`);
    },
    createInvoice: async (data) => {
        return api.post('/billing', data);
    },
    updateInvoiceStatus: async (id, status, paymentMethod) => {
        return api.patch(`/billing/invoices/${id}`, { status, paymentMethod });
    },
    getCorporatePharmacySummary: async (month) => {
        return api.get('/billing/corporate-pharmacy-summary', { params: { month } });
    }
};
