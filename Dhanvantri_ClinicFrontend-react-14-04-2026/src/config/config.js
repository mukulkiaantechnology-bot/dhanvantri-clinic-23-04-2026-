// export const CONFIG = {
//     MODE: 'LIVE',
//     URLS: {
//         LIVE: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
//     }
// };
// export const API_URL = CONFIG.URLS.LIVE;



export const CONFIG = {
    MODE: 'LIVE',
    URLS: {
        LIVE: (import.meta.env.VITE_API_URL || 'https://dhanwantri-backend-production.up.railway.app/api').replace(/\/$/, '')
    }
};
export const API_URL = CONFIG.URLS.LIVE;
