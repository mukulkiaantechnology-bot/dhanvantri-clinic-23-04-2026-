import { API_URL } from '../config/config';

const buildUrl = (url, params) => {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const full = new URL(`${API_URL}${cleanPath}`);
    if (params && typeof params === 'object') {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                full.searchParams.append(key, String(value));
            }
        });
    }
    return full.toString();
};

const parseBody = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
};

const request = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem('ev_token');
    const headers = { ...(config.headers || {}) };
    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (!isFormData && method !== 'GET' && method !== 'DELETE') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const response = await fetch(buildUrl(url, config.params), {
        method,
        headers,
        body: (method === 'GET' || method === 'DELETE')
            ? undefined
            : (isFormData ? data : JSON.stringify(data || {}))
    });

    const payload = await parseBody(response);
    if (!response.ok) {
        const error = new Error(payload?.message || `Request failed (${response.status})`);
        error.response = { data: payload, status: response.status };
        throw error;
    }
    return payload;
};

const api = {
    get: (url, config = {}) => request('GET', url, null, config),
    post: (url, data = {}, config = {}) => request('POST', url, data, config),
    patch: (url, data = {}, config = {}) => request('PATCH', url, data, config),
    put: (url, data = {}, config = {}) => request('PUT', url, data, config),
    delete: (url, config = {}) => request('DELETE', url, null, config)
};

export default api;
