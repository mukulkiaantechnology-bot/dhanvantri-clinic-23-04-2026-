import api from './api';
export const documentService = {
    getRecords: async (params) => {
        const p = {};
        if (params?.patientId != null)
            p.patientId = params.patientId;
        if (params?.archived)
            p.archived = 'true';
        return api.get('/document-controller/records', { params: p });
    },
    getStaffRecords: async () => {
        return api.get('/document-controller/staff-records');
    },
    getStats: async () => {
        return api.get('/document-controller/stats');
    },
    createRecord: async (data) => {
        return api.post('/document-controller/records', data);
    },
    createStaffRecord: async (data) => {
        return api.post('/document-controller/staff-records', data);
    }
};
