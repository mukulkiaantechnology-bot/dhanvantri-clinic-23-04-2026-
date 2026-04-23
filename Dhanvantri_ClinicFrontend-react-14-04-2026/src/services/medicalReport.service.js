import api from './api';
export const medicalReportService = {
    async createReport(data) {
        return api.post('/medical-reports', data);
    },
    async getReports() {
        return api.get('/medical-reports');
    },
    async getTemplates() {
        return api.get('/medical-reports/templates');
    },
    async getReportById(id) {
        return api.get(`/medical-reports/${id}`);
    },
    async updateReport(id, data) {
        return api.patch(`/medical-reports/${id}`, data);
    }
};
