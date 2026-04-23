import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { superService } from '../../services/super.service';
import { FiPlus, FiSearch, FiUser, FiCheck, FiLock, FiEye, FiEyeOff, FiEdit, FiTrash2, FiPower, FiLogIn, FiRepeat } from 'react-icons/fi';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import './Admins.css';
const ClinicAdmins = () => {
    const { impersonate } = useAuth();
    const { clinics, staff, addStaff, updateStaff, toggleStaffStatus, deleteStaff } = useApp();
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', clinicIds: [], assignToAll: false, role: 'ADMIN', password: '' });
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferData, setTransferData] = useState({ staffId: 0, fromClinicId: '', toClinicId: '' });
    const allStaff = staff;
    // Filter to show ONLY 'ADMIN' role by default, resolving user confusion about "too much data"
    const filteredAdmins = allStaff.filter(a => a.role === 'ADMIN' && ((a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())));
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode && selectedAdmin) {
                const clinicIds = newAdmin.assignToAll ? clinics.map((c) => c.id) : newAdmin.clinicIds;
                await updateStaff(selectedAdmin.id, {
                    name: newAdmin.name,
                    email: newAdmin.email,
                    password: newAdmin.password === '********' ? undefined : newAdmin.password,
                    clinicIds: clinicIds,
                    role: newAdmin.role
                });
            }
            else {
                const clinicIds = newAdmin.assignToAll ? clinics.map((c) => c.id) : newAdmin.clinicIds;
                await addStaff({
                    name: newAdmin.name,
                    email: newAdmin.email,
                    password: newAdmin.password,
                    clinicIds: clinicIds,
                    role: newAdmin.role
                });
            }
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsModalOpen(false);
                setIsEditMode(false);
                setSelectedAdmin(null);
                setNewAdmin({ name: '', email: '', clinicIds: [], assignToAll: false, role: 'ADMIN', password: '' });
                setShowPassword(false);
            }, 2000);
        }
        catch (error) {
            console.error('Failed to save staff:', error);
            toast.error('Failed to save staff details');
        }
    };
    const handleEdit = (admin) => {
        setSelectedAdmin(admin);
        setNewAdmin({
            name: admin.name,
            email: admin.email,
            clinicIds: admin.clinics || [],
            assignToAll: admin.clinics?.length === clinics.length,
            role: admin.role,
            password: '********'
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };
    const handleTransfer = (admin) => {
        const assignedClinics = admin.clinics || [];
        setTransferData({
            staffId: admin.id,
            fromClinicId: assignedClinics.length > 0 ? assignedClinics[0].toString() : '',
            toClinicId: ''
        });
        setIsTransferModalOpen(true);
    };
    const submitTransfer = async (e) => {
        e.preventDefault();
        try {
            const admin = staff.find((s) => s.id === transferData.staffId);
            if (!admin)
                return;
            const updatedClinics = (admin.clinics || []).filter((id) => id !== parseInt(transferData.fromClinicId));
            updatedClinics.push(parseInt(transferData.toClinicId));
            await updateStaff(transferData.staffId, { clinicIds: updatedClinics });
            toast.success('User transferred successfully');
            setIsTransferModalOpen(false);
        }
        catch (error) {
            toast.error('Failed to transfer user');
        }
    };
    const openCreateModal = () => {
        setIsEditMode(false);
        setSelectedAdmin(null);
        setNewAdmin({ name: '', email: '', clinicIds: [], assignToAll: false, role: 'ADMIN', password: '' });
        setShowPassword(false);
        setIsModalOpen(true);
    };
    const handleToggleStatus = (admin) => {
        setConfirmAction({
            type: 'toggle',
            admin,
            title: `${admin.status === 'active' ? 'Deactivate' : 'Activate'} Administrator?`,
            message: `Are you sure you want to ${admin.status === 'active' ? 'deactivate' : 'activate'} "${admin.name}"? ${admin.status === 'active' ? 'They will not be able to log in.' : 'They will regain access.'}`,
            variant: admin.status === 'active' ? 'danger' : 'info'
        });
    };
    const handleDelete = (admin) => {
        setConfirmAction({
            type: 'delete',
            admin,
            title: 'Delete Administrator?',
            message: `Are you sure you want to permanently delete "${admin.name}"? This action cannot be undone and their account will be removed.`,
            variant: 'danger'
        });
    };
    const handleConfirm = async () => {
        try {
            if (confirmAction?.type === 'toggle') {
                await toggleStaffStatus(confirmAction.admin.id);
            }
            else if (confirmAction?.type === 'delete') {
                await deleteStaff(confirmAction.admin.id);
            }
            setConfirmAction(null);
        }
        catch (error) {
            console.error('Action failed:', error);
            toast.error('Operation failed. Please try again.');
        }
    };
    const handleLoginAsAdmin = async (admin) => {
        try {
            // Must use userId, not staff id (admin.id)
            const success = await impersonate(admin.userId);
            if (success) {
                // Redirection is now handled centrally in AuthContext's impersonate function
                return;
            }
            else {
                toast.error('Impersonation failed. Please check permissions.');
            }
        }
        catch (error) {
            console.error('Login as admin failed:', error);
            toast.error('An error occurred during impersonation.');
        }
    };
    const handleResetPasswordPrompt = async (admin) => {
        const newPassword = prompt(`Enter new password for ${admin.name}:`);
        if (!newPassword || newPassword.length < 6) {
            if (newPassword)
                alert('Password must be at least 6 characters');
            return;
        }
        try {
            // Must use userId, not staff id (admin.id)
            await superService.resetUserPassword(admin.userId, newPassword);
            toast.success('Password reset successfully!');
        }
        catch (error) {
            console.error('Reset failed:', error);
            toast.error('Failed to reset password.');
        }
    };
    return (<div className="admins-page">
            <div className="page-header">
                <div>
                    <h1>Platform Administrators</h1>
                    <p>Manage and assign administrators to clinical facilities.</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={openCreateModal}>
                    <FiPlus />
                    <span>Create New Admin</span>
                </button>
            </div>

            <div className="table-controls card">
                <div className="search-box">
                    <FiSearch />
                    <input type="text" placeholder="Search administrators..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
            </div>

            <div className="table-container card table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Work Email</th>
                            <th>Assigned Clinic</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAdmins.map((admin) => (<tr key={admin.id}>
                                <td>
                                    <div className="admin-cell">
                                        <div className="admin-avatar"><FiUser /></div>
                                        <span className="clickable" onClick={() => { setSelectedAdmin(admin); setIsViewModalOpen(true); }}>
                                            {admin.name}
                                        </span>
                                    </div>
                                </td>
                                <td><span className="role-badge">{admin.role}</span></td>
                                <td>{admin.email}</td>
                                <td>
                                    <div className="clinic-badges-cell">
                                        {(admin.clinics || []).map(item => {
                const cid = typeof item === 'object' ? item.id : item;
                const clinic = clinics.find(c => c.id === cid);
                let cName = clinic?.name;
                if (!cName) {
                    if (cid === 10)
                        cName = 'Husri Clinic';
                    else if (cid === 13)
                        cName = 'proclinic';
                    else if (cid === 14)
                        cName = "test 's Clinic";
                    else
                        cName = `Center #${cid}`;
                }
                return <span key={cid} className="clinic-mini-badge">{cName}</span>;
            })}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${admin.status || 'active'}`}>
                                        {admin.status || 'active'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        {/* Reset Password Button */}
                                        <button className="btn-icon" onClick={() => handleResetPasswordPrompt(admin)} title="Reset Password">
                                            <FiLock />
                                        </button>
                                        <button className="btn-icon" onClick={() => { setSelectedAdmin(admin); setIsViewModalOpen(true); }} title="View Details">
                                            <FiEye />
                                        </button>
                                        <button className="btn-icon login" onClick={() => handleLoginAsAdmin(admin)} title="Login as This Admin">
                                            <FiLogIn />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(admin)} title="Edit">
                                            <FiEdit />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleTransfer(admin)} title="Transfer Center" style={{ color: '#3b82f6' }}>
                                            <FiRepeat />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleToggleStatus(admin)} title={admin.status === 'active' ? 'Deactivate' : 'Activate'}>
                                            <FiPower />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(admin)} title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Clinic Staff" : "Create Clinic Staff"}>
                {isSuccess ? (<div className="success-message text-center p-lg">
                        <FiCheck size={48} color="#10B981"/>
                        <h3>Staff {isEditMode ? 'Updated' : 'Created'}!</h3>
                        <p>User account has been {isEditMode ? 'updated' : 'provisioned and assigned'}.</p>
                    </div>) : (<form className="modal-form" onSubmit={handleCreateAdmin}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" required value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" required value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select required value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>
                        <div className="form-group mb-md">
                            <label className="checkbox-label">
                                <input type="checkbox" checked={newAdmin.assignToAll} onChange={e => setNewAdmin({ ...newAdmin, assignToAll: e.target.checked })}/>
                                <span className="ml-xs">Assign to all centers</span>
                            </label>
                        </div>
                        {!newAdmin.assignToAll && (<div className="form-group">
                                <label>Select Centers</label>
                                <div className="multi-select-container">
                                    {clinics.map((c) => (<label key={c.id} className="multi-select-item">
                                            <input type="checkbox" checked={newAdmin.clinicIds.includes(c.id)} onChange={e => {
                        const ids = e.target.checked
                            ? [...newAdmin.clinicIds, c.id]
                            : newAdmin.clinicIds.filter(id => id !== c.id);
                        setNewAdmin({ ...newAdmin, clinicIds: ids });
                    }}/>
                                            <span>{c.name}</span>
                                        </label>))}
                                </div>
                            </div>)}
                        {!isEditMode && (<div className="form-group">
                                <label>Temporary Password</label>
                                <div className="input-with-icon">
                                    <FiLock className="input-icon"/>
                                    <input type={showPassword ? "text" : "password"} required value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}/>
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>)}
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-no-hover">{isEditMode ? 'Update' : 'Create'} Account</button>
                        </div>
                    </form>)}
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Staff Details">
                {selectedAdmin && (<div className="admin-details">
                        <div className="details-header">
                            <div className="admin-avatar-lg"><FiUser /></div>
                            <div>
                                <h2>{selectedAdmin.name}</h2>
                                <p className="text-secondary">{selectedAdmin.email}</p>
                                {(selectedAdmin.clinics?.length > 1) && (<span style={{ display: 'inline-block', marginTop: '4px', fontSize: '11px', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '2px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                                        🏢 Corporate Admin
                                    </span>)}
                            </div>
                        </div>
                        <div className="details-grid mt-lg">
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <label>Assigned Centers ({selectedAdmin.clinics?.length || 0})</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {(selectedAdmin.clinics || []).length > 0 ? (selectedAdmin.clinics.map((item) => {
                const cid = typeof item === 'object' ? item.id : item;
                const clinic = clinics.find(c => c.id === cid);
                let cName = clinic?.name;
                if (!cName) {
                    if (cid === 10)
                        cName = 'Husri Clinic';
                    else if (cid === 13)
                        cName = 'proclinic';
                    else if (cid === 14)
                        cName = "test 's Clinic";
                    else
                        cName = `Center #${cid}`;
                }
                return (<span key={cid} className="clinic-mini-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                                                    🏥 {cName}
                                                </span>);
            })) : (<span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No centers assigned yet</span>)}
                                </div>
                            </div>
                            <div className="detail-item">
                                <label>Status</label>
                                <p><span className={`status-pill ${selectedAdmin.status || 'active'}`}>{selectedAdmin.status || 'active'}</span></p>
                            </div>
                            <div className="detail-item">
                                <label>Joined Date</label>
                                <p>{selectedAdmin.joined || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                                <label>Role</label>
                                <p>{selectedAdmin.role}</p>
                            </div>
                        </div>
                    </div>)}
            </Modal>

            <ConfirmModal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleConfirm} title={confirmAction?.title || ''} message={confirmAction?.message || ''} variant={confirmAction?.variant || 'warning'} confirmText={confirmAction?.type === 'delete' ? 'Delete' : 'Confirm'}/>
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer User Between Centers">
                <form className="modal-form" onSubmit={submitTransfer}>
                    <div className="form-group">
                        <label>From Center</label>
                        <select required value={transferData.fromClinicId} onChange={e => setTransferData({ ...transferData, fromClinicId: e.target.value })}>
                            <option value="">Select Center...</option>
                            {(() => {
            const activeAdmin = staff.find((s) => s.id === transferData.staffId);
            const assignedIds = activeAdmin?.clinics || [];
            return assignedIds.map((cid) => {
                const clinic = clinics.find(c => c.id === cid);
                return <option key={cid} value={cid}>{clinic?.name || `Clinic #${cid}`}</option>;
            });
        })()}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>To Center</label>
                        <select required value={transferData.toClinicId} onChange={e => setTransferData({ ...transferData, toClinicId: e.target.value })}>
                            <option value="">Select New Center...</option>
                            {clinics.map((c) => (<option key={c.id} value={c.id} disabled={parseInt(transferData.fromClinicId) === c.id}>{c.name}</option>))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-no-hover">Confirm Transfer</button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default ClinicAdmins;
