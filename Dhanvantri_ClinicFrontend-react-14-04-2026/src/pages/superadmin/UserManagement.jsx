import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiCheckCircle, FiXCircle, FiFileText } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import './Invoices.css';
const UserManagement = () => {
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const fetchRegistrations = async () => {
        try {
            const token = localStorage.getItem('ev_token');
            const res = await api.get('/super/registrations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res?.success) {
                setRegistrations(res.data);
            }
        }
        catch (error) {
            console.error('Error fetching registrations:', error);
            showToast('Failed to fetch registrations', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchRegistrations();
    }, []);
    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this registration and create a clinic?'))
            return;
        try {
            const token = localStorage.getItem('ev_token');
            await api.post(`/super/registrations/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Registration approved successfully', 'success');
            fetchRegistrations();
        }
        catch (error) {
            console.error('Approve error:', error);
            showToast(error.response?.data?.message || 'Failed to approve', 'error');
        }
    };
    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this registration?'))
            return;
        try {
            const token = localStorage.getItem('ev_token');
            await api.post(`/super/registrations/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Registration rejected', 'success');
            fetchRegistrations();
        }
        catch (error) {
            console.error('Reject error:', error);
            showToast('Failed to reject', 'error');
        }
    };
    if (isLoading)
        return (<div className="invoices-page fade-in">
            <div className="loading-state">
                <div className="loader"></div>
                <p>Loading registrations...</p>
            </div>
        </div>);
    return (<div className="invoices-page fade-in">
            <div className="page-header">
                <div>
                    <h2>Registration Requests</h2>
                    <p>Review and manage incoming clinical facility sign-ups</p>
                </div>
            </div>

            <div className="table-container mt-lg">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Clinic / User Details</th>
                            <th>Contact Info</th>
                            <th>Subscription Plan</th>
                            <th>Date Requested</th>
                            <th>Current Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length === 0 ? (<tr>
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <FiFileText size={48}/>
                                        <p>No registration requests found at the moment.</p>
                                    </div>
                                </td>
                            </tr>) : (registrations.map(req => (<tr key={req.id}>
                                    <td>
                                        <div className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{req.firstName} {req.lastName}</div>
                                        <div className="text-xs text-muted mt-xs">{req.address || 'No address provided'}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-semibold">{req.email}</div>
                                    </td>
                                    <td>
                                        {req.plan ? (<span className="status-pill paid" style={{ fontSize: '0.7rem', padding: '0.35rem 0.8rem' }}>
                                                {req.plan.name}
                                            </span>) : (<span className="text-muted text-sm border px-2 py-1 rounded">N/A</span>)}
                                    </td>
                                    <td>
                                        <div className="text-sm font-semibold">{new Date(req.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${req.status === 'APPROVED' ? 'paid' : req.status === 'REJECTED' ? 'unpaid' : ''}`} style={req.status === 'PENDING' ? { background: '#FEF3C7', color: '#92400E' } : {}}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>
                                        {req.status === 'PENDING' ? (<div className="action-btns">
                                                <button className="action-btn-mini btn-mark-paid" title="Approve & Create Clinic" onClick={() => handleApprove(req.id)}>
                                                    <FiCheckCircle />
                                                </button>
                                                <button className="action-btn-mini btn-mark-unpaid" title="Reject Request" onClick={() => handleReject(req.id)}>
                                                    <FiXCircle />
                                                </button>
                                            </div>) : (<div className="text-center text-muted text-xs font-bold" style={{ letterSpacing: '0.1em' }}>PROCESSED</div>)}
                                    </td>
                                </tr>)))}
                    </tbody>
                </table>
            </div>
        </div>);
};
export default UserManagement;
