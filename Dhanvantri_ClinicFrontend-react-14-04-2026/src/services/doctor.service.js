import api from './api';
export const doctorService = {
    getQueue: async () => {
        return api.get('/doctor/queue');
    },
    getHistory: async (patientId) => {
        return api.get(`/doctor/history/${patientId}`);
    },
    getPatientProfile: async (patientId) => {
        return api.get(`/doctor/patients/${patientId}/profile`);
    },
    getStats: async () => {
        return api.get('/doctor/stats');
    },
    getActivities: async () => {
        return api.get('/doctor/activities');
    },
    // Form Templates
    getTemplates: async () => {
        return api.get('/doctor/templates');
    },
    getTemplateById: async (id) => {
        return api.get(`/forms/templates/${id}`);
    },
    // Assessment Submission - Use dedicated doctor endpoint for workflow integration
    submitAssessment: async (data) => {
        return api.post('/doctor/assessments', data);
    },
    getAllAssessments: async () => {
        return api.get('/doctor/assessments');
    },
    getPatients: async () => {
        return api.get('/doctor/patients');
    },
    getOrders: async () => {
        return api.get('/doctor/orders');
    },
    createOrder: async (data) => {
        return api.post('/doctor/orders', data);
    },
    getPrescriptionInventory: async () => {
        return api.get('/doctor/prescription-inventory');
    },
    getRevenue: async () => {
        return api.get('/doctor/revenue');
    },
    uploadPatientDocument: async (patientId, data) => {
        return api.post('/patient/documents', { ...data, patientId });
    }
};
