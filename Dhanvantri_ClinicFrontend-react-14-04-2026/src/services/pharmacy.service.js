import api from './api';
export const pharmacyService = {
    getInventory: () => api.get('/pharmacy/inventory'),
    getLowStock: (threshold) => api.get('/pharmacy/inventory/low-stock', { params: threshold != null ? { threshold } : {} }),
    addInventory: (data) => api.post('/pharmacy/inventory', data),
    updateInventory: (id, data) => api.patch(`/pharmacy/inventory/${id}`, data),
    deleteInventory: (id) => api.delete(`/pharmacy/inventory/${id}`),
    getOrders: () => api.get('/pharmacy/orders'),
    processOrder: (orderId, items = [], paid = false, amount = 0, source = 'ORDER') => api.post('/pharmacy/orders/process', { orderId, items, paid, amount, source }),
    getPosSales: () => api.get('/pharmacy/pos'),
    directSale: (data) => api.post('/pharmacy/pos', data),
    updatePosSale: (id, data) => api.patch(`/pharmacy/pos/${id}`, data),
    deletePosSale: (id) => api.delete(`/pharmacy/pos/${id}`),
    getNotificationsCount: () => api.get('/pharmacy/notifications'),
    getReports: (date) => api.get('/pharmacy/reports', { params: date ? { date } : {} }),
};
