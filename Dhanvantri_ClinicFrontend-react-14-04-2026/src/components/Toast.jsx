import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import './Toast.css';
const Toast = ({ id, type, title, message, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, []);
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300);
    };
    const getIcon = () => {
        switch (type) {
            case 'success': return <FiCheckCircle />;
            case 'error': return <FiXCircle />;
            case 'warning': return <FiAlertTriangle />;
            case 'info': return <FiInfo />;
        }
    };
    return (<div className={`toast ${type} ${isExiting ? 'toast-exit' : ''}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                {title && <div className="toast-title">{title}</div>}
                <div className="toast-message">{message}</div>
            </div>
            <button className="toast-close" onClick={handleClose}>
                <FiX />
            </button>
        </div>);
};
export default Toast;
