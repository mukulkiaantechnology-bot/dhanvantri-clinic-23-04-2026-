import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { FiPlus, FiSearch, FiEye, FiCheck, FiEdit, FiTrash2, FiPower, FiLogIn } from 'react-icons/fi';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { API_URL } from '../../config/config';
import './Clinics.css';
const Clinics = () => {
    const { loginAsClinic } = useAuth();
    const { clinics, addClinic, updateClinic, toggleClinicStatus, deleteClinic } = useApp();
    const toast = useToast();
    const { symbol, formatMoney } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [clinicForm, setClinicForm] = useState({
        name: '',
        location: '',
        contact: '',
        email: '',
        password: '',
        subscriptionDuration: 1,
        manualDays: 30,
        subscriptionPlan: 'Monthly',
        subscriptionAmount: 5000,
        gstPercent: 18,
        numberOfUsers: 5
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const filteredClinics = clinics.filter(clinic => clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleLogoFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setLogoPreview(localPreview);
        setLogoFile(file);
        setIsUploading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            setLogoUrl(localPreview);
            setLogoPreview(localPreview);
            setLogoFile(null);
        }
        catch (err) {
            console.warn('Mock upload error, using local file:', err);
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleCreateClinic = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        try {
            const formData = new FormData();
            Object.entries(clinicForm).forEach(([key, value]) => {
                formData.append(key, value.toString());
            });
            if (logoFile) {
                formData.append('logo', logoFile);
            }
            else if (logoUrl) {
                // If we have a Cloudinary URL, send it as text in the 'logo' field
                formData.append('logo', logoUrl);
            }
            if (isEditMode && selectedClinic) {
                await updateClinic(selectedClinic.id, formData);
            }
            else {
                await addClinic(formData);
            }
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsModalOpen(false);
                setIsEditMode(false);
                setSelectedClinic(null);
                setLogoFile(null);
                setLogoUrl(null);
                setLogoPreview(null);
                setClinicForm({
                    name: '',
                    location: '',
                    contact: '',
                    email: '',
                    password: '',
                    subscriptionDuration: 1,
                    manualDays: 30,
                    subscriptionPlan: 'Monthly',
                    subscriptionAmount: 5000,
                    gstPercent: 18,
                    numberOfUsers: 5
                });
            }, 2000);
        }
        catch (error) {
            console.error('Failed to save clinic:', error);
            setErrorMessage(error.message || 'Failed to save clinic. Please try again.');
        }
    };
    const handleEdit = (clinic) => {
        setSelectedClinic(clinic);
        setClinicForm({
            name: clinic.name,
            location: clinic.location,
            contact: clinic.contact,
            email: clinic.email,
            password: '',
            subscriptionDuration: 1,
            manualDays: clinic.subscriptionDays || 30,
            subscriptionPlan: clinic.subscriptionPlan || 'Monthly',
            subscriptionAmount: clinic.subscriptionAmount || 0,
            gstPercent: clinic.gstPercent || 18,
            numberOfUsers: clinic.userLimit || 5
        });
        setLogoFile(null);
        setLogoUrl(null);
        if (clinic.logo) {
            setLogoPreview(getLogoUrl(clinic.logo));
        }
        else {
            setLogoPreview(null);
        }
        setIsEditMode(true);
        setIsModalOpen(true);
    };
    const handleToggleStatus = (clinic) => {
        setConfirmAction({
            type: 'toggle',
            clinic,
            title: `${clinic.status === 'active' ? 'Deactivate' : 'Activate'} Clinic?`,
            message: `Are you sure you want to ${clinic.status === 'active' ? 'deactivate' : 'activate'} "${clinic.name}"? ${clinic.status === 'active' ? 'Users will lose access to this clinic.' : 'Users will regain access to this clinic.'}`,
            variant: clinic.status === 'active' ? 'danger' : 'info'
        });
    };
    const handleDelete = (clinic) => {
        setConfirmAction({
            type: 'delete',
            clinic,
            title: 'Delete Clinic?',
            message: `Are you sure you want to permanently delete "${clinic.name}"? This action cannot be undone and all associated data will be lost.`,
            variant: 'danger'
        });
    };
    const handleConfirm = async () => {
        try {
            if (confirmAction?.type === 'toggle') {
                await toggleClinicStatus(confirmAction.clinic.id);
            }
            else if (confirmAction?.type === 'delete') {
                await deleteClinic(confirmAction.clinic.id);
            }
            setConfirmAction(null);
        }
        catch (error) {
            console.error('Action failed:', error);
            toast.error('Operation failed. Please try again.');
        }
    };
    const handleViewDetails = (clinic) => {
        setSelectedClinic(clinic);
        setIsViewModalOpen(true);
    };
    const handleLoginAsAdmin = async (clinic) => {
        await loginAsClinic(clinic);
    };
    const getLogoUrl = (logoPath) => {
        if (!logoPath || typeof logoPath !== 'string')
            return null;
        if (logoPath.startsWith('http'))
            return logoPath;
        // Try to construct backend URL from config
        const apiUrl = API_URL;
        let backendBase = apiUrl;
        if (apiUrl.includes('/api')) {
            backendBase = apiUrl.split('/api')[0];
        }
        // Clean up double slashes
        const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
        const finalUrl = `${backendBase}${cleanPath}`;
        return finalUrl;
    };
    const handleImageError = (e) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent && !parent.querySelector('.fallback-icon')) {
            const fallback = document.createElement('div');
            fallback.className = 'fallback-icon';
            fallback.innerHTML = '🏢';
            fallback.style.fontSize = '2rem';
            parent.appendChild(fallback);
        }
    };
    const openCreateModal = () => {
        setIsEditMode(false);
        setSelectedClinic(null);
        setClinicForm({
            name: '',
            location: '',
            contact: '',
            email: '',
            password: '',
            subscriptionDuration: 1,
            manualDays: 30,
            subscriptionPlan: 'Trial', // Default to Trial for new registrations
            subscriptionAmount: 0,
            gstPercent: 0,
            numberOfUsers: 5
        });
        setLogoFile(null);
        setLogoUrl(null);
        setLogoPreview(null);
        setIsModalOpen(true);
    };
    return (<div className="clinics-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Facility Management</h1>
                    <p>Register and manage all clinical facilities on the platform.</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={openCreateModal}>
                    <FiPlus />
                    <span>Register New Facility</span>
                </button>
            </div>

            <div className="table-controls card">
                <div className="search-box">
                    <FiSearch />
                    <input type="text" placeholder="Search clinics by name or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
            </div>

            <div className="table-container card table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Facility Name</th>
                            <th>Administrator</th>
                            <th>Location</th>
                            <th>Subscription</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClinics.map((clinic) => (<tr key={clinic.id}>
                                <td>
                                    <div className="clinic-cell">
                                        <div className="clinic-avatar-sm" onClick={() => handleViewDetails(clinic)} style={{ cursor: 'pointer' }}>
                                            {clinic.logo ? (<img src={getLogoUrl(clinic.logo) || ''} alt="" onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}/>) : (<div className="clinic-avatar">
                                                    {clinic.name?.charAt(0) || 'C'}
                                                </div>)}
                                        </div>
                                        <span className="clickable" onClick={() => handleViewDetails(clinic)}>
                                            {clinic.name || 'Unnamed Facility'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="admin-info-cell">
                                        <div className="admin-name">{clinic.adminName || 'Admin'}</div>
                                        <div className="admin-email">{clinic.adminEmail || clinic.email || 'No Email'}</div>
                                    </div>
                                </td>
                                <td>{clinic.location}</td>
                                <td>
                                    <div>{clinic.subscriptionPlan || 'Monthly'}</div>
                                    <div style={{ fontSize: '0.8em', color: clinic.isExpired ? 'red' : 'green' }}>
                                        {clinic.daysRemaining !== undefined ? `${clinic.daysRemaining} days left` : ''}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${clinic.status}`}>
                                        {clinic.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>{clinic.createdDate ? new Date(clinic.createdDate).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn-icon" onClick={() => handleLoginAsAdmin(clinic)} title="Login as Admin">
                                            <FiLogIn style={{ color: '#2563EB' }}/>
                                        </button>

                                        <button className="btn-icon" onClick={() => handleViewDetails(clinic)} title="View Details">
                                            <FiEye />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(clinic)} title="Edit">
                                            <FiEdit />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleToggleStatus(clinic)} title={clinic.status === 'active' ? 'Deactivate' : 'Activate'}>
                                            <FiPower />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(clinic)} title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Facility" : "Register New Facility"}>
                {isSuccess ? (<div className="success-message text-center p-lg">
                        <FiCheck size={48} color="#10B981"/>
                        <h3>Facility {isEditMode ? 'Updated' : 'Registered'}!</h3>
                        <p>The clinic has been {isEditMode ? 'updated' : 'added to the network'}.</p>
                    </div>) : (<form className="modal-form" onSubmit={handleCreateClinic}>
                        {errorMessage && (<div className="alert alert-danger" style={{
                    padding: '0.75rem',
                    background: '#FEE2E2',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    color: '#B91C1C',
                    fontSize: '0.875rem',
                    marginBottom: '1.25rem'
                }}>
                                {errorMessage}
                            </div>)}
                        <div className="clinic-form-group">
                            <label className="clinic-modal-label">Company/Clinic Logo Upload</label>
                            <label htmlFor="logo-file-input" style={{
                border: '2px dashed #E2E8F0',
                padding: logoPreview ? '0' : '1.5rem',
                borderRadius: '12px',
                textAlign: 'center',
                background: '#F8FAFC',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                overflow: 'hidden',
                minHeight: '200px'
            }}>
                                <input id="logo-file-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }} onChange={handleLogoFileChange}/>
                                {isUploading ? (<div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
                                        <strong>Uploading to Cloudinary...</strong>
                                    </div>) : logoPreview ? (<div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#e2e8f0' }}>
                                        <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}/>
                                        <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', padding: '6px' }}>Click to change logo</div>
                                    </div>) : (<>
                                        <div style={{ fontSize: '2rem', color: '#94A3B8' }}>📁</div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                                            <strong>Click here to select Logo</strong>
                                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, JPG, WEBP supported (max 5MB)</p>
                                        </div>
                                    </>)}
                            </label>
                        </div>

                        <div className="clinic-form-group">
                            <label className="clinic-modal-label">Clinic Name</label>
                            <input className="clinic-modal-input" type="text" required value={clinicForm.name} onChange={e => setClinicForm({ ...clinicForm, name: e.target.value })}/>
                        </div>

                        <div className="clinic-form-group">
                            <label className="clinic-modal-label">Location / Address</label>
                            <input className="clinic-modal-input" type="text" required value={clinicForm.location} onChange={e => setClinicForm({ ...clinicForm, location: e.target.value })}/>
                        </div>
                        <div className="clinic-form-row">
                            <div className="clinic-form-group">
                                <label className="clinic-modal-label">Contact Email (Admin Login)</label>
                                <input className="clinic-modal-input" type="email" required value={clinicForm.email} onChange={e => setClinicForm({ ...clinicForm, email: e.target.value })}/>
                            </div>
                            <div className="clinic-form-group">
                                <label className="clinic-modal-label">Contact Number</label>
                                <input className="clinic-modal-input" type="text" required value={clinicForm.contact} onChange={e => setClinicForm({ ...clinicForm, contact: e.target.value })}/>
                            </div>
                        </div>
                        {!isEditMode && (<div className="clinic-form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="clinic-modal-label">Admin Password (For first login)</label>
                                <input className="clinic-modal-input" type="password" required value={clinicForm.password} onChange={e => setClinicForm({ ...clinicForm, password: e.target.value })}/>
                            </div>)}
                        {!isEditMode && (<div className="clinic-form-row">
                                <div className="clinic-form-group">
                                    <label className="clinic-modal-label">Plan Type</label>
                                    <select className="clinic-modal-input" value={clinicForm.subscriptionPlan} onChange={e => {
                    const plan = e.target.value;
                    let amount = clinicForm.subscriptionAmount;
                    if (plan === 'Trial')
                        amount = 0;
                    else if (plan === 'Monthly')
                        amount = 5000 * clinicForm.subscriptionDuration;
                    setClinicForm({ ...clinicForm, subscriptionPlan: plan, subscriptionAmount: amount });
                }}>
                                        <option value="Trial">Trial (7 Days)</option>
                                        <option value="Manual">Manual Option</option>
                                        <option value="Monthly">Select Months (1-12)</option>
                                    </select>
                                </div>
                                {clinicForm.subscriptionPlan === 'Manual' && (<div className="clinic-form-group">
                                        <label className="clinic-modal-label">Manual Days</label>
                                        <input className="clinic-modal-input" type="number" min="1" value={clinicForm.manualDays} onChange={e => setClinicForm({ ...clinicForm, manualDays: Number(e.target.value) })} placeholder="Enter days" required/>
                                    </div>)}
                                <div className="clinic-form-group">
                                    <label className="clinic-modal-label">Number of Users</label>
                                    <input className="clinic-modal-input" type="number" min="1" value={clinicForm.numberOfUsers || 1} onChange={e => setClinicForm({ ...clinicForm, numberOfUsers: Number(e.target.value) })} required/>
                                </div>
                                {clinicForm.subscriptionPlan === 'Monthly' && (<div className="clinic-form-group">
                                        <label className="clinic-modal-label">Duration (Months)</label>
                                        <select className="clinic-modal-input" value={clinicForm.subscriptionDuration} onChange={e => {
                        const duration = Number(e.target.value);
                        setClinicForm({
                            ...clinicForm,
                            subscriptionDuration: duration,
                            subscriptionAmount: 5000 * duration
                        });
                    }}>
                                            {[...Array(12).keys()].map(i => (<option key={i + 1} value={i + 1}>
                                                    {i + 1} Month{i !== 0 && 's'}
                                                </option>))}
                                        </select>
                                    </div>)}
                            </div>)}
                        {!isEditMode && (<div className="clinic-form-row">
                                <div className="clinic-form-group">
                                    <label className="clinic-modal-label">Price Per User ({symbol})</label>
                                    <input className="clinic-modal-input" type="number" value={clinicForm.subscriptionAmount || ''} onChange={e => setClinicForm({ ...clinicForm, subscriptionAmount: e.target.value === '' ? 0 : Number(e.target.value) })} disabled={clinicForm.subscriptionPlan === 'Trial'} placeholder={clinicForm.subscriptionPlan === 'Trial' ? "Free" : "Enter amount"} required/>
                                </div>
                                <div className="clinic-form-group">
                                    <label className="clinic-modal-label">GST / Tax (%)</label>
                                    <input className="clinic-modal-input" type="number" value={clinicForm.gstPercent} onChange={e => setClinicForm({ ...clinicForm, gstPercent: Number(e.target.value) })} disabled={clinicForm.subscriptionPlan === 'Trial'} placeholder="GST %" required/>
                                </div>
                            </div>)}
                        {!isEditMode && clinicForm.subscriptionPlan !== 'Trial' && (<div className="total-preview">
                                <div className="preview-row">
                                    <span>Base Amount:</span>
                                    <span>{formatMoney(clinicForm.subscriptionAmount * (clinicForm.numberOfUsers || 1))}</span>
                                </div>
                                <div className="preview-row">
                                    <span>GST ({clinicForm.gstPercent}%):</span>
                                    <span>{formatMoney((clinicForm.subscriptionAmount * (clinicForm.numberOfUsers || 1)) * clinicForm.gstPercent / 100)}</span>
                                </div>
                                <div className="preview-total">
                                    <span>Total Payable:</span>
                                    <span style={{ color: '#2D3BAE' }}>{formatMoney((clinicForm.subscriptionAmount * (clinicForm.numberOfUsers || 1)) * (1 + clinicForm.gstPercent / 100))}</span>
                                </div>
                            </div>)}
                        {!isEditMode && clinicForm.subscriptionPlan === 'Trial' && (<div className="text-center p-md" style={{ color: '#64748B', fontSize: '0.9rem' }}>
                                <small>Trial period is free of charge ({formatMoney(0)}).</small>
                            </div>)}
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-no-hover">{isEditMode ? 'Update' : 'Add'} Facility</button>
                        </div>
                    </form>)}
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Facility Details">
                {selectedClinic && (<div className="clinic-details">
                        <div className="details-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
                            <div className="details-logo-container" style={{
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden'
            }}>
                                {selectedClinic.logo ? (<img src={getLogoUrl(selectedClinic.logo) || ''} alt="Clinic Logo" onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>) : (<div style={{ fontSize: '2.5rem' }}>🏢</div>)}
                            </div>
                            <div>
                                <h2>{selectedClinic.name}</h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>{selectedClinic.location}</p>
                            </div>
                        </div>

                        <div className="details-grid mt-lg">
                            <div className="detail-item">
                                <label>Location</label>
                                <p>{selectedClinic.location}</p>
                            </div>
                            <div className="detail-item">
                                <label>Contact</label>
                                <p>{selectedClinic.contact}</p>
                            </div>
                            <div className="detail-item">
                                <label>Email</label>
                                <p>{selectedClinic.email}</p>
                            </div>
                            <div className="detail-item">
                                <label>Subscription</label>
                                <p>{selectedClinic.subscriptionPlan} ({selectedClinic.daysRemaining} days left)</p>
                            </div>
                            <div className="detail-item">
                                <label>Status</label>
                                <p><span className={`status-pill ${selectedClinic.status}`}>{selectedClinic.status}</span></p>
                            </div>
                            <div className="detail-item">
                                <label>Created Date</label>
                                <p>{selectedClinic.createdDate ? new Date(selectedClinic.createdDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>)}
            </Modal>

            {/*
        <Modal isOpen={isInsightsOpen} onClose={() => setIsInsightsOpen(false)} title="Clinic Performance Insights">
            {clinicInsights && (
                <div className="clinic-insights">
                    ... (Insights content) ...
                </div>
            )}
        </Modal>
        */}

            <ConfirmModal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleConfirm} title={confirmAction?.title || ''} message={confirmAction?.message || ''} variant={confirmAction?.variant || 'warning'} confirmText={confirmAction?.type === 'delete' ? 'Delete' : 'Confirm'}/>
        </div>);
};
export default Clinics;
