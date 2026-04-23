export const CONFIG = {
    MODE: 'LIVE',
    URLS: {
        LIVE: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
    }
};
export const API_URL = CONFIG.URLS.LIVE;
