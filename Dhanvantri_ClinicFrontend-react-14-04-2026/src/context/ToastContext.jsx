import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
const ToastContext = createContext(null);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    const showToast = useCallback((type, message, title) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, title, message }]);
    }, []);
    const success = (message, title) => showToast('success', message, title || 'Success');
    const error = (message, title) => showToast('error', message, title || 'Error');
    const warning = (message, title) => showToast('warning', message, title || 'Warning');
    const info = (message, title) => showToast('info', message, title || 'Information');
    return (<ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (<Toast key={toast.id} {...toast} onClose={removeToast}/>))}
            </div>
        </ToastContext.Provider>);
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context)
        throw new Error('useToast must be used within ToastProvider');
    return context;
};
