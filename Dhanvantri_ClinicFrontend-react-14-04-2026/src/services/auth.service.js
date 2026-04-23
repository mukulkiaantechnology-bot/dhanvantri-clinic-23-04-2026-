import api from './api';
export const authService = {
    login: async (credentials) => {
        return api.post('/auth/login', credentials);
    },
    verifyOTP: async (data) => {
        return api.post('/auth/verify-otp', data);
    },
    getMyClinics: async () => {
        return api.get('/auth/clinics/my');
    },
    selectClinic: async (clinicId, role) => {
        return api.post('/auth/select-clinic', { clinicId, role });
    },
    impersonate: async (userId) => {
        return api.post('/super/impersonate/user', { userId });
    },
    impersonateClinic: async (clinicId) => {
        return api.post('/super/impersonate/clinic', { clinicId });
    },
    changePassword: async (data) => {
        return api.post('/auth/change-password', data);
    }
};
