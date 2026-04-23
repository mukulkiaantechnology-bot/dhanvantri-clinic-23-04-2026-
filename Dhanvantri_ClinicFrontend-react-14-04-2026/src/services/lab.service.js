import api from './api';
export const labService = {
    getOrders: (type = 'LAB', status) => {
        const params = new URLSearchParams({ type });
        if (status)
            params.append('status', status);
        return api.get(`/lab/orders?${params.toString()}`);
    },
    completeOrder: (orderId, result, price, paid = false, extra = {}) => api.post('/lab/orders/complete', { orderId, result, price, paid, ...extra }),
    rejectOrder: (orderId) => api.post('/lab/orders/reject', { orderId }),
    collectSample: (orderId) => api.post('/lab/orders/collect-sample', { orderId }),
};
