import api from './api';
export const dashboardService = {
    getStats: async (role) => {
        // ─── DEMO INTERCEPTOR ────────────────────────────────────────────────
        try {
            const user = JSON.parse(localStorage.getItem('ev_user') || '{}');
            const clinic = JSON.parse(localStorage.getItem('ev_clinic') || '{}');
            if (user.isMockUser && [10, 13, 14].includes(Number(clinic.id))) {
                const { MOCK_STATS } = await import('../data/mockDatabase');
                const stats = MOCK_STATS[Number(clinic.id)];
                if (stats) {
                    // Map mock keys to service expected keys
                    return {
                        success: true,
                        data: {
                            totalAppointments: stats.totalBookings,
                            todayAppointments: stats.todayAppointments,
                            todayRevenue: stats.todayRevenue,
                            pendingBills: stats.pendingBills,
                            totalStaff: stats.staffCount,
                            utilization: 85,
                            growth: 12,
                            systemStatus: 'Healthy'
                        }
                    };
                }
            }
        }
        catch (e) { /* ignore */ }
        // ─────────────────────────────────────────────────────────────────────
        const response = await api.get('/dashboard/stats', {
            params: role ? { role } : {}
        });
        return response.data;
    },
    getMenu: async (role) => {
        const response = await api.get(`/menu/${role}`);
        return response.data;
    },
    getCurrentMenu: async () => {
        const response = await api.get('/menu');
        return response.data;
    }
};
