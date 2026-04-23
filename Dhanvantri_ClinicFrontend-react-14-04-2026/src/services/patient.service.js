import api from './api';
export const patientService = {
    getMyAppointments: () => api.get('/patient/appointments'),
    cancelAppointment: (appointmentId) => api.delete(`/patient/appointments/${appointmentId}`),
    getMyMedicalRecords: () => api.get('/patient/records'),
    getMyInvoices: () => api.get('/patient/invoices'),
    getMyActivity: () => api.get('/patient/activity'),
    getMyClinics: () => api.get('/patient/clinics'),
    getPublicClinics: () => api.get('/patient/public-clinics'),
    publicBookAppointment: (data) => api.post('/patient/public-book', data),
    bookAppointment: (data) => api.post('/patient/book', data),
    getClinicDoctors: (clinicId) => api.get(`/patient/doctors/${clinicId}`),
    getClinicBookingDetails: (clinicId) => api.get(`/patient/booking-details/${clinicId}`),
    // New Public Booking System
    getPublicClinic: (subdomain) => api.get(`/public/clinic/${subdomain}`),
    getPublicDoctors: (clinicId) => api.get(`/public/clinic/${clinicId}/doctors`),
    getPublicAvailability: (doctorId, date) => api.get(`/public/doctor/${doctorId}/availability?date=${date}`),
    submitPublicBooking: (data) => api.post('/public/book', data),
    getMyDocuments: () => api.get('/patient/documents'),
    deleteMyDocument: (documentId, table) => api.delete(`/patient/documents/${documentId}${table ? `?table=${table}` : ''}`),
    uploadDocument: (clinicId, patientId, data) => api.post(`/patient/clinics/${clinicId}/patients/${patientId}/documents`, data),
    getMyReports: () => api.get('/medical-reports'),
};
