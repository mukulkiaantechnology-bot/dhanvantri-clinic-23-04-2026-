import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiSearch, FiUser, FiEye, FiEdit, FiPower, FiCheck, FiKey, FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import './Staff.css';
import api from '../../services/api';
const Staff = () => {
    const { staff, addStaff, updateStaff, toggleStaffStatus, deleteStaff, clinics, departments } = useApp();
    const { selectedClinic } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    // Get current clinic
    const currentClinic = clinics.find((c) => c.id === selectedClinic?.id) || selectedClinic;
    // Form state
    const [staffForm, setStaffForm] = useState({
        name: '',
        roles: ['DOCTOR'],
        email: '',
        phone: '',
        department: '',
        specialty: '',
        password: '' // Custom temporary password
    });
    // Filter staff belonging to selected clinic
    const allClinicStaff = staff.filter(member => member.clinicId === currentClinic?.id || member.clinics?.includes(currentClinic?.id));
    const hasRole = (member, role) => {
        const target = String(role).toUpperCase();
        const roles = Array.isArray(member.roles) && member.roles.length > 0
            ? member.roles
            : (member.role ? [member.role] : []);
        return roles.map(r => String(r).toUpperCase()).includes(target);
    };
    const clinicStaff = allClinicStaff.filter(member => {
        const roles = member.roles || [member.role] || [];
        const normalizedRoles = roles.map((r) => r.toUpperCase());
        const searchLower = searchTerm.toLowerCase();
        const matchesTab = activeTab === 'all' || normalizedRoles.includes(activeTab.toUpperCase());
        const matchesSearch = member.name.toLowerCase().includes(searchLower) ||
            normalizedRoles.some((r) => r.toLowerCase().includes(searchLower)) ||
            member.email.toLowerCase().includes(searchLower);
        return matchesTab && matchesSearch;
    });
    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            const staffData = {
                ...staffForm,
                role: staffForm.roles[0]?.toUpperCase(),
                roles: staffForm.roles.map(r => r.toUpperCase())
            };
            if (isEditMode && selectedStaff) {
                await updateStaff(selectedStaff.id, staffData);
            }
            else {
                await addStaff({
                    ...staffData,
                    clinicId: currentClinic.id,
                    clinics: [currentClinic.id],
                    password: staffForm.password || 'password123',
                    joined: new Date().toISOString().split('T')[0]
                }, currentClinic.id);
            }
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsModalOpen(false);
                setIsEditMode(false);
                setSelectedStaff(null);
                setStaffForm({ name: '', roles: ['DOCTOR'], email: '', phone: '', department: '', specialty: '', password: '' });
            }, 2000);
        }
        catch (error) {
            console.error('Failed to save staff:', error);
            alert('Failed to save staff member details.');
        }
    };
    const handleEdit = (member) => {
        setSelectedStaff(member);
        setStaffForm({
            name: member.name,
            roles: member.roles || [member.role],
            email: member.email,
            phone: member.phone || '',
            department: member.department || '',
            specialty: member.specialty || '',
            password: '' // Keep password empty on edit
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };
    const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
    const [resetPwdData, setResetPwdData] = useState({ id: '', name: '', password: '' });
    // Existing code...
    const handleResetPassword = (member) => {
        setResetPwdData({
            id: member.userId,
            name: member.name,
            password: ''
        });
        setIsResetPwdModalOpen(true);
    };
    const submitResetPassword = async (e) => {
        e.preventDefault();
        if (!resetPwdData.password)
            return;
        try {
            await api.put(`/clinic/users/${resetPwdData.id}/reset-password`, { password: resetPwdData.password });
            setIsResetPwdModalOpen(false);
            alert(`Password for ${resetPwdData.name} has been reset successfully.`);
        }
        catch (error) {
            console.error('Password reset failed:', error);
            alert('Failed to reset password.');
        }
    };
    const handleToggleStatus = (member) => {
        setConfirmAction({
            member,
            title: `${member.status === 'active' ? 'Deactivate' : 'Activate'} Staff Member?`,
            message: `Are you sure you want to ${member.status === 'active' ? 'deactivate' : 'activate'} ${member.name}?`,
            variant: member.status === 'active' ? 'danger' : 'info'
        });
    };
    const handleConfirm = async () => {
        if (confirmAction?.member) {
            if (confirmAction.action === 'delete') {
                await deleteStaff(confirmAction.member.id);
            }
            else {
                await toggleStaffStatus(confirmAction.member.id);
            }
        }
        setConfirmAction(null);
    };
    const handleDeleteStaff = (member) => {
        setConfirmAction({
            member,
            action: 'delete',
            title: 'Delete Staff Member?',
            message: `Are you sure you want to permanently delete ${member.name}? This action cannot be undone.`,
            variant: 'danger'
        });
    };
    const handleViewDetails = (member) => {
        setSelectedStaff(member);
        setIsViewModalOpen(true);
    };
    const openCreateModal = (presetRole) => {
        setIsEditMode(false);
        setSelectedStaff(null);
        setStaffForm({
            name: '', roles: presetRole ? [presetRole] : ['DOCTOR'], email: '', phone: '', department: '', specialty: '', password: ''
        });
        setIsModalOpen(true);
    };
    const tabs = [
        { id: 'all', label: 'All Staff', count: allClinicStaff.length },
        { id: 'DOCTOR', label: 'Doctors', count: allClinicStaff.filter(s => hasRole(s, 'DOCTOR')).length },
        { id: 'RECEPTIONIST', label: 'Receptionist', count: allClinicStaff.filter(s => hasRole(s, 'RECEPTIONIST')).length },
        { id: 'ACCOUNTANT', label: 'Accountants', count: allClinicStaff.filter(s => hasRole(s, 'ACCOUNTANT') || hasRole(s, 'ACCOUNTING')).length },
        { id: 'LAB', label: 'Lab', count: allClinicStaff.filter(s => hasRole(s, 'LAB') || hasRole(s, 'LABORATORY')).length },
        { id: 'PHARMACY', label: 'Pharmacy', count: allClinicStaff.filter(s => hasRole(s, 'PHARMACY')).length },
        { id: 'RADIOLOGY', label: 'Radiology', count: allClinicStaff.filter(s => hasRole(s, 'RADIOLOGY')).length },
        { id: 'DOCUMENT_CONTROLLER', label: 'Documents', count: allClinicStaff.filter(s => hasRole(s, 'DOCUMENT_CONTROLLER')).length },
    ];
    return (<div className="staff-page">
            <div className="page-header">
                <div>
                    <h1>Staff Management</h1>
                    <p>Add and manage your clinic team members and their roles. <Link to="/clinic-admin/departments" className="text-primary" style={{ fontSize: '0.9rem', textDecoration: 'underline' }}>Manage Departments</Link></p>
                </div>
                <div className="header-actions-staff">
                    <button className="btn btn-primary btn-sm btn-no-hover" onClick={() => openCreateModal()}>
                        <FiPlus /> Add Staff Member
                    </button>
                </div>
            </div>

            {/* Role Tabs */}
            <div className="role-tabs card">
                {tabs.map(tab => (<button key={tab.id} className={`role-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <span>{tab.label}</span>
                        <span className="tab-count">{tab.count}</span>
                    </button>))}
            </div>

            {/* Search and Table */}
            <div className="table-container card">
                <div className="table-controls">
                    <div className="search-box">
                        <FiSearch />
                        <input type="text" placeholder="Search by name, role, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Role</th>
                            <th>Department/Specialty</th>
                            <th>Email Address</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clinicStaff.length > 0 ? clinicStaff.map((member) => (<tr key={member.id}>
                                <td>
                                    <div className="staff-cell">
                                        <div className="staff-avatar">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="clickable" onClick={() => handleViewDetails(member)}>
                                            {member.name || 'Unknown Staff'}
                                        </span>
                                    </div>
                                </td>
                                <td className="capitalize">
                                    {(member.roles || [member.role]).map((r) => (<span key={r} className="role-tag-mini">{r.replace('_', ' ')}</span>))}
                                </td>
                                <td>{member.department || member.specialty || '-'}</td>
                                <td>{member.email}</td>
                                <td>
                                    <span className={`status-pill ${member.status}`}>
                                        {member.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn-icon" title="View Profile" onClick={() => handleViewDetails(member)}>
                                            <FiEye />
                                        </button>
                                        <button className="btn-icon" title="Edit" onClick={() => handleEdit(member)}>
                                            <FiEdit />
                                        </button>
                                        <button className="btn-icon" title="Reset Password" onClick={() => handleResetPassword(member)}>
                                            <FiKey />
                                        </button>
                                        <button className="btn-icon" title={member.status === 'active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(member)}>
                                            <FiPower />
                                        </button>
                                        <button className="btn-icon" title="Delete" style={{ color: '#ef4444' }} onClick={() => handleDeleteStaff(member)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>)) : (<tr>
                                <td colSpan={6} className="empty-state">
                                    <FiUser size={48}/>
                                    <p>No staff found for this filter</p>
                                </td>
                            </tr>)}
                    </tbody>
                </table>
            </div>

            {/* View Details Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Staff Profile">
                {selectedStaff && (<div className="staff-details">
                        <div className="details-header">
                            <div className="staff-avatar-large">
                                {(selectedStaff.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <h2>{selectedStaff.name || 'Unknown Staff'}</h2>
                            <div className="roles-list-display">
                                {(selectedStaff.roles || [selectedStaff.role]).map((r) => (<span key={r} className="role-badge-large">{r.replace('_', ' ')}</span>))}
                            </div>
                            <span className={`status-pill ${selectedStaff.status}`}>
                                {selectedStaff.status}
                            </span>
                        </div>
                        <div className="details-grid mt-lg">
                            <div className="detail-item">
                                <label>Staff ID</label>
                                <p>EMP-{selectedStaff.id}</p>
                            </div>
                            <div className="detail-item">
                                <label>Joining Date</label>
                                <p>{selectedStaff.joined || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                                <label>Phone Number</label>
                                <p>{selectedStaff.phone || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                                <label>Email Address</label>
                                <p>{selectedStaff.email}</p>
                            </div>
                            {selectedStaff.department && (<div className="detail-item">
                                    <label>Department</label>
                                    <p>{selectedStaff.department}</p>
                                </div>)}
                            {selectedStaff.specialty && (<div className="detail-item">
                                    <label>Specialty</label>
                                    <p>{selectedStaff.specialty}</p>
                                </div>)}
                        </div>
                        <div className="modal-actions mt-lg">
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
                            <button className="btn btn-primary btn-no-hover" onClick={() => { setIsViewModalOpen(false); handleEdit(selectedStaff); }}>
                                <FiEdit /> Edit Profile
                            </button>
                        </div>
                    </div>)}
            </Modal>

            {/* Add/Edit Staff Modal - small simple form */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Staff' : 'Add Staff'}>
                {isSuccess ? (<div className="success-message text-center p-lg">
                        <FiCheck size={40} style={{ color: 'var(--success)' }}/>
                        <h3>Staff {isEditMode ? 'Updated' : 'Added'}</h3>
                    </div>) : (<form onSubmit={handleAddStaff} className="staff-form-compact">
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input type="text" placeholder="e.g. Dr. John Doe" required value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Roles * (Select one or more)</label>
                            <div className="roles-checkbox-grid">
                                {[
                { id: 'DOCTOR', label: 'Doctor' },
                { id: 'RECEPTIONIST', label: 'Receptionist' },
                { id: 'PHARMACY', label: 'Pharmacy' },
                { id: 'LAB', label: 'Laboratory' },
                { id: 'RADIOLOGY', label: 'Radiology' },
                { id: 'DOCUMENT_CONTROLLER', label: 'Doc Controller' },
                { id: 'ACCOUNTANT', label: 'Accountant' },
            ].map(role => (<label key={role.id} className="role-check-item">
                                        <input type="checkbox" checked={staffForm.roles.includes(role.id)} onChange={(e) => {
                    const newRoles = e.target.checked
                        ? [...staffForm.roles, role.id]
                        : staffForm.roles.filter(r => r !== role.id);
                    setStaffForm({ ...staffForm, roles: newRoles });
                }}/>
                                        <span>{role.label}</span>
                                    </label>))}
                            </div>
                        </div>
                        {(staffForm.roles.includes('DOCTOR')) && (<div className="form-row-2">
                                <div className="form-group">
                                    <label>Department</label>
                                    <select value={staffForm.department} onChange={e => setStaffForm({ ...staffForm, department: e.target.value })}>
                                        <option value="">Select Department</option>
                                        {(departments || []).map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Specialty</label>
                                    <input type="text" placeholder="e.g. Pediatrics" value={staffForm.specialty} onChange={e => setStaffForm({ ...staffForm, specialty: e.target.value })}/>
                                </div>
                            </div>)}
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" placeholder="staff@clinic.com" required value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Phone *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem' }}>
                                <input type="text" placeholder="+971" required style={{ textAlign: 'center', padding: '0 0.5rem' }} value={staffForm.phone.includes(' ') ? staffForm.phone.split(' ')[0] : '+971'} onChange={e => {
                const currentNumber = staffForm.phone.includes(' ')
                    ? staffForm.phone.split(' ').slice(1).join(' ')
                    : staffForm.phone;
                setStaffForm({ ...staffForm, phone: `${e.target.value} ${currentNumber}` });
            }}/>
                                <input type="text" placeholder="Mobile number" required value={staffForm.phone.includes(' ') ? (staffForm.phone.split(' ')[0] === '+971' && !staffForm.phone.includes(' ') ? staffForm.phone : staffForm.phone.split(' ').slice(1).join(' ')) : staffForm.phone.replace('+971', '').trim()} onChange={e => {
                const currentCode = staffForm.phone.includes(' ')
                    ? staffForm.phone.split(' ')[0]
                    : '+971';
                setStaffForm({ ...staffForm, phone: `${currentCode} ${e.target.value}` });
            }}/>
                            </div>
                        </div>
                        {!isEditMode && (<div className="form-group">
                                <label>Temporary Password *</label>
                                <input type="password" placeholder="••••••••" required minLength={6} value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}/>
                                <p className="form-hint">They will use this for first login. Please share it securely.</p>
                            </div>)}
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-no-hover">{isEditMode ? 'Update' : 'Create Staff'}</button>
                        </div>
                    </form>)}
            </Modal>

            {/* Reset Password Modal */}
            <Modal isOpen={isResetPwdModalOpen} onClose={() => setIsResetPwdModalOpen(false)} title="Reset Password">
                <form onSubmit={submitResetPassword} className="modal-form">
                    <div className="form-group">
                        <label>New Password for <strong>{resetPwdData.name}</strong></label>
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="Enter new password" required className="form-control" value={resetPwdData.password} onChange={e => setResetPwdData({ ...resetPwdData, password: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}/>
                        </div>
                        <p className="form-hint" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Set a temporary password. They can change it after first login.
                        </p>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsResetPwdModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-no-hover">
                            Reset Password
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmModal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleConfirm} title={confirmAction?.title || ''} message={confirmAction?.message || ''} variant={confirmAction?.variant || 'warning'}/>
        </div>);
};
export default Staff;
