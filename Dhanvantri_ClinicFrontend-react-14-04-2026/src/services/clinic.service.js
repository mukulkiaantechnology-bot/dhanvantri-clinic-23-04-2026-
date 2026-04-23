import api from './api';
export const clinicService = {
    getStats: async () => {
        return api.get('/clinic/stats');
    },
    getClinicDetails: async () => {
        return api.get('/clinic/details');
    },
    updateClinicDetails: async (data) => {
        return api.patch('/clinic/details', data);
    },
    getStaff: async () => {
        return api.get('/clinic/staff');
    },
    createStaff: async (data) => {
        return api.post('/clinic/staff', data);
    },
    updateStaff: async (id, data) => {
        return api.patch(`/clinic/staff/${id}`, data);
    },
    deleteStaff: async (id) => {
        return api.delete(`/clinic/staff/${id}`);
    },
    getActivities: async () => {
        return api.get('/clinic/activities');
    },
    // Form Templates (New API)
    getFormTemplates: async () => {
        return api.get('/forms/templates');
    },
    createFormTemplate: async (data) => {
        return api.post('/forms/templates', data);
    },
    updateFormTemplate: async (id, data) => {
        return api.patch(`/forms/templates/${id}`, data);
    },
    deleteFormTemplate: async (id) => {
        return api.delete(`/forms/templates/${id}`);
    },
    // Form Responses
    submitResponse: async (data) => {
        return api.post('/forms/responses', data);
    },
    getPatientResponses: async (patientId) => {
        return api.get(`/forms/patient/${patientId}/responses`);
    },
    getResponseById: async (id) => {
        return api.get(`/forms/responses/${id}`);
    },
    // Booking Configuration
    getBookingConfig: async () => {
        return api.get('/clinic/booking-config');
    },
    getDoctorAvailability: async (doctorId) => {
        return api.get(`/clinic/booking-config/doctor/${doctorId}`);
    },
    updateBookingConfig: async (config) => {
        return api.post('/clinic/booking-config', { config });
    },
    // Services CRUD
    getClinicServices: async () => {
        return api.get('/clinic/services');
    },
    createClinicService: async (data) => {
        return api.post('/clinic/services', data);
    },
    updateClinicService: async (id, data) => {
        return api.put(`/clinic/services/${id}`, data);
    },
    deleteClinicService: async (id) => {
        return api.delete(`/clinic/services/${id}`);
    }
};
