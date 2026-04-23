import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiMail, FiMapPin, FiEye, FiEdit, FiCheck, FiDownload, FiLock, FiCalendar } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { receptionService } from '../../services/reception.service';
import Modal from '../../components/Modal';
import PatientProfileModal from '../../components/PatientProfileModal';
import './Patients.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
const PatientManagement = () => {
    const { patients, staff, addPatient, addBooking, logAction } = useApp();
    const { selectedClinic } = useAuth();
    const { symbol, currency } = useCurrency();
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [isExistingWalkInModalOpen, setIsExistingWalkInModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [patientExistingAppointments, setPatientExistingAppointments] = useState([]);
    const [registrationForm, setRegistrationForm] = useState({
        name: '',
        phone: '',
        email: '',
        dob: '',
        gender: 'Male',
        address: '',
        medicalHistory: '',
        doctorId: '',
        visitTime: '',
        fees: '',
        currency: currency.code,
        password: ''
    });
    useEffect(() => {
        if (isExistingWalkInModalOpen && selectedPatient?.id) {
            receptionService.getPatientAppointments(selectedPatient.id)
                .then((r) => setPatientExistingAppointments(r?.data?.data ?? r?.data ?? []))
                .catch(() => setPatientExistingAppointments([]));
        }
        else {
            setPatientExistingAppointments([]);
        }
    }, [isExistingWalkInModalOpen, selectedPatient?.id]);
    const handleViewPatient = (patient) => {
        setSelectedPatient(patient);
        setIsViewModalOpen(true);
    };
    const handleEditPatient = (patient) => {
        setSelectedPatient(patient);
        setIsEditModalOpen(true);
    };
    // Clinic-scoped: only show patients for selected clinic
    const clinicPatients = (patients || []).filter((p) => Number(p.clinicId) === Number(selectedClinic?.id));
    const filteredPatients = clinicPatients.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone?.includes(searchTerm) ||
            `P-${p.id}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        const matchesYear = yearFilter === 'All' || p.createdYear?.toString() === yearFilter;
        return matchesSearch && matchesStatus && matchesYear;
    });
    const exportToCSV = async () => {
        try {
            const doc = new jsPDF();
            // Add professional header
            await addClinicHeader(doc, selectedClinic, 'Patient Registry Report');
            // Define columns and data
            const tableColumn = ["ID", "Name", "Phone", "Email", "Gender", "Status", "Registered Date"];
            const tableRows = [];
            filteredPatients.forEach((p) => {
                const patientData = [
                    `P-${p.id}`,
                    p.name || 'Unknown',
                    p.phone || '-',
                    p.email || '-',
                    p.gender || '-',
                    p.status || 'Active',
                    p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'
                ];
                tableRows.push(patientData);
            });
            // Add autoTable
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45, // Start after the header
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [30, 41, 59], // Dark slate blue
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [241, 245, 249] // Slate 100
                },
                columnStyles: {
                    0: { cellWidth: 20 }, // ID
                    1: { cellWidth: 35 }, // Name
                    2: { cellWidth: 25 }, // Phone
                    3: { cellWidth: 40 }, // Email
                    4: { cellWidth: 20 }, // Gender
                    5: { cellWidth: 25 }, // Status
                    6: { cellWidth: 25 } // Date
                }
            });
            // Add footer with page numbers
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            // Save PDF
            doc.save(`patients_export_${new Date().toISOString().split('T')[0]}.pdf`);
        }
        catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };
    const handlePrintPDF = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow)
            return;
        const htmlContent = `
            <html>
            <head>
                <title>Patient Registry Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #1e293b; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #f1f5f9; font-weight: bold; }
                    .header-info { margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                    .footer { margin-top: 20px; font-size: 10px; text-align: right; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="header-info">
                    <h1>Dhanwantri Hospital - Patient Registry</h1>
                    <p>Total Patients: ${filteredPatients.length}</p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Gender</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredPatients.map((p) => `
                            <tr>
                                <td>P-${p.id}</td>
                                <td>${p.name || 'Unknown'}</td>
                                <td>${p.phone || '-'}</td>
                                <td>${p.email || '-'}</td>
                                <td>${p.gender || '-'}</td>
                                <td>${p.status || 'Active'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    Generated by Dhanwantri Hospital Management System
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const newPatientData = {
            ...registrationForm,
            status: isWalkIn ? 'Pending Payment' : 'Active',
            createdYear: new Date().getFullYear(),
        };
        const savedPatient = await addPatient(newPatientData);
        if (savedPatient.credentials) {
            setCreatedCredentials(savedPatient.credentials);
        }
        if (isWalkIn && registrationForm.fees && registrationForm.doctorId) {
            // Invoice and appointment are handled by backend during registration if doctorId/fees provided
            logAction('Invoice Created', 'System', { patientId: savedPatient.id, amount: registrationForm.fees });
        }
        logAction('Patient Registered', 'Reception', { name: registrationForm.name, type: isWalkIn ? 'Walk-in' : 'Regular' });
        setIsRegisterModalOpen(false);
        setRegistrationForm({
            name: '', phone: '', email: '', dob: '', gender: 'Male', address: '', medicalHistory: '', doctorId: '', visitTime: '', fees: '', currency: currency.code, password: ''
        });
        setIsWalkIn(false);
    };
    const StatusPill = ({ status }) => {
        const statusClass = status ? status.toLowerCase().replace(' ', '-') : 'active';
        return <span className={`status-pill ${statusClass}`}>{status || 'Active'}</span>;
    };
    const handleExistingWalkInSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient)
            return;
        await addBooking({
            patientId: selectedPatient.id,
            doctorId: Number(registrationForm.doctorId),
            fees: Number(registrationForm.fees),
            time: registrationForm.visitTime,
            date: new Date().toISOString().split('T')[0],
            service: 'Patient Consultation'
        });
        logAction('Walk-in Booked', 'Reception', { patientId: selectedPatient.id, amount: registrationForm.fees });
        setIsExistingWalkInModalOpen(false);
        setRegistrationForm({ ...registrationForm, doctorId: '', visitTime: '', fees: '' });
    };
    return (<div className="patient-management-page">
            <div className="page-header" style={{ alignItems: 'center' }}>
                <div>
                    <h1>Patient Management</h1>
                    <p>Register and manage patient records</p>
                </div>
                <div className="action-btns-header" style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-secondary" onClick={handlePrintPDF}>
                        <FiDownload /> <span>Print PDF</span>
                    </button>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <FiDownload /> <span>Export CSV</span>
                    </button>
                    <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={() => setIsRegisterModalOpen(true)}>
                        <FiPlus size={18}/>
                        <span>Register Patient</span>
                    </button>
                </div>
            </div>

            <div className="filter-bar-container">
                <div className="search-filters">
                    <div className="search-input-wrapper">
                        <FiSearch />
                        <input type="text" placeholder="Search by name, phone, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        <option value="Pending Payment">Pending Patients</option>
                        <option value="Active">Completed Patients</option>
                        <option value="Old">Old Patients</option>
                    </select>
                    <select className="filter-select" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                        <option value="All">All Years</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>

                <div className="quick-stats">
                    <div className="stat-pill">
                        <span>Total Patients</span>
                        <strong>{clinicPatients.length}</strong>
                    </div>
                    <div className="stat-pill">
                        <span>Results</span>
                        <strong>{filteredPatients.length}</strong>
                    </div>
                </div>
            </div>

            <div className="patient-cards-grid mt-lg">
                {filteredPatients.map((patient) => (<div key={patient.id} className="patient-profile-card card">
                        <div className="card-top">
                            <div className="patient-avatar-circle">
                                {(patient.name || 'U').charAt(0)}
                            </div>
                            <div className="patient-basic-info">
                                <h3>{patient.name || 'Unknown Patient'}</h3>
                                <div className="patient-id-tag">ID: P-{patient.id}</div>
                                <StatusPill status={patient.status}/>
                            </div>
                        </div>
                        <div className="card-divider"></div>
                        <div className="patient-contact-details">
                            <div className="contact-row">
                                <div className="contact-info-block">
                                    <FiMail size={16}/>
                                    <span>{patient.email || 'No email provided'}</span>
                                </div>
                            </div>
                            <div className="contact-row">
                                <div className="contact-info-block">
                                    <FiMapPin size={16}/>
                                    <span>{patient.address || 'No address provided'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="card-actions-row">
                            <button className="action-icon-btn" onClick={() => handleViewPatient(patient)} title="View Profile"><FiEye /></button>
                            <button className="action-icon-btn" onClick={() => handleEditPatient(patient)} title="Edit Profile"><FiEdit /></button>
                            <button className="action-icon-btn" onClick={() => { setSelectedPatient(patient); setIsResetPasswordModalOpen(true); }} title="Reset Password"><FiLock /></button>
                            <button className="action-icon-btn" onClick={() => { setSelectedPatient(patient); setIsExistingWalkInModalOpen(true); }} title="Book Walk-in">
                                <FiPlus style={{ color: '#10B981' }}/>
                            </button>
                        </div>
                    </div>))}
            </div>

            {/* Register New Patient Modal */}
            <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register New Patient" size="lg">
                <form className="modal-form" onSubmit={handleRegisterSubmit}>
                    <h4 className="form-section-title">Personal Information</h4>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input type="text" placeholder="John Doe" required value={registrationForm.name} onChange={e => setRegistrationForm({ ...registrationForm, name: e.target.value })}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', alignItems: 'start' }}>
                        <div className="form-group">
                            <label style={{ fontSize: '0.75rem' }}>Code *</label>
                            <select style={{ textAlign: 'center', padding: '0.6rem 0.5rem', width: '100%' }} value={registrationForm.phone.split(' ')[0] || '+971'} onChange={e => {
            const currentNumber = registrationForm.phone.includes(' ') ? registrationForm.phone.split(' ').slice(1).join(' ') : registrationForm.phone;
            setRegistrationForm({ ...registrationForm, phone: `${e.target.value} ${currentNumber}` });
        }}>
                                <option value="+971">+971 (UAE)</option>
                                <option value="+966">+966 (KSA)</option>
                                <option value="+968">+968 (Oman)</option>
                                <option value="+974">+974 (Qatar)</option>
                                <option value="+965">+965 (Kuwait)</option>
                                <option value="+973">+973 (Bahrain)</option>
                                <option value="+91">+91 (India)</option>
                                <option value="+44">+44 (UK)</option>
                                <option value="+1">+1 (USA)</option>
                                <option value="+20">+20 (Egypt)</option>
                                <option value="+92">+92 (Pakistan)</option>
                                <option value="+63">+63 (Philippines)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Mobile Number *</label>
                            <input type="text" placeholder="50 123 4567" required value={registrationForm.phone.includes(' ') ? registrationForm.phone.split(' ').slice(1).join(' ') : registrationForm.phone} onChange={e => {
            const currentCode = registrationForm.phone.includes(' ') ? registrationForm.phone.split(' ')[0] : '+971';
            setRegistrationForm({ ...registrationForm, phone: `${currentCode} ${e.target.value}` });
        }}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="john@example.com" value={registrationForm.email} onChange={e => setRegistrationForm({ ...registrationForm, email: e.target.value })}/>
                    </div>
                    <div className="form-group">
                        <label>Password (Optional)</label>
                        <input type="text" placeholder="Set custom password" value={registrationForm.password} onChange={e => setRegistrationForm({ ...registrationForm, password: e.target.value })}/>
                    </div>
                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" placeholder="mm/dd/yyyy" value={registrationForm.dob} onChange={e => setRegistrationForm({ ...registrationForm, dob: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <select value={registrationForm.gender} onChange={e => setRegistrationForm({ ...registrationForm, gender: e.target.value })}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <textarea placeholder="Street address, city, country" rows={3} value={registrationForm.address} onChange={e => setRegistrationForm({ ...registrationForm, address: e.target.value })}></textarea>
                    </div>

                    {/* Walk-in section removed as per requirement */}

                    <h4 className="form-section-title">Emergency Contact</h4>
                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Contact Name</label>
                            <input type="text" placeholder="Emergency contact name"/>
                        </div>
                        <div className="form-group">
                            <label>Contact Phone</label>
                            <input type="text" placeholder="Emergency phone"/>
                        </div>
                    </div>

                    <h4 className="form-section-title">Medical Information</h4>
                    <div className="form-group">
                        <label>Medical History</label>
                        <textarea placeholder="Previous conditions, surgeries, etc." rows={3}></textarea>
                    </div>
                    <div className="form-group">
                        <label>Allergies</label>
                        <input type="text" placeholder="Drug allergies, food allergies, etc."/>
                    </div>

                    <div className="modal-actions-refined">
                        <button type="button" className="btn btn-secondary btn-lg" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-lg btn-with-icon btn-no-hover">
                            <FiCheck /> Register Patient
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Credentials Modal */}
            <Modal isOpen={!!createdCredentials} onClose={() => setCreatedCredentials(null)} title="Patient Account Created" size="sm">
                <div className="credentials-view text-center">
                    <div className="success-icon-large mb-md">
                        <FiCheck size={40}/>
                    </div>
                    <p className="mb-md">Share these login details with the patient for portal access.</p>

                    <div className="credentials-box">
                        <div className="cred-row">
                            <span className="label">Portal URL:</span>
                            <span className="value">ev-clinic.com/login</span>
                        </div>
                        <div className="cred-row">
                            <span className="label">Username:</span>
                            <span className="value copy-text">{createdCredentials?.email}</span>
                        </div>
                        <div className="cred-row">
                            <span className="label">Password:</span>
                            <span className="value highlight">{createdCredentials?.password}</span>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full mt-lg btn-no-hover" onClick={() => setCreatedCredentials(null)}>
                        Done
                    </button>
                </div>
            </Modal>

            {/* Replacement: View Full Profile Modal */}
            <PatientProfileModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} patientId={selectedPatient?.id}/>

            {/* Edit Patient Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Patient Information" size="lg">
                {selectedPatient && (<form className="modal-form" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updates = {};
                formData.forEach((value, key) => {
                    if (key !== 'phoneCode' && key !== 'phoneNumber') {
                        updates[key] = value;
                    }
                });
                const pCode = formData.get('phoneCode');
                const pNum = formData.get('phoneNumber');
                if (pCode && pNum) {
                    updates.phone = `${pCode} ${pNum}`;
                }
                try {
                    // Call service to update
                    await receptionService.updatePatient(selectedPatient.id, updates);
                    // Update local state (assuming useApp has a way to refresh or we manually update list)
                    // Since useApp has a 'patients' state but no direct 'updatePatient' reducer exposed in the minimal context shown,
                    // we act on the list directly or prompt a refresh. 
                    // The context has `updatePatientStatus`, but not a generic update.
                    // We can try to modify the array in place locally if 'patients' comes from state passed down, 
                    // but 'patients' is from context. 
                    // Best way: Trigger a refetch or manually update if we had a setter. 
                    // Looking at AppContext, it has limited setters exposed.
                    // We will assume a page refresh or basic alert for now, or use the response to at least show it worked.
                    alert('Patient updated successfully!');
                    // HACK: Force reload or update local item if possible.
                    window.location.reload();
                    setIsEditModalOpen(false);
                }
                catch (err) {
                    alert('Failed to update: ' + (err.response?.data?.message || err.message));
                }
            }}>
                        <h4 className="form-section-title">Personal Information</h4>
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input name="name" type="text" defaultValue={selectedPatient.name} required/>
                        </div>
                        <div className="form-group">
                            <label>Phone Number *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.5rem' }}>
                                <select name="phoneCode" defaultValue={(selectedPatient.contact || selectedPatient.phone || '').split(' ')[0] || '+971'} style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }} required>
                                    <option value="+971">+971 (UAE)</option>
                                    <option value="+966">+966 (KSA)</option>
                                    <option value="+968">+968 (Oman)</option>
                                    <option value="+974">+974 (Qatar)</option>
                                    <option value="+965">+965 (Kuwait)</option>
                                    <option value="+973">+973 (Bahrain)</option>
                                    <option value="+91">+91 (India)</option>
                                    <option value="+44">+44 (UK)</option>
                                    <option value="+1">+1 (USA)</option>
                                    <option value="+20">+20 (Egypt)</option>
                                    <option value="+92">+92 (Pakistan)</option>
                                    <option value="+63">+63 (Philippines)</option>
                                </select>
                                <input name="phoneNumber" type="text" defaultValue={(selectedPatient.contact || selectedPatient.phone || '').includes(' ') ? (selectedPatient.contact || selectedPatient.phone || '').split(' ').slice(1).join(' ') : (selectedPatient.contact || selectedPatient.phone)} required/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input name="email" type="email" defaultValue={selectedPatient.email} className="form-control"/>
                        </div>
                        <div className="form-grid grid-2">
                            <div className="form-group">
                                <label>Age</label>
                                <input name="age" type="number" defaultValue={selectedPatient.age}/>
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <select name="gender" defaultValue={selectedPatient.gender}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <textarea name="address" defaultValue={selectedPatient.address} rows={3}></textarea>
                        </div>

                        <h4 className="form-section-title">Medical Information</h4>
                        <div className="form-group">
                            <label>Medical History</label>
                            <textarea name="medicalHistory" defaultValue={selectedPatient.medicalHistory} placeholder="Previous conditions, surgeries, etc." rows={3}></textarea>
                        </div>

                        <div className="modal-actions-refined">
                            <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn-save">
                                <FiCheck /> Save Changes
                            </button>
                        </div>
                    </form>)}
            </Modal>

            {/* Existing Patient Walk-in Modal */}
            <Modal isOpen={isExistingWalkInModalOpen} onClose={() => setIsExistingWalkInModalOpen(false)} title={`Book Walk-in: ${selectedPatient?.name}`} size="md">
                {patientExistingAppointments.length > 0 && (<div className="patient-appointments-alert" style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
            }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#92400E' }}>
                            <FiCalendar size={16}/> This patient already has an existing appointment:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {patientExistingAppointments.slice(0, 5).map((apt) => (<li key={apt.id} style={{ marginBottom: '0.25rem' }}>
                                    {new Date(apt.date).toLocaleDateString()} • {apt.time || '—'} • Dr. {apt.doctorName || 'Unknown'} • {apt.status}
                                </li>))}
                        </ul>
                        {patientExistingAppointments.length > 5 && (<small style={{ color: '#92400E' }}>+ {patientExistingAppointments.length - 5} more</small>)}
                    </div>)}
                <form className="modal-form" onSubmit={handleExistingWalkInSubmit}>
                    <div className="form-group">
                        <label>Assign Doctor *</label>
                        <select required value={registrationForm.doctorId} onChange={e => setRegistrationForm({ ...registrationForm, doctorId: e.target.value })}>
                            <option value="">Select Provider</option>
                            {(staff || []).filter((s) => {
            const roles = (s.roles || [s.role] || []).map((r) => String(r).toUpperCase());
            return roles.includes('DOCTOR') || roles.includes('ADMISSION');
        }).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Visit Time *</label>
                            <input type="time" required value={registrationForm.visitTime} onChange={e => setRegistrationForm({ ...registrationForm, visitTime: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Consultation Fees ({symbol}) *</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="number" required placeholder="0.00" value={registrationForm.fees} style={{ flex: 1 }} onChange={e => setRegistrationForm({ ...registrationForm, fees: e.target.value })}/>
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions-refined mt-lg">
                        <button type="button" className="btn-cancel" onClick={() => setIsExistingWalkInModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save">
                            <FiCheck /> Confirm Visit
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Password Reset Modal */}
            <Modal isOpen={isResetPasswordModalOpen} onClose={() => { setIsResetPasswordModalOpen(false); setNewPassword(''); }} title={`Reset Password: ${selectedPatient?.name}`} size="sm">
                <form className="modal-form" onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedPatient)
                return;
            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters.');
                return;
            }
            try {
                await receptionService.resetPassword(selectedPatient.id, newPassword);
                alert('Password reset successfully!');
                logAction('Password Reset', 'Reception', { patientId: selectedPatient.id });
                setIsResetPasswordModalOpen(false);
                setNewPassword('');
            }
            catch (err) {
                console.error(err);
                alert(err.response?.data?.message || 'Failed to reset password. Please try again.');
            }
        }}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input type="text" placeholder="Enter new secure password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                        <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                            Must be at least 6 characters long.
                        </small>
                    </div>

                    <div className="modal-actions-refined mt-lg">
                        <button type="button" className="btn-cancel" onClick={() => { setIsResetPasswordModalOpen(false); setNewPassword(''); }}>Cancel</button>
                        <button type="submit" className="btn-save" style={{ background: '#F59E0B', borderColor: '#F59E0B' }}>
                            <FiLock />  Update Password
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default PatientManagement;
