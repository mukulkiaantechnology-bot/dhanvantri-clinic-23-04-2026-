import api from './api';
export const departmentService = {
    getDepartments: () => api.get('/departments'),
    createDepartment: (data) => api.post('/departments', data),
    deleteDepartment: (id) => api.delete(`/departments/${id}`),
    updateNotificationStatus: (id, status) => api.patch(`/departments/notifications/${id}`, { status }),
    getNotifications: () => api.get('/departments/notifications'),
    getUnreadCount: (department) => api.get('/departments/unread-count', { params: department ? { department } : {} })
};
