import React, { useState, useEffect } from 'react';
import { FiUser, FiActivity, FiFileText, FiClock, FiX, FiMail, FiPhone, FiCalendar, FiUpload, FiDownload, FiFile, FiShoppingBag, FiCreditCard, FiCheckCircle, FiEye } from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { doctorService } from '../services/doctor.service';
import { clinicService } from '../services/clinic.service';
import { useCurrency } from '../context/CurrencyContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader, ensureUnicodeFont } from '../utils/pdfUtils';
import './PatientProfileModal.css';
const PatientProfileModal = ({ isOpen, onClose, patientId, patientName }) => {
    const { formTemplates } = useApp();
    const { formatMoney, symbol } = useCurrency();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const displayName = patientName || profile?.patient?.name || 'Patient';
    const [activeTab, setActiveTab] = useState('history'); // history, template-ID, results, info, documents
    // Helper to format document URLs
    const getDocUrl = (url) => {
        if (!url)
            return '';
        if (url.startsWith('http') || url.startsWith('data:'))
            return url;
        const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
        return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
    };
    const [historyDateFilter, setHistoryDateFilter] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({ type: 'PASSPORT', name: '', url: '' });
    const [fileLoading, setFileLoading] = useState(false);
    const [dynamicDocTypes, setDynamicDocTypes] = useState([]);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Size check (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size too large. Maximum allowed size is 5MB.');
            return;
        }
        const reader = new FileReader();
        setFileLoading(true);
        reader.onload = (event) => {
            const result = event.target?.result;
            setUploadData(prev => ({ ...prev, url: result }));
            // Set name to filename if name is empty
            if (!uploadData.name) {
                setUploadData(prev => ({ ...prev, name: file.name.split('.')[0] }));
            }
            setFileLoading(false);
        };
        reader.onerror = () => {
            alert('Failed to read file');
            setFileLoading(false);
        };
        reader.readAsDataURL(file);
    };
    useEffect(() => {
        const fetchClinicDetails = async () => {
            try {
                const res = await clinicService.getClinicDetails();
                const clinicData = res.data?.data || res.data;
                const defaultTypes = ['PASSPORT', 'ID_CARD', 'REPORT', 'OTHER'];
                const customTypes = Array.isArray(clinicData?.documentTypes) ? clinicData.documentTypes : [];
                // Merge defaults with custom types and remove duplicates
                const combinedTypes = Array.from(new Set([...defaultTypes, ...customTypes]));
                setDynamicDocTypes(combinedTypes);
                // Set initial type if not set
                if (!uploadData.type || !combinedTypes.includes(uploadData.type)) {
                    setUploadData(prev => ({ ...prev, type: combinedTypes[0] }));
                }
            }
            catch (err) {
                console.error('Failed to fetch clinic details for doc types:', err);
                setDynamicDocTypes(['PASSPORT', 'ID_CARD', 'REPORT', 'OTHER']);
            }
        };
        if (isOpen) {
            fetchClinicDetails();
        }
    }, [isOpen]);
    useEffect(() => {
        if (isOpen && patientId) {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const res = await doctorService.getPatientProfile(patientId);
                    setProfile(res.data);
                }
                catch (error) {
                    console.error('Failed to fetch patient profile:', error);
                }
                finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [isOpen, patientId]);
    if (!isOpen)
        return null;
    const generateInvoicePDF = async (invoice) => {
        try {
            const doc = new jsPDF();
            const unicodeFontEnabled = await ensureUnicodeFont(doc);
            // Fetch clinic details for header
            const clinicRes = await clinicService.getClinicDetails();
            const clinic = clinicRes.data || {};
            // Add Header
            await addClinicHeader(doc, clinic, 'Invoice');
            // Set content start Y
            let yPos = 55;
            // Invoice Details Box
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Invoice Details:', 15, yPos);
            yPos += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(`Invoice Number: INV-${invoice.id}`, 15, yPos);
            // Handle date field (could be date or createdAt based on schema/usage)
            const invDate = invoice.date || invoice.createdAt;
            doc.text(`Date: ${new Date(invDate).toLocaleDateString()}`, 120, yPos);
            yPos += 6;
            doc.text(`Patient: ${displayName}`, 15, yPos);
            doc.text(`Status: ${invoice.status}`, 120, yPos);
            yPos += 10;
            // Determine Amount (Handle schema mismatch if needed)
            // Backend schema: amount. Frontend might expect totalAmount.
            const totalAmount = Number(invoice.amount || invoice.totalAmount || 0);
            // Table
            autoTable(doc, {
                startY: yPos,
                head: [['Service/Description', `Amount (${symbol})`]],
                body: [
                    [
                        invoice.service || 'Medical Service',
                        totalAmount.toFixed(2)
                    ]
                ],
                theme: 'grid',
                headStyles: { fillColor: [45, 59, 174], font: unicodeFontEnabled ? 'NotoSans' : 'helvetica' }, // Primary color
                styles: { fontSize: 10, cellPadding: 3, font: unicodeFontEnabled ? 'NotoSans' : 'helvetica' },
            });
            // Get final Y
            const finalY = doc.lastAutoTable.finalY || yPos + 30;
            // Totals
            doc.setFont(unicodeFontEnabled ? 'NotoSans' : 'helvetica', 'bold');
            doc.text(`Total Amount: ${symbol} ${totalAmount.toFixed(2)}`, 140, finalY + 10, { align: 'right' });
            // Derived Paid/Due based on Status
            const isPaid = invoice.status === 'Paid';
            const paidAmt = isPaid ? totalAmount : (Number(invoice.paidAmount) || 0);
            const dueAmt = totalAmount - paidAmt;
            doc.text(`Paid Amount: ${symbol} ${paidAmt.toFixed(2)}`, 140, finalY + 16, { align: 'right' });
            doc.text(`Balance Due: ${symbol} ${dueAmt.toFixed(2)}`, 140, finalY + 22, { align: 'right' });
            // Footer
            doc.setFont(unicodeFontEnabled ? 'NotoSans' : 'helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('Thank you for your business.', 15, finalY + 35);
            doc.save(`Invoice-${invoice.id}.pdf`);
        }
        catch (error) {
            console.error('Failed to generate invoice PDF:', error);
            alert('Failed to generate invoice PDF');
        }
    };
    // Filter templates to show as tabs - only those that have at least one record for this patient
    // OR show all clinic themes? User said "based on the custom forms created by the clinic".
    // Let's show all published clinic templates.
    const clinicTemplates = formTemplates || [];
    return (<div className="profile-modal-overlay">
            <div className="profile-modal-container fade-in">
                <div className="profile-modal-sidebar">
                    <div className="profile-header-brief">
                        <div className="profile-avatar-large">
                            {displayName.charAt(0)}
                        </div>
                        <h2>{displayName}</h2>
                        <p>Patient ID: P-{patientId}</p>
                    </div>

                    <nav className="profile-nav">
                        <button className={`profile-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                            <FiActivity /> <span>All Assessments</span>
                        </button>

                        <button className={`profile-nav-item ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}>
                            <FiCalendar /> <span>Visits & Bookings</span>
                        </button>

                        <button className={`profile-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
                            <FiShoppingBag /> <span>Medicines</span>
                        </button>

                        {/* Dynamic Template Tabs */}
                        {clinicTemplates.map((template) => (<button key={template.id} className={`profile-nav-item ${activeTab === `template-${template.id}` ? 'active' : ''}`} onClick={() => setActiveTab(`template-${template.id}`)}>
                                <FiFileText /> <span>{template.name}</span>
                            </button>))}

                        <div className="nav-divider" style={{ margin: '10px 0', borderTop: '1px solid #e2e8f0' }}></div>

                        <button className={`profile-nav-item ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
                            <FiFileText /> <span>Lab & Radiology</span>
                        </button>
                        <button className={`profile-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                            <FiFile /> <span>Medical Reports</span>
                        </button>
                        <button className={`profile-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                            <FiCreditCard /> <span>Invoices & Billing</span>
                        </button>
                        <button className={`profile-nav-item ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                            <FiUser /> <span>Personal Info</span>
                        </button>
                        <button className={`profile-nav-item ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
                            <FiFile /> <span>Documents</span>
                        </button>
                    </nav>

                    <div className="profile-sidebar-footer">
                        <button className="btn-close-profile" onClick={onClose}>
                            <FiX /> Close File
                        </button>
                    </div>
                </div>

                <div className="profile-modal-content">
                    {loading ? (<div className="profile-loading">
                            <div className="spinner"></div>
                            <p>Loading Patient File...</p>
                        </div>) : (<div className="profile-content-scroll">
                            {/* Combined History or Multi-template filter */}
                            {(activeTab === 'history' || activeTab.startsWith('template-')) && (<div className="profile-tab-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                        <h3 style={{ margin: 0 }}>
                                            {activeTab === 'history'
                    ? 'Clinical Assessments'
                    : clinicTemplates.find((t) => `template-${t.id}` === activeTab)?.name + ' History'}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FiCalendar style={{ color: '#64748b' }}/>
                                            <input type="date" className="form-control" style={{ padding: '0.4rem 0.8rem', width: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} value={historyDateFilter} onChange={(e) => setHistoryDateFilter(e.target.value)} max={new Date().toISOString().split('T')[0]}/>
                                            {historyDateFilter && (<button onClick={() => setHistoryDateFilter('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.4rem' }} title="Clear Date Filter">
                                                    <FiX size={18}/>
                                                </button>)}
                                        </div>
                                    </div>
                                    {profile?.medicalRecords?.length > 0 ? (<div className="timeline">
                                            {profile.medicalRecords
                        .filter((record) => {
                        let keep = true;
                        if (activeTab !== 'history') {
                            const targetTemplateId = Number(activeTab.split('-')[1]);
                            if (record.templateId !== targetTemplateId)
                                keep = false;
                        }
                        if (historyDateFilter) {
                            const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
                            if (recordDate !== historyDateFilter)
                                keep = false;
                        }
                        return keep;
                    })
                        .map((record) => (<div key={record.id} className="timeline-item">
                                                        <div className="timeline-date">{new Date(record.createdAt).toLocaleDateString()}</div>
                                                        <div className="timeline-box">
                                                            <div className="timeline-header">
                                                                <h4>{record.formtemplate?.name || record.type}</h4>
                                                                <span className="badge-completed">Completed</span>
                                                            </div>
                                                            <div className="timeline-body">
                                                                <p><strong>Diagnosis:</strong> {record.data?.diagnosis || 'N/A'}</p>
                                                                {record.data?.advice && <p><strong>Advice:</strong> {record.data.advice}</p>}

                                                                {/* Display form specific fields if it's a template record */}
                                                                {record.templateId && record.data && (<div className="record-details-mini" style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                                                                        {Object.keys(record.data)
                                .filter(k => !['diagnosis', 'advice', 'templateId', 'patientId', 'ordersSnapshot', 'followUpDate'].includes(k))
                                .map(key => {
                                // Resolve Label
                                let label = key;
                                // Try to find template in clinicTemplates
                                const template = clinicTemplates.find((t) => t.id === record.templateId);
                                if (template && template.fields) {
                                    try {
                                        const fields = Array.isArray(template.fields) ? template.fields : [];
                                        const field = fields.find((f) => f.id === key);
                                        if (field && field.label)
                                            label = field.label;
                                    }
                                    catch (e) { }
                                }
                                // Get Value
                                const val = record.data[key];
                                if (!val || val === 'null' || val === 'undefined' || (Array.isArray(val) && val.length === 0))
                                    return null;
                                return (<div key={key} className="detail-row">
                                                                                        <span style={{ color: '#64748b' }}>{label.charAt(0).toUpperCase() + label.slice(1)}: </span>
                                                                                        <span>{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                                                                                    </div>);
                            })}
                                                                    </div>)}

                                                                {record.formtemplate?.name && activeTab === 'history' && (<p className="template-tag">Form: {record.formtemplate.name}</p>)}
                                                            </div>
                                                        </div>
                                                    </div>))}
                                            {profile.medicalRecords.filter((record) => {
                        let keep = true;
                        if (activeTab !== 'history') {
                            const targetTemplateId = Number(activeTab.split('-')[1]);
                            if (record.templateId !== targetTemplateId)
                                keep = false;
                        }
                        if (historyDateFilter) {
                            const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
                            if (recordDate !== historyDateFilter)
                                keep = false;
                        }
                        return keep;
                    }).length === 0 && (<div className="empty-profile-state" style={{ padding: '3rem 0' }}>
                                                        <FiClock />
                                                        <p>No records found matching this criteria.</p>
                                                    </div>)}
                                        </div>) : (<div className="empty-profile-state">
                                            <FiClock />
                                            <p>No previous medical records found.</p>
                                        </div>)}
                                </div>)}

                            {activeTab === 'visits' && (<div className="profile-tab-content">
                                    <h3>Appointment & Visit History</h3>
                                    {profile?.appointments?.length > 0 ? (<div className="timeline">
                                            {profile.appointments.map((apt) => (<div key={apt.id} className="timeline-item">
                                                    <div className="timeline-date">
                                                        {new Date(apt.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="timeline-box">
                                                        <div className="timeline-header">
                                                            <h4>{apt.serviceType || 'Consultation'}</h4>
                                                            <span className={`status-pill ${apt.status.toLowerCase()}`}>{apt.status}</span>
                                                        </div>
                                                        <div className="timeline-body">
                                                            <p><strong>Time:</strong> {apt.startTime} - {apt.endTime}</p>
                                                            {apt.reason && <p><strong>Reason:</strong> {apt.reason}</p>}
                                                            {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                                                        </div>
                                                    </div>
                                                </div>))}
                                        </div>) : (<div className="empty-profile-state">
                                            <FiCalendar />
                                            <p>No appointment records found.</p>
                                        </div>)}
                                </div>)}

                            {activeTab === 'prescriptions' && (<div className="profile-tab-content">
                                    <h3>Medications & Prescriptions</h3>
                                    {(() => {
                    // Collect all medicines from various sources
                    const allMedicines = [];
                    profile?.medicalRecords?.forEach((record) => {
                        const data = typeof record.data === 'string' && record.data.startsWith('{') ? JSON.parse(record.data) : (record.data || {});
                        const snapshot = data.ordersSnapshot || record.data?.ordersSnapshot;
                        if (Array.isArray(snapshot)) {
                            snapshot.filter((o) => o.type === 'PHARMACY' || o.type === 'MEDICINE').forEach((med) => {
                                allMedicines.push({
                                    ...med,
                                    date: record.createdAt,
                                    source: 'Assessment'
                                });
                            });
                        }
                    });
                    // 2. From service orders (legacy or direct pharmacy orders)
                    profile?.serviceOrders?.filter((o) => o.type === 'PHARMACY').forEach((order) => {
                        // Handle parsed result
                        const items = order.result?.items || [];
                        if (items.length > 0) {
                            items.forEach((item) => {
                                allMedicines.push({
                                    testName: item.medicineName || item.name,
                                    quantity: item.quantity,
                                    details: order.result?.notes || '',
                                    date: order.createdAt,
                                    source: 'Service Order'
                                });
                            });
                        }
                        else {
                            allMedicines.push({
                                testName: order.testName,
                                date: order.createdAt,
                                source: 'Service Order'
                            });
                        }
                    });
                    if (allMedicines.length > 0) {
                        // Deduplicate and sort
                        return (<div className="results-list">
                                                    {allMedicines
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((med, idx) => (<div key={idx} className="prescription-card-modern">
                                                                <div className="card-header-pres">
                                                                    <FiShoppingBag />
                                                                    <span>{med.source} – {new Date(med.date).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="card-body-pres">
                                                                    <div className="med-item-row">
                                                                        <div className="med-name">{med.testName || med.name}</div>
                                                                        <div className="med-dosage">
                                                                            {med.quantity ? `Qty: ${med.quantity}` : ''}
                                                                            {med.unit ? ` ${med.unit}` : ''}
                                                                        </div>
                                                                        {med.details && <div className="med-instruction">{med.details}</div>}
                                                                    </div>
                                                                </div>
                                                            </div>))}
                                                </div>);
                    }
                    return (<div className="empty-profile-state">
                                                <FiShoppingBag />
                                                <p>No prescription history found.</p>
                                            </div>);
                })()}
                                </div>)}

                            {activeTab === 'results' && (<div className="profile-tab-content">
                                    <h3>Laboratory & Imaging Results</h3>
                                    {profile?.serviceOrders?.length > 0 ? (<div className="results-list">
                                            {profile.serviceOrders.map((order) => (<div key={order.id} className="result-card">
                                                    <div className="result-card-header">
                                                        <div className={`result-type ${(order.type || '').toLowerCase()}`}>
                                                            {order.type || 'Unknown'}
                                                        </div>
                                                        <span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase()}`}>
                                                            {order.testStatus || order.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="result-card-body">
                                                        <h4>{order.testName}</h4>
                                                        <p className="result-date">Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>

                                                        {(order.testStatus === 'Published' || order.testStatus === 'Result Uploaded' || order.status === 'Completed') ? (<div className="result-findings mt-md">
                                                                <strong>Findings:</strong>
                                                                <p style={{ whiteSpace: 'pre-wrap' }}>
                                                                    {typeof order.result === 'object' ? (order.result.findings || order.result.result || 'View attached report') : (order.result || 'View attached report')}
                                                                </p>
                                                                {(order.result?.reportUrl || order.reportUrl) && (<a href={order.result?.reportUrl || order.reportUrl} target="_blank" rel="noreferrer" className="btn-view-report mt-sm">
                                                                        <FiDownload /> View PDF Report
                                                                    </a>)}
                                                            </div>) : (<p className="pending-note">Result is still pending from the department.</p>)}
                                                    </div>
                                                </div>))}

                                            {/* Show external results linked to service orders if any */}
                                            {profile.documents?.filter((d) => d.type === 'OUTSIDE_LAB' || d.type === 'OUTSIDE_RAD').map((doc) => (<div key={doc.id} className="result-card external">
                                                    <div className="result-card-header">
                                                        <div className="result-type external">EXTERNAL</div>
                                                        <span className="status-pill completed">Uploaded</span>
                                                    </div>
                                                    <div className="result-card-body">
                                                        <h4>{doc.name}</h4>
                                                        <p className="result-date">Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                        <div className="result-findings mt-md">
                                                            <a href={doc.url} target="_blank" rel="noreferrer" className="btn-view-report">
                                                                <FiDownload /> View External Document
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>))}
                                        </div>) : (<div className="empty-profile-state">
                                            <FiFileText />
                                            <p>No lab or radiology orders found.</p>
                                        </div>)}
                                </div>)}

                            {activeTab === 'reports' && (<div className="profile-tab-content">
                                    <h3>Medical Reports & Official Documents</h3>
                                    {(profile?.medical_reports?.length > 0 || profile.documents?.filter((d) => d.type === 'REPORT' || (d.isClinical && d.type?.toLowerCase().includes('report'))).length > 0) ? (<div className="timeline">
                                            {/* New Medical Reports from Separate Table */}
                                            {profile.medical_reports?.map((report) => (<div key={`report-${report.id}`} className="timeline-item">
                                                    <div className="timeline-date">{new Date(report.reportDate).toLocaleDateString()}</div>
                                                    <div className="timeline-box">
                                                        <div className="timeline-header">
                                                            <h4>{report.template?.name || 'Medical Report'}</h4>
                                                            <FiCheckCircle color="#10b981"/>
                                                        </div>
                                                        <div className="timeline-body">
                                                            <p>{report.diagnosisSummary || 'Official medical documentation'}</p>
                                                            <div className="mt-sm" style={{ display: 'flex', gap: '8px' }}>
                                                                <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/doctor/medical-report/${report.id}`, '_blank')}>
                                                                    <FiEye /> View Full
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>))}

                                            {/* Legacy/Uploaded Reports & Clinical Reports */}
                                            {profile.documents
                        .filter((d) => d.type === 'REPORT' || (d.isClinical && d.type?.toLowerCase().includes('report')))
                        .map((doc) => (<div key={`doc-${doc.id}`} className="timeline-item">
                                                        <div className="timeline-date">{new Date(doc.createdAt).toLocaleDateString()}</div>
                                                        <div className="timeline-box">
                                                            <div className="timeline-header" style={{ alignItems: 'center' }}>
                                                                <h4 style={{ margin: 0 }}>{doc.name}</h4>
                                                                <span className="badge-external" style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>UPLOADED</span>
                                                            </div>
                                                            <div className="timeline-body" style={{ marginTop: '8px' }}>
                                                                <a href={getDocUrl(doc.url)} target="_blank" rel="noreferrer" className="btn-view-report">
                                                                    <FiDownload /> Download Report
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>))}
                                        </div>) : (<div className="empty-profile-state">
                                            <FiFile />
                                            <p>No medical reports found.</p>
                                        </div>)}
                                </div>)}

                            {activeTab === 'billing' && (<div className="profile-tab-content">
                                    <h3>Billing & Invoices Summary</h3>
                                    {profile?.invoices?.length > 0 ? (<div className="billing-summary-grid">
                                            <div className="billing-stats-row">
                                                <div className="stat-card-mini">
                                                    <label>Total Invoiced</label>
                                                    <div className="value">{formatMoney(profile.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0))}</div>
                                                </div>
                                                <div className="stat-card-mini">
                                                    <label>Total Paid</label>
                                                    <div className="value paid">{formatMoney(profile.invoices.reduce((sum, inv) => sum + (inv.status === 'Paid' ? Number(inv.totalAmount || inv.amount || 0) : 0), 0))}</div>
                                                </div>
                                                <div className="stat-card-mini">
                                                    <label>Outstanding</label>
                                                    <div className="value pending">{formatMoney(profile.invoices.reduce((sum, inv) => sum + (inv.status !== 'Paid' ? Number(inv.totalAmount || inv.amount || 0) : 0), 0))}</div>
                                                </div>
                                            </div>

                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Invoice #</th>
                                                        <th>Status</th>
                                                        <th>Total</th>
                                                        <th>Paid</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {profile.invoices.map((inv) => (<tr key={inv.id}>
                                                            <td>{new Date(inv.date || inv.createdAt).toLocaleDateString()}</td>
                                                            <td>INV-{inv.id}</td>
                                                            <td>
                                                                <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                            <td>{formatMoney(Number(inv.totalAmount || inv.amount || 0))}</td>
                                                            <td>{inv.status === 'Paid' ? formatMoney(Number(inv.totalAmount || inv.amount || 0)) : formatMoney(0)}</td>
                                                            <td>
                                                                <button className="btn-icon" onClick={() => generateInvoicePDF(inv)} title="Download PDF">
                                                                    <FiDownload />
                                                                </button>
                                                            </td>
                                                        </tr>))}
                                                </tbody>
                                            </table>
                                        </div>) : (<div className="empty-profile-state">
                                            <FiCreditCard />
                                            <p>No billing records found.</p>
                                        </div>)}
                                </div>)}

                            {activeTab === 'info' && (<div className="profile-tab-content">
                                    <h3>Patient Details</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label><FiUser /> Full Name</label>
                                            <p>{profile.patient.name}</p>
                                        </div>
                                        <div className="info-item">
                                            <label><FiMail /> Email</label>
                                            <p>{profile.patient.email || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label><FiPhone /> Contact</label>
                                            <p>{profile.patient.phone || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label><FiCalendar /> Age / Gender</label>
                                            <p>{profile.patient.age || '35'} Y / {profile.patient.gender || 'Male'}</p>
                                        </div>
                                        {profile.patient.location && (<div className="info-item">
                                                <label>Address</label>
                                                <p>{profile.patient.location}</p>
                                            </div>)}
                                    </div>
                                </div>)}

                            {activeTab === 'documents' && (<div className="profile-tab-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3>Patient Documents</h3>
                                        <button className="btn-primary" onClick={() => setShowUploadModal(true)} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--primary-color)',
                    transform: 'none',
                    boxShadow: 'none'
                }}>
                                            <FiUpload /> Upload Document
                                        </button>
                                    </div>

                                    {profile?.documents?.length > 0 ? (<div>
                                            {/* Passport Documents */}
                                            {profile.documents.filter((d) => d.type === 'PASSPORT').length > 0 && (<div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>📘 Passport</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d) => d.type === 'PASSPORT').map((doc) => (<div key={doc.id} className="document-card">
                                                                <div className="document-icon">📘</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a href={getDocUrl(doc.url)} target="_blank" rel="noreferrer" className="btn-download">
                                                                    <FiDownload />
                                                                </a>
                                                            </div>))}
                                                    </div>
                                                </div>)}

                                            {/* ID Card Documents */}
                                            {profile.documents.filter((d) => d.type === 'ID_CARD').length > 0 && (<div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>🪪 ID Card</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d) => d.type === 'ID_CARD').map((doc) => (<div key={doc.id} className="document-card">
                                                                <div className="document-icon">🪪</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a href={getDocUrl(doc.url)} target="_blank" rel="noreferrer" className="btn-download">
                                                                    <FiDownload />
                                                                </a>
                                                            </div>))}
                                                    </div>
                                                </div>)}

                                            {/* Clinical / External Clinical Documents */}
                                            {profile.documents.filter((d) => d.isClinical).length > 0 && (<div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>🗂️ Clinical Records</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d) => d.isClinical).map((doc) => (<div key={doc.id} className="document-card">
                                                                <div className="document-icon">🗂️</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                {doc.url ? (<a href={getDocUrl(doc.url)} target="_blank" rel="noreferrer" className="btn-download">
                                                                        <FiDownload />
                                                                    </a>) : (<span style={{ fontSize: '12px', color: '#94a3b8' }}>No link</span>)}
                                                            </div>))}
                                                    </div>
                                                </div>)}

                                            {/* Report Documents */}
                                            {profile.documents.filter((d) => !d.isClinical && d.type === 'REPORT').length > 0 && (<div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>📋 Reports</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d) => !d.isClinical && d.type === 'REPORT').map((doc) => (<div key={doc.id} className="document-card">
                                                                <div className="document-icon">📋</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a href={getDocUrl(doc.url)} target="_blank" rel="noreferrer" className="btn-download">
                                                                    <FiDownload />
                                                                </a>
                                                            </div>))}
                                                    </div>
                                                </div>)}

                                            {/* Other & Mixed Documents */}
                                            {profile.documents.filter((d) => !d.isClinical && !['PASSPORT', 'ID_CARD', 'REPORT'].includes(d.type)).length > 0 && (<div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>📎 Other Attachments</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d) => !d.isClinical && !['PASSPORT', 'ID_CARD', 'REPORT'].includes(d.type)).map((doc) => (<div key={doc.id} className="document-card">
                                                                <div className="document-icon">📎</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {doc.type !== 'OTHER' ? `${doc.type} • ` : ''}{new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                {doc.url ? (<a href={doc.url} target="_blank" rel="noreferrer" className="btn-download">
                                                                        <FiDownload />
                                                                    </a>) : (<span style={{ fontSize: '12px', color: '#94a3b8' }}>No link</span>)}
                                                            </div>))}
                                                    </div>
                                                </div>)}
                                        </div>) : (<div className="empty-profile-state">
                                            <FiFile />
                                            <p>No documents uploaded yet.</p>
                                        </div>)}
                                </div>)}
                        </div>)}
                </div>
            </div>

            {/* Upload Document Modal */}
            {showUploadModal && (<div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Upload Document</h3>
                            <button onClick={() => setShowUploadModal(false)} className="btn-close">
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Document Type</label>
                                <select value={uploadData.type} onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })} className="form-control">
                                    {dynamicDocTypes.map(type => (<option key={type} value={type}>
                                            {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1).toLowerCase()}
                                        </option>))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Document Name</label>
                                <input type="text" value={uploadData.name} onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })} placeholder="e.g., Passport Copy" className="form-control"/>
                            </div>
                            <div className="form-group">
                                <label>Attach Document (PDF/Image) *</label>
                                <div className="file-input-wrapper" style={{ position: 'relative' }}>
                                    <input type="file" accept=".pdf,image/*" onChange={handleFileChange} style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #e2e8f0',
                borderRadius: '10px',
                background: '#f8fafc',
                cursor: 'pointer'
            }}/>
                                </div>
                                {fileLoading && <small style={{ color: 'var(--primary-color)' }}>Loading file...</small>}
                                {uploadData.url && !fileLoading && <small style={{ color: '#10b981' }}>File attached successfully!</small>}
                                <small style={{ display: 'block', color: '#666', fontSize: '12px', marginTop: '8px' }}>
                                    Select a PDF or Image file from your device (Max 5MB)
                                </small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-save" style={{
                padding: '0.75rem 1.75rem',
                background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: (fileLoading || !uploadData.url || !uploadData.name) ? 'not-allowed' : 'pointer',
                opacity: (fileLoading || !uploadData.url || !uploadData.name) ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(45, 59, 174, 0.25)',
                transition: 'all 0.3s'
            }} disabled={fileLoading || !uploadData.url || !uploadData.name} onClick={async () => {
                try {
                    await doctorService.uploadPatientDocument(patientId, uploadData);
                    setShowUploadModal(false);
                    setUploadData({ type: 'PASSPORT', name: '', url: '' });
                    // Refresh profile
                    const res = await doctorService.getPatientProfile(patientId);
                    setProfile(res.data);
                }
                catch (error) {
                    console.error('Failed to upload document:', error);
                    alert('Failed to upload document');
                }
            }}>
                                {fileLoading ? 'Processing...' : 'Upload Document'}
                            </button>
                        </div>
                    </div>
                </div>)}
        </div>);
};
export default PatientProfileModal;
