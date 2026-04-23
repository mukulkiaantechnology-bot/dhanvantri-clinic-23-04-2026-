import React from 'react';
import { FiX } from 'react-icons/fi';
import './Modal.css';
const Modal = ({ isOpen, onClose, title, children, size }) => {
    if (!isOpen)
        return null;
    return (<div className="modal-overlay">
            <div className={`modal-content fade-in-up ${size ? `modal-${size}` : ''}`}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24}/>
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>);
};
export default Modal;
