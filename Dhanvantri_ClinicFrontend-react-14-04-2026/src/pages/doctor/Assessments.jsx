import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiPlus, FiEye, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { doctorService } from '../../services/doctor.service';
import { pharmacyService } from '../../services/pharmacy.service';
import { clinicService } from '../../services/clinic.service';
import Modal from '../../components/Modal';
import PatientProfileModal from '../../components/PatientProfileModal';
import { FiFolder } from 'react-icons/fi';
import { API_URL } from '../../config/config';
import './Dashboard.css';
import './Assessments.css';
const Assessments = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, selectedClinic } = useAuth();
    const { patients, staff, formTemplates, bookings, refreshData } = useApp();
    console.log("bookings", bookings);
    console.log(patients);
    useEffect(() => {
        if (refreshData)
            refreshData();
    }, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false);
    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedPatientForProfile, setSelectedPatientForProfile] = useState(null);
    const openProfile = (patientId, patientName) => {
        setSelectedPatientForProfile({ id: patientId, name: patientName });
        setIsProfileOpen(true);
    };
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    // Selection state
    const [selectedPatientId, setSelectedPatientId] = useState(() => {
        const state = location.state;
        return state?.patientId ? state.patientId.toString() : '';
    });
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [viewedAssessment, setViewedAssessment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    // Orders state
    const [orders, setOrders] = useState([]);
    // Clinic Services (Lab, Radiology, etc) State
    const [clinicServices, setClinicServices] = useState([]);
    // Inventory State
    const [pharmacyInventory, setPharmacyInventory] = useState([]);
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await clinicService.getClinicServices();
                const items = Array.isArray(res.data) ? res.data : (res.data?.data && Array.isArray(res.data.data) ? res.data.data : []);
                setClinicServices(items);
            }
            catch (e) {
                console.error("Failed to load clinic services", e);
            }
        };
        fetchServices();
    }, []);
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await pharmacyService.getInventory();
                console.log("Pharmacy Inventory Response:", res);
                const items = Array.isArray(res) ? res : (res.data || []);
                setPharmacyInventory(items);
            }
            catch (err) {
                console.error("Failed to load pharmacy inventory", err);
            }
        };
        fetchInventory();
    }, []);
    // Order Management Helpers
    const addOrder = () => {
        setOrders([...orders, { type: 'LAB', testName: '', details: '', inventoryId: null, quantity: 1, stock: 0, unitPrice: 0 }]);
    };
    const updateOrder = (index, field, value) => {
        const updated = [...orders];
        updated[index] = { ...updated[index], [field]: value };
        setOrders(updated);
    };
    const removeOrder = (index) => {
        setOrders(orders.filter((_, i) => i !== index));
    };
    const currentDocDetails = staff?.find((s) => s.userId === user?.id);
    const docSpecialty = currentDocDetails?.specialty;
    const clinicTemplates = (formTemplates || []).filter((t) => {
        // 1. If explicitly assigned to this doctor
        if (t.doctorId && t.doctorId === user?.id)
            return true;
        // 2. If assigned to this doctor's specialty (and not assigned to another specific doctor)
        if (docSpecialty && t.specialty === docSpecialty && !t.doctorId)
            return true;
        // 3. Fallback: Show global/general forms that aren't doctor-specific
        if (!t.doctorId && (t.specialty === 'General' || !t.specialty))
            return true;
        return false;
    });
    const finalTemplates = clinicTemplates.length > 0 ? clinicTemplates : (formTemplates || []);
    // STRICT CLIENT RULE: Filter ONLY checked-in patients
    const checkedInPatients = useMemo(() => {
        const validPatients = (bookings || [])
            .filter((b) => String(b.status || '').toLowerCase() === 'checked in')
            .map((b) => {
            if (b.patient)
                return b.patient;
            if (b.patientId)
                return (patients || []).find((p) => Number(p.id) === Number(b.patientId));
            if (b.patientName) {
                const linked = (patients || []).find((p) => String(p.name || '').toLowerCase() === String(b.patientName || '').toLowerCase());
                if (linked)
                    return linked;
                return {
                    id: Number(b.id) * -1 || Date.now() * -1,
                    name: b.patientName,
                    phone: b.phone || '',
                    email: b.email || ''
                };
            }
            return null;
        })
            .filter((p) => !!p);
        // De-duplicate patients by ID
        return Array.from(new Map(validPatients.map((p) => [p.id, p])).values());
    }, [bookings, patients]);
    // Validation for the currently selected patient
    const isSelectedPatientValid = useMemo(() => {
        if (!selectedPatientId)
            return false;
        return checkedInPatients.some((p) => p.id === Number(selectedPatientId));
    }, [selectedPatientId, checkedInPatients]);
    const fetchAssessments = async (patientId) => {
        setLoading(true);
        try {
            if (patientId) {
                // Fetch specific patient's assessments
                const res = await doctorService.getHistory(patientId);
                setAssessments(res.data || []);
            }
            else {
                // Fetch all assessments for the doctor
                const res = await doctorService.getAllAssessments();
                setAssessments(res.data || []);
            }
        }
        catch (error) {
            console.error('Failed to fetch assessments:', error);
            setAssessments([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Handle incoming state openNew flag
        const state = location.state;
        if (state?.openNew) {
            setIsNewAssessmentOpen(true);
        }
    }, [location.state]);
    useEffect(() => {
        // Fetch assessments on component mount and when patient selection changes
        if (selectedPatientId) {
            fetchAssessments(Number(selectedPatientId));
        }
        else {
            fetchAssessments(); // Fetch all when no patient selected
        }
    }, [selectedPatientId]);
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [queue, setQueue] = useState([]);
    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const res = await doctorService.getQueue();
                setQueue(res.data || []);
            }
            catch (e) {
                console.error("Failed to fetch queue", e);
            }
        };
        fetchQueue();
    }, []);
    useEffect(() => {
        if (selectedPatientId && queue.length > 0) {
            const appt = queue.find(q => q.patientId === Number(selectedPatientId) && (q.status === 'Checked In' || q.status === 'Approved' || q.status === 'Confirmed'));
            setCurrentAppointment(appt);
            // If navigating from Dashboard with state, it might have notes too.
            const state = location.state;
            if (state?.notes && !appt) {
                // Fallback if queue fetch hasn't updated or completed yet
                setCurrentAppointment({ notes: state.notes });
            }
        }
        else {
            setCurrentAppointment(null);
        }
    }, [selectedPatientId, queue]);
    const handlePrintAssessment = () => {
        if (!viewedAssessment)
            return;
        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (!printWindow)
            return;
        // Parse data
        let recordData = {};
        try {
            const rawData = viewedAssessment.data || viewedAssessment.answers;
            recordData = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData || {});
        }
        catch (e) {
            console.error(e);
        }
        const orders = recordData.ordersSnapshot || [];
        const displayKeys = Object.keys(recordData).filter(k => k !== 'ordersSnapshot' && k !== 'templateId' && k !== 'patientId');
        // Generate findings HTML
        const findingsHtml = displayKeys.map(key => {
            let label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
            // Try to resolve label from template
            if (viewedAssessment.formtemplate?.fields) {
                const fields = typeof viewedAssessment.formtemplate.fields === 'string'
                    ? JSON.parse(viewedAssessment.formtemplate.fields)
                    : viewedAssessment.formtemplate.fields;
                const fieldDef = fields.find((f) => f.id === key);
                if (fieldDef)
                    label = fieldDef.label.toUpperCase();
            }
            const value = recordData[key];
            if (!value || (Array.isArray(value) && value.length === 0))
                return '';
            return `
                <div class="finding-item">
                    <div class="finding-label">${label}</div>
                    <div class="finding-value">${Array.isArray(value) ? value.join(', ') : String(value)}</div>
                </div>
            `;
        }).join('');
        // Generate orders HTML
        const ordersHtml = orders.length > 0 ? `
            <div class="section-title">Prescriptions & Orders</div>
            <table class="orders-table">
                <thead>
                    <tr>
                        <th width="20%">Type</th>
                        <th width="40%">Item / Test</th>
                        <th width="40%">Instructions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map((o) => `
                        <tr>
                            <td>${o.type}</td>
                            <td><strong>${o.testName}</strong></td>
                            <td>${o.details || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '';
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Clinical Assessment Report</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 900px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
                    .brand h1 { margin: 0; color: #1e293b; font-size: 24px; }
                    .brand p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
                    .meta { text-align: right; font-size: 14px; color: #64748b; }
                    
                    .patient-banner { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .patient-info h2 { margin: 0 0 5px 0; font-size: 20px; }
                    .patient-info p { margin: 0; color: #64748b; }
                    .visit-type { background: #e0e7ff; color: #4338ca; padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; height: fit-content; }

                    .content-section { margin-bottom: 30px; }
                    .section-title { font-size: 16px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
                    
                    .findings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                    .finding-item { margin-bottom: 15px; }
                    .finding-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px; }
                    .finding-value { font-size: 15px; color: #0f172a; line-height: 1.5; }

                    .orders-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .orders-table th { background: #f8fafc; text-align: left; padding: 10px; font-size: 12px; color: #64748b; border: 1px solid #e2e8f0; }
                    .orders-table td { padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; }

                    .footer { margin-top: 50px; display: flex; justify-content: space-between; padding-top: 30px; border-top: 1px solid #e2e8f0; page-break-inside: avoid; }
                    .sig-block { width: 200px; text-align: center; }
                    .sig-line { border-top: 1px solid #000; margin-bottom: 8px; }
                    .sig-block p { margin: 0; font-size: 12px; font-weight: 600; }
                    
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header" style="align-items: center;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justifyContent: center;">
                            <img 
                                src="${selectedClinic?.logo ? (selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${API_URL.replace(/\/api$/, '')}${selectedClinic.logo.startsWith('/') ? selectedClinic.logo : `/${selectedClinic.logo}`}`) : "/sidebar-logo.jpg"}" 
                                alt="Logo" 
                                style="max-width: 100%; max-height: 100%; object-fit: contain;" 
                            />
                        </div>
                        <div class="brand">
                            <h1>${selectedClinic?.name || 'Dhanwantri Hospital'}</h1>
                            <p>${selectedClinic?.location || 'Healthcare Facility'}</p>
                            ${selectedClinic?.contact ? `<p style="font-size: 11px;">Tel: ${selectedClinic.contact}</p>` : ''}
                        </div>
                    </div>
                    <div class="meta">
                        <p><strong>Report Ref:</strong> #${viewedAssessment.id}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>


                <div class="patient-banner">
                    <div class="patient-info">
                        <h2>${viewedAssessment.patient?.name || viewedAssessment.patientName}</h2>
                        <p>Visit Date: ${new Date(viewedAssessment.visitDate || viewedAssessment.date || viewedAssessment.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="visit-type">${viewedAssessment.type || 'Assessment'}</div>
                </div>

                <div class="content-section">
                    <div class="section-title">Clinical Findings</div>
                    <div class="findings-grid">
                        ${findingsHtml}
                    </div>
                </div>

                ${ordersHtml}

                <div class="footer">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <p>Doctor's Signature</p>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <p>Date</p>
                    </div>
                </div>
                
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };
    const handleStartAssessment = async (templateId) => {
        setLoadingTemplate(true);
        setValidationErrors({});
        try {
            // Fetch full template details with parsed fields
            const res = await doctorService.getTemplateById(templateId);
            const template = res.data;
            setSelectedTemplateId(templateId);
            setSelectedTemplate(template);
            // Initialize form data
            const initialData = {};
            if (template.fields) {
                template.fields.forEach((f) => {
                    initialData[f.id] = f.type === 'checkbox' ? [] : '';
                });
            }
            setFormData(initialData);
        }
        catch (error) {
            console.error('Failed to fetch template:', error);
            alert('Failed to load assessment template. Please try again.');
        }
        finally {
            setLoadingTemplate(false);
        }
    };
    const validateForm = () => {
        const errors = {};
        if (!formData['diagnosis'] || !formData['diagnosis'].trim()) {
            errors['diagnosis'] = 'Primary Diagnosis is required';
        }
        if (selectedTemplate && selectedTemplate.fields) {
            selectedTemplate.fields.forEach((field) => {
                if (field.required) {
                    const value = formData[field.id];
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        errors[field.id] = `${field.label} is required`;
                    }
                }
            });
        }
        // Prescription Validation
        orders.forEach((o, i) => {
            if (o.type === 'PHARMACY') {
                if (!o.inventoryId) {
                    errors[`order_${i}`] = 'Please select a medicine';
                }
                else if (!o.quantity || o.quantity <= 0) {
                    errors[`order_${i}`] = 'Quantity must be greater than 0';
                }
                else if (o.quantity > o.stock) {
                    errors[`order_${i}`] = `Requested quantity for ${o.testName} exceeds available stock (${o.stock})`;
                }
            }
        });
        setValidationErrors(errors);
        const firstError = Object.values(errors)[0];
        if (firstError) {
            alert(firstError);
        }
        return Object.keys(errors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                appointmentId: currentAppointment?.id,
                patientId: Number(selectedPatientId),
                assessmentData: {
                    ...formData,
                    templateId: selectedTemplateId,
                    patientId: Number(selectedPatientId),
                    ordersSnapshot: orders.filter(o => o.testName.trim() !== '')
                },
                prescriptions: orders.filter(o => (o.type === 'MEDICINE' || o.type === 'PHARMACY') && o.testName.trim() !== ''),
                labRequests: orders.filter(o => o.type === 'LAB' && o.testName.trim() !== ''),
                radiologyRequests: orders.filter(o => o.type === 'RADIOLOGY' && o.testName.trim() !== ''),
                billingAmount: 150 // Default consultation fee
            };
            const response = await doctorService.submitAssessment(payload);
            if (response.status === 'success' || response.data) {
                // Assessment submitted successfully
                setIsNewAssessmentOpen(false);
                resetForm();
                // Navigate to Medical Report
                navigate('/doctor/medical-report/new', {
                    state: {
                        assessment: payload.assessmentData,
                        patient: patients.find((p) => p.id === Number(selectedPatientId)),
                        doctor: staff.find((s) => s.userId === user.id)
                    }
                });
            }
        }
        catch (error) {
            console.error('Failed to submit assessment:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save assessment. Please try again.';
            alert(errorMessage);
        }
        finally {
            setSubmitting(false);
        }
    };
    const resetForm = () => {
        setSelectedPatientId('');
        setSelectedTemplateId(null);
        setSelectedTemplate(null);
        setFormData({});
        setValidationErrors({});
        setOrders([]);
    };
    const filteredAssessments = assessments.filter(assessment => assessment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (<div className="doctor-dashboard">
            <div className="assessments-header">
                <div>
                    <h1 className="assessments-title">Assessments</h1>
                    <p className="assessments-subtitle">Create and manage patient assessments</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={() => setIsNewAssessmentOpen(true)}>
                    <FiPlus />
                    <span>New Assessment</span>
                </button>
            </div>

            <div className="assessments-search-card">
                <div className="search-stats-row">
                    <div className="search-box-left">
                        <FiSearch className="search-icon-small"/>
                        <input type="text" placeholder="Search by patient name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-minimal"/>
                    </div>
                </div>
            </div>

            <div className="assessments-grid">
                {loading ? (<div className="assessments-loading-state">
                        <p>Loading assessments...</p>
                    </div>) : filteredAssessments.length > 0 ? (filteredAssessments.map(assessment => (<div key={assessment.id} className="assessment-card">
                            <div className="assessment-header-row">
                                <div className="assessment-patient-info">
                                    <h3 className="assessment-patient-name">{assessment.patient?.name || assessment.patientName || 'Unknown Patient'}</h3>
                                    <p className="assessment-date">
                                        {new Date(assessment.visitDate || assessment.date || assessment.createdAt).toLocaleString()} • {assessment.type || 'Assessment'}
                                    </p>
                                </div>
                                <span className="status-badge completed">
                                    <FiCheckCircle size={14}/>
                                    {assessment.status || 'Completed'}
                                </span>
                            </div>

                            <div className="assessment-actions">
                                <button className="action-btn-icon" title="View Patient File" onClick={() => {
                const pid = assessment.patient?.id || assessment.patientId;
                const pname = assessment.patient?.name || assessment.patientName;
                if (pid)
                    openProfile(pid, pname);
            }}>
                                    <FiFolder />
                                </button>
                                <button className="action-btn-icon" title="View Details" onClick={() => { setViewedAssessment(assessment); setIsViewModalOpen(true); }}>
                                    <FiEye />
                                </button>
                            </div>

                        </div>))) : (<div className="empty-state-assessments">
                        <FiFileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }}/>
                        <h3>No assessments found</h3>
                        <p>Create your first assessment by clicking "New Assessment" above.</p>
                    </div>)}
            </div>

            <Modal isOpen={isNewAssessmentOpen} onClose={() => { setIsNewAssessmentOpen(false); resetForm(); }} title="New Clinical Assessment" size="lg">
                <form className="dynamic-assessment-form" onSubmit={handleSubmit}>
                    {/* TOP SECTION: Patient & Template Selection */}
                    <div className="form-group mb-lg">
                        <label>Patient *</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select required value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="compact-select" style={{ height: '42px', flex: 1 }}>
                                <option value="">Choose patient...</option>
                                <optgroup label="Waiting Room (Checked In)">
                                    {checkedInPatients.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                </optgroup>
                            </select>
                            {selectedPatientId && (<button type="button" className="btn btn-secondary" style={{ height: '42px', width: '42px', padding: 0, minWidth: '42px' }} onClick={() => {
                const p = patients.find((p) => p.id === Number(selectedPatientId));
                if (p)
                    openProfile(p.id, p.name);
            }} title="View Patient File">
                                    <FiFolder />
                                </button>)}
                        </div>
                        {selectedPatientId && !isSelectedPatientValid && (<div style={{ marginTop: '0.5rem', color: '#dc2626', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiCheckCircle style={{ transform: 'rotate(180deg)' }}/>
                                Patient must be checked-in by Reception before starting assessment.
                            </div>)}
                    </div>

                    <div className="form-group mb-lg">
                        <label>Template *</label>
                        <select required value={selectedTemplateId || ''} onChange={(e) => {
            const templateId = Number(e.target.value);
            if (templateId) {
                handleStartAssessment(templateId);
            }
        }} disabled={!selectedPatientId || loadingTemplate || !isSelectedPatientValid} className="compact-select" style={{ height: '42px', width: '100%', opacity: (!selectedPatientId || !isSelectedPatientValid) ? 0.6 : 1, cursor: (!selectedPatientId || !isSelectedPatientValid) ? 'not-allowed' : 'pointer' }}>
                            <option value="">Select Template...</option>
                            {finalTemplates
            .filter((t, index, self) => index === self.findIndex((t2) => t2.name === t.name))
            .map((template) => (<option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>))}
                        </select>
                    </div>

                    <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}></div>

                    {selectedTemplateId ? (<>
                            {/* Visit Info Header */}


                            <div className="standard-clinical-fields mb-xl">
                                <h4 className="section-title-clinical">Clinical Diagnosis</h4>
                                <div className="form-group">
                                    <label>Diagnosis / Impression <span className="text-danger">*</span></label>
                                    <textarea required rows={2} placeholder="Enter primary diagnosis..." value={formData['diagnosis'] || ''} onChange={e => setFormData({ ...formData, 'diagnosis': e.target.value })} className="compact-input" style={{ height: 'auto', minHeight: '60px' }}/>
                                </div>

                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Follow-up Date</label>
                                        <input type="date" min={new Date().toISOString().split('T')[0]} value={formData['followUpDate'] || ''} onChange={e => setFormData({ ...formData, 'followUpDate': e.target.value })} className="compact-input"/>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Advice / Instructions</label>
                                        <input type="text" placeholder="e.g. Rest for 2 days, Drink water" value={formData['advice'] || ''} onChange={e => setFormData({ ...formData, 'advice': e.target.value })} className="compact-input"/>
                                    </div>
                                </div>
                            </div>

                            <div className="dynamic-fields-scroll">
                                <h4 className="section-title-clinical">Examination Details</h4>
                                {selectedTemplate?.fields.map((field) => (<div key={field.id} className="form-group">
                                        <label>
                                            {field.label}
                                            {field.required && <span className="text-danger">*</span>}
                                        </label>

                                        {field.type === 'textarea' ? (<textarea required={field.required} rows={3} placeholder={field.placeholder || ''} value={formData[field.id] || ''} onChange={e => setFormData({ ...formData, [field.id]: e.target.value })} className={`compact-input ${validationErrors[field.id] ? 'error' : ''}`} style={{ height: 'auto', minHeight: '80px' }}/>) : field.type === 'dropdown' ? (<select required={field.required} value={formData[field.id] || ''} onChange={e => setFormData({ ...formData, [field.id]: e.target.value })} className={`compact-select ${validationErrors[field.id] ? 'error' : ''}`}>
                                                <option value="">Select...</option>
                                                {field.options?.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                            </select>) : field.type === 'checkbox' ? (<div className="checkbox-group">
                                                {field.options?.map((opt) => (<label key={opt} className="checkbox-item">
                                                        <input type="checkbox" checked={(formData[field.id] || []).includes(opt)} onChange={e => {
                            const current = formData[field.id] || [];
                            const updated = e.target.checked
                                ? [...current, opt]
                                : current.filter((val) => val !== opt);
                            setFormData({ ...formData, [field.id]: updated });
                        }}/>
                                                        <span>{opt}</span>
                                                    </label>))}
                                            </div>) : (<input type={field.type} required={field.required} placeholder={field.placeholder || ''} value={formData[field.id] || ''} onChange={e => setFormData({ ...formData, [field.id]: e.target.value })} className={`compact-input ${validationErrors[field.id] ? 'error' : ''}`}/>)}

                                        {validationErrors[field.id] && (<p className="error-message">{validationErrors[field.id]}</p>)}
                                    </div>))}

                                {/* Service Orders Section */}
                                <div className="mt-xl">
                                    <h4 className="section-title-clinical">Service Orders & Prescriptions</h4>
                                    <div className="orders-container">
                                        {orders.map((order, index) => (<div key={index} className="order-row-single">
                                                <div className="order-col-type">
                                                    <select className="compact-select" value={order.type} onChange={(e) => updateOrder(index, 'type', e.target.value)}>
                                                        <option value="LAB">LAB</option>
                                                        <option value="RADIOLOGY">RADIOLOGY</option>
                                                        <option value="PHARMACY">PHARMACY</option>
                                                    </select>
                                                </div>
                                                <div className="order-col-item">
                                                    {order.type === 'PHARMACY' ? (<select className="compact-select" value={order.inventoryId || ''} onChange={(e) => {
                        const invId = Number(e.target.value);
                        const item = pharmacyInventory.find(i => i.id === invId);
                        if (item) {
                            const updated = [...orders];
                            updated[index] = {
                                ...updated[index],
                                inventoryId: invId,
                                testName: item.medicineName || item.name,
                                stock: item.quantity || 0,
                                unitPrice: Number(item.unitPrice || 0)
                            };
                            setOrders(updated);
                        }
                    }}>
                                                            <option value="">Select Medicine...</option>
                                                            {pharmacyInventory && pharmacyInventory.map((item) => (<option key={item.id} value={item.id}>
                                                                    {item.medicineName || item.name} {item.quantity !== undefined ? `(Stock: ${item.quantity})` : ''}
                                                                </option>))}
                                                        </select>) : (<div style={{ position: 'relative' }}>
                                                            <input type="text" className="compact-input" placeholder="Search or Enter Test Name..." list={`services-list-${index}`} value={order.testName} onChange={(e) => {
                        const val = e.target.value;
                        let amount = 0;
                        const matchedService = clinicServices.find(cs => cs.name === val && cs.type === order.type);
                        if (matchedService) {
                            amount = Number(matchedService.price || 0);
                        }
                        const updated = [...orders];
                        updated[index] = { ...updated[index], testName: val, amount };
                        setOrders(updated);
                    }}/>
                                                            <datalist id={`services-list-${index}`}>
                                                                {(Array.isArray(clinicServices) ? clinicServices : []).filter(cs => cs.type === order.type && cs.isActive !== false).map(cs => (<option key={cs.id} value={cs.name}/>))}
                                                            </datalist>
                                                        </div>)}
                                                </div>
                                                {order.type !== 'PHARMACY' && (<div className="order-col-amount" style={{ flex: '0 0 15%', minWidth: '80px' }}>
                                                        <div style={{
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '38px'
                    }}>
                                                            {order.amount ? `${order.amount}` : '--'}
                                                        </div>
                                                    </div>)}
                                                {order.type === 'PHARMACY' && (<>
                                                        <div className="order-col-qty" style={{ flex: '0 0 12%', minWidth: '70px' }}>
                                                            <input type="number" className={`compact-input ${order.quantity > order.stock ? 'error' : ''}`} placeholder="Qty" min="1" value={order.quantity || ''} onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 0);
                        updateOrder(index, 'quantity', val);
                    }} title={order.quantity > order.stock ? "Exceeds available stock" : ""}/>
                                                            {order.quantity > order.stock && (<span style={{ fontSize: '10px', color: '#dc2626', display: 'block' }}>Max: {order.stock}</span>)}
                                                        </div>
                                                        <div className="order-col-unit" style={{ flex: '0 0 15%', minWidth: '80px' }}>
                                                            <select className="compact-select" value={order.unit || 'Piece'} onChange={(e) => updateOrder(index, 'unit', e.target.value)}>
                                                                <option value="Piece">Piece</option>
                                                                <option value="Strip">Strip</option>
                                                                <option value="Box">Box</option>
                                                                <option value="Bottle">Bottle</option>
                                                                <option value="Tube">Tube</option>
                                                            </select>
                                                        </div>
                                                    </>)}
                                                <div className="order-col-instr">
                                                    <textarea className="compact-input" placeholder="Full Instructions / Dosage / Frequency..." rows={3} value={order.details || ''} onChange={(e) => updateOrder(index, 'details', e.target.value)}/>
                                                </div>
                                                <button type="button" className="btn-icon-deleter" onClick={() => removeOrder(index)} title="Remove Order">
                                                    <FiPlus style={{ transform: 'rotate(45deg)' }}/>
                                                </button>
                                            </div>))}

                                        <button type="button" className="btn-add-order" onClick={addOrder}>
                                            <FiPlus /> Add Prescription / Test Order
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>) : (<div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <p>Please select a patient and template to start the consultation.</p>
                        </div>)}

                    <div className="modal-actions mt-xl">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsNewAssessmentOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-no-hover" disabled={submitting || !selectedTemplateId} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                            {submitting ? 'Saving...' : 'Complete Consultation'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Assessment Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setViewedAssessment(null); }} title="Assessment Details" size="lg">
                {viewedAssessment && (<div className="assessment-view-details">
                        {/* Print Only Header */}
                        <div className="report-branded-header hover-hidden">
                            <div className="clinic-brand">
                                <div className="brand-logo-small">EV</div>
                                <div>
                                    <h2>Dhanwantri Hospital</h2>
                                    <p>Excellence in Veterinary Care</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
                                <p><strong>Ref:</strong> #{viewedAssessment.id}</p>
                            </div>
                        </div>

                        <div className="view-header-main">
                            <div className="patient-banner-brief">
                                <div className="patient-meta-core">
                                    <h1>{viewedAssessment.patient?.name || viewedAssessment.patientName}</h1>
                                    <p className="text-muted">
                                        Visit Date: {new Date(viewedAssessment.visitDate || viewedAssessment.date || viewedAssessment.submittedAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="status-pill-minimal completed">
                                    {viewedAssessment.type || 'Assessment'}
                                </div>
                            </div>
                        </div>

                        <div className="assessment-display-container">
                            {(() => {
                let recordData = {};
                try {
                    // Handle both data (MedicalRecord) and answers (FormResponse) fields
                    const rawData = viewedAssessment.data || viewedAssessment.answers;
                    recordData = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData || {});
                }
                catch (e) {
                    console.error("Error parsing assessment data", e);
                    return <p className="error-message">Error loading record details.</p>;
                }
                const orders = recordData.ordersSnapshot || [];
                // Filter out system keys from display
                const displayKeys = Object.keys(recordData).filter(k => k !== 'ordersSnapshot' && k !== 'templateId' && k !== 'patientId');
                return (<>
                                        <div className="observations-grid">
                                            {displayKeys.map(key => {
                        // Try to find label from template if available
                        let label = key.replace(/([A-Z])/g, ' $1').trim();
                        const fields = viewedAssessment.formtemplate?.fields
                            ? (typeof viewedAssessment.formtemplate.fields === 'string'
                                ? JSON.parse(viewedAssessment.formtemplate.fields)
                                : viewedAssessment.formtemplate.fields)
                            : [];
                        const fieldDef = fields.find((f) => f.id === key);
                        if (fieldDef)
                            label = fieldDef.label;
                        const value = recordData[key];
                        // Skip empty values in report
                        if (!value || (Array.isArray(value) && value.length === 0))
                            return null;
                        return (<div key={key} className="obs-item">
                                                        <label>{label.toUpperCase()}</label>
                                                        <div className="obs-value">
                                                            {Array.isArray(value) ? value.join(', ') : String(value)}
                                                        </div>
                                                    </div>);
                    })}
                                        </div>

                                        {/* Prescriptions & Orders Section */}
                                        {orders && orders.length > 0 && (<div className="medical-orders-box">
                                                <h4 className="section-title-minimal">Prescriptions & Orders</h4>
                                                <div className="orders-refined-list">
                                                    {orders.map((order, idx) => (<div key={idx} className="order-entry">
                                                            <div className="order-type">{order.type}</div>
                                                            <div className="order-details-text">
                                                                <strong>{order.testName}</strong>
                                                                {order.details ? ` - ${order.details}` : ''}
                                                            </div>
                                                        </div>))}
                                                </div>
                                            </div>)}
                                    </>);
            })()}

                            <div className="report-signatures">
                                <div className="sig-block">
                                    <div className="sig-line"></div>
                                    <p><strong>Doctor Signature</strong></p>
                                </div>
                                <div className="sig-block">
                                    <div className="sig-line"></div>
                                    <p><strong>Date</strong></p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions-floating-bottom">
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
                            <button className="btn btn-no-hover" style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', color: 'white', border: 'none' }} onClick={() => {
                setIsViewModalOpen(false);
                navigate('/doctor/medical-report/new', {
                    state: {
                        assessment: viewedAssessment,
                        patient: viewedAssessment.patient
                    }
                });
            }}>
                                <FiPlus /> Create Medical Report
                            </button>
                            <button className="btn btn-primary btn-no-hover" onClick={handlePrintAssessment} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                <FiFileText /> Print Assessment
                            </button>
                        </div>
                    </div>)}
            </Modal>

            {/* Patient Profile Modal */}
            {selectedPatientForProfile && (<PatientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} patientId={selectedPatientForProfile.id} patientName={selectedPatientForProfile.name}/>)}
        </div>);
};
export default Assessments;
