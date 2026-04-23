import React, { useEffect } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './ConfirmModal.css';
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'warning' }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        const handleEnter = (e) => {
            if (e.key === 'Enter' && isOpen) {
                e.preventDefault();
                onConfirm();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('keydown', handleEnter);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleEnter);
        };
    }, [isOpen, onClose, onConfirm]);
    if (!isOpen)
        return null;
    return (<div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-content fade-in-up" onClick={(e) => e.stopPropagation()}>
                <button className="confirm-close-btn" onClick={onClose}>
                    <FiX size={24}/>
                </button>

                <div className={`confirm-icon confirm-icon-${variant}`}>
                    <FiAlertTriangle size={48}/>
                </div>

                <h2 className="confirm-title">{title}</h2>
                <p className="confirm-message">{message}</p>

                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'} btn-no-hover`} onClick={() => {
            onConfirm();
            onClose();
        }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>);
};
export default ConfirmModal;
