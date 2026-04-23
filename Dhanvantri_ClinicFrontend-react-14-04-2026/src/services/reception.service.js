import api from './api';
export const receptionService = {
    getPatients: async (search) => {
        return api.get('/reception/patients', { params: { search } });
    },
    registerPatient: async (data) => {
        return api.post('/reception/patients', data);
    },
    updatePatient: async (id, data) => {
        return api.patch(`/reception/patients/${id}`, data);
    },
    getAppointments: async (date, patientId) => {
        return api.get('/reception/appointments', { params: { date, patientId } });
    },
    getPatientAppointments: async (patientId) => {
        return api.get(`/reception/patients/${patientId}/appointments`);
    },
    createAppointment: async (data) => {
        return api.post('/reception/appointments', data);
    },
    updateStatus: async (id, status) => {
        return api.patch(`/reception/appointments/${id}/status`, { status });
    },
    getStats: async () => {
        return api.get('/reception/stats');
    },
    getActivities: async () => {
        return api.get('/reception/activities');
    },
    resetPassword: async (patientId, password) => {
        return api.patch(`/reception/patients/${patientId}/password`, { password });
    },
    checkIn: async (id) => {
        return api.post(`/reception/appointments/${id}/check-in`);
    }
};
