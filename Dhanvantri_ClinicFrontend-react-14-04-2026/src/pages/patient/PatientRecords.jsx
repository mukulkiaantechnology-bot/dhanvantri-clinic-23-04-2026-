import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { FiSearch, FiPrinter, FiEye, FiActivity, FiTrash2, FiDownload, FiClipboard, FiFile, FiCheckCircle } from 'react-icons/fi';
import Modal from '../../components/Modal';
import { jsPDF } from 'jspdf';
import { addClinicHeader } from '../../utils/pdfUtils';
import { API_URL } from '../../config/config';
import '../SharedDashboard.css';
const PatientRecords = () => {
    const { user, selectedClinic } = useAuth();
    const [records, setRecords] = useState({
        assessments: [],
        serviceOrders: [],
        prescriptions: [],
        documents: [],
        medical_reports: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    // Detailed View Logic
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const fetchRecords = async () => {
        try {
            const [medRes, docRes] = await Promise.all([
                patientService.getMyMedicalRecords(),
                patientService.getMyDocuments()
            ]);
            const medData = medRes.data?.data || medRes.data || { assessments: [], serviceOrders: [], prescriptions: [], medical_reports: [], documents: [] };
            const docData = docRes.data?.data ?? (Array.isArray(docRes.data) ? docRes.data : []);
            setRecords({
                ...medData,
                external_documents: docData
            });
        }
        catch (error) {
            console.error('Failed to fetch medical records', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (user)
            fetchRecords();
    }, [user]);
    const allRecords = [
        ...(records.assessments || []).map((a) => ({
            ...a,
            sourceTable: 'medicalrecord',
            displayType: 'Assessment',
            date: a.visitDate || a.createdAt,
            unifiedType: 'assessment',
            testName: a.formtemplate?.name || 'Medical Consultation'
        })),
        ...(records.serviceOrders || []).map((s) => ({
            ...s,
            sourceTable: 'service_order',
            displayType: s.type,
            date: s.createdAt,
            unifiedType: 'order',
            testName: s.testName || 'Medical Test'
        })),
        ...(records.prescriptions || []).map((p) => {
            const data = p.data && typeof p.data === 'object' ? p.data : {};
            const meds = data.ordersSnapshot?.filter((o) => o.type === 'PHARMACY').map((m) => m.testName).join(', ');
            return {
                ...p,
                sourceTable: 'medicalrecord',
                displayType: 'Prescription',
                date: p.createdAt,
                unifiedType: 'prescription',
                testName: meds || data.diagnosis || 'Medication Prescription',
                prescriptionData: data
            };
        }),
        ...(records.medical_reports || []).map((r) => ({
            ...r,
            sourceTable: 'medical_report',
            displayType: r.template?.name || 'Medical Report',
            date: r.reportDate || r.createdAt,
            unifiedType: 'report',
            testName: r.diagnosisSummary || 'Official Medical Report',
            result: r.dynamicData
        })),
        ...(records.documents || []).map((d) => {
            const data = (d.data && typeof d.data === 'object') ? d.data :
                (typeof d.data === 'string' && d.data.startsWith('{')) ? JSON.parse(d.data) : {};
            const isReport = d.type === 'REPORT' || d.type === 'MEDICAL_REPORT';
            return {
                ...d,
                sourceTable: 'medicalrecord',
                displayType: d.type || 'Document',
                date: d.createdAt,
                unifiedType: isReport ? 'report' : 'document',
                testName: d.name || data.fileName || d.type || 'Patient Document',
                result: d.result || d.url || (typeof d.data === 'string' ? d.data : null)
            };
        }),
        // external_documents: patient_document table (uploaded via doctor/document controller)
        ...(records.external_documents || []).map((d) => ({
            ...d,
            sourceTable: 'patient_document',
            displayType: d.type || 'Document',
            date: d.createdAt,
            unifiedType: d.type === 'REPORT' ? 'report' : 'document',
            testName: d.name || 'Patient Document',
            result: d.url
        }))
    ]
        // Deduplicate: same id + sourceTable = same record (protects against any future double-fetch)
        .filter((record, index, self) => index === self.findIndex(r => r.id === record.id && r.sourceTable === record.sourceTable))
        .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });
    const filteredRecords = allRecords.filter(item => {
        const search = searchTerm.toLowerCase();
        const testName = (item.testName || '').toLowerCase();
        const displayType = (item.displayType || '').toLowerCase();
        const templateName = (item.formtemplate?.name || '').toLowerCase();
        const matchesSearch = testName.includes(search) ||
            displayType.includes(search) ||
            templateName.includes(search);
        const matchesType = filterType === 'all' || item.unifiedType === filterType;
        return matchesSearch && matchesType;
    });
    const openView = (record) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };
    const handlePrint = async () => {
        if (!selectedRecord)
            return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        // --- CLINIC HEADER ---
        const startY = await addClinicHeader(doc, selectedRecord.clinic || selectedClinic, `${selectedRecord.displayType?.toUpperCase() || 'MEDICAL'} REPORT`);
        let yPos = startY;
        // --- REPORT TITLE BAR ---
        doc.setFillColor(30, 27, 75);
        doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text((selectedRecord.displayType?.toUpperCase() || 'DOCUMENT') + ' REPORT', pageWidth / 2, yPos + 7, { align: 'center' });
        yPos += 16;
        // --- PATIENT DETAILS ---
        doc.setFontSize(10);
        doc.setTextColor(30, 27, 75);
        doc.setFont('helvetica', 'bold');
        doc.text('PATIENT INFORMATION', margin, yPos);
        yPos += 2;
        doc.setDrawColor(30, 27, 75);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        const patientFields = [
            ['Patient Name', user?.name || 'N/A'],
            ['Patient ID', `#${user?.id || 'N/A'}`],
            ['Email', user?.email || 'N/A'],
            ['Phone', user?.phone || 'N/A'],
            ['Date of Record', selectedRecord.date ? new Date(selectedRecord.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'],
            ['Clinic', selectedRecord.clinic?.name || selectedClinic?.name || 'N/A'],
        ];
        doc.setFontSize(9);
        patientFields.forEach(([label, value], idx) => {
            const colXPos = idx % 2 === 0 ? margin : pageWidth / 2;
            if (idx % 2 === 0 && idx > 0)
                yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 80, 80);
            doc.text(`${label}:`, colXPos, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            doc.text(String(value), colXPos + 32, yPos);
        });
        yPos += 12;
        // --- RECORD INFORMATION ---
        doc.setFontSize(10);
        doc.setTextColor(30, 27, 75);
        doc.setFont('helvetica', 'bold');
        doc.text('RECORD INFORMATION', margin, yPos);
        yPos += 2;
        doc.setDrawColor(30, 27, 75);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        const recordFields = [
            ['Record Type', selectedRecord.displayType || 'Document'],
            ['Status', selectedRecord.testStatus || 'Official Document'],
            ['Created By', selectedRecord.doctor?.name || selectedRecord.provider?.name || 'Authorized Staff'],
            ['File / Subject', selectedRecord.testName || selectedRecord.fileName || 'Medical Record'],
        ];
        doc.setFontSize(9);
        recordFields.forEach(([label, value], idx) => {
            const colXPos = idx % 2 === 0 ? margin : pageWidth / 2;
            if (idx % 2 === 0 && idx > 0)
                yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 80, 80);
            doc.text(`${label}:`, colXPos, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const splitVal = doc.splitTextToSize(String(value), (pageWidth / 2) - 35);
            doc.text(splitVal, colXPos + 32, yPos);
        });
        yPos += 14;
        // --- MEDICAL FINDINGS & RESULTS ---
        doc.setFontSize(10);
        doc.setTextColor(30, 27, 75);
        doc.setFont('helvetica', 'bold');
        doc.text('MEDICAL FINDINGS & RESULTS', margin, yPos);
        yPos += 2;
        doc.setDrawColor(30, 27, 75);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
        // Determine result content
        const result = selectedRecord.result;
        let parsed = null;
        try {
            if (result && typeof result === 'string' && result.trim().startsWith('{'))
                parsed = JSON.parse(result);
            else if (result && typeof result === 'object')
                parsed = result;
        }
        catch (e) {
            parsed = null;
        }
        const looksLikeFile = (str) => {
            if (!str || typeof str !== 'string')
                return false;
            const clean = str.split('?')[0].toLowerCase();
            return clean.endsWith('.pdf') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp') || str.startsWith('data:');
        };
        const rawResult = (typeof result === 'string' && result) ? result : '';
        const fileUrl = selectedRecord.fileUrl || selectedRecord.reportUrl || selectedRecord.filePath || selectedRecord.url ||
            (looksLikeFile(rawResult) ? rawResult : null) ||
            selectedRecord.dynamicData?.fileUrl || selectedRecord.dynamicData?.url ||
            parsed?.fileUrl || parsed?.filePath || parsed?.url;
        // ── ASSESSMENT: render formtemplate fields + data ──
        if (selectedRecord.unifiedType === 'assessment') {
            const rawFields = selectedRecord.formtemplate?.fields;
            let templateFields = [];
            if (Array.isArray(rawFields))
                templateFields = rawFields;
            else if (typeof rawFields === 'string') {
                try {
                    templateFields = JSON.parse(rawFields);
                }
                catch (e) {
                    templateFields = [];
                }
            }
            const formData = selectedRecord.data && typeof selectedRecord.data === 'object'
                ? selectedRecord.data
                : (() => { try {
                    return typeof selectedRecord.data === 'string' ? JSON.parse(selectedRecord.data) : {};
                }
                catch (e) {
                    return {};
                } })();
            doc.setFontSize(9);
            let hasContent = false;
            if (templateFields.length > 0) {
                templateFields.forEach((field) => {
                    const value = formData[field.id] ?? formData[field.label] ?? formData[field.name];
                    if (value === undefined || value === null || value === '')
                        return;
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                    hasContent = true;
                    // Left accent bar
                    doc.setFillColor(99, 102, 241); // indigo
                    doc.rect(margin, yPos - 4, 2, 12, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(99, 102, 241);
                    doc.text(String(field.label).toUpperCase(), margin + 5, yPos);
                    yPos += 5;
                    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 30);
                    const lines = doc.splitTextToSize(displayValue, pageWidth - margin * 2 - 5);
                    doc.text(lines, margin + 5, yPos);
                    yPos += lines.length * 5 + 6;
                });
            }
            // Key-value fallback if no template fields but raw form data exists
            if (!hasContent) {
                const entries = Object.entries(formData).filter(([k]) => !['id', 'clinicId', 'patientId'].includes(k));
                entries.forEach(([key, value]) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(60, 60, 60);
                    doc.text(key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase() + ':', margin, yPos);
                    yPos += 5;
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 30);
                    const lines = doc.splitTextToSize(String(value), pageWidth - margin * 2);
                    doc.text(lines, margin, yPos);
                    yPos += lines.length * 5 + 4;
                    hasContent = true;
                });
            }
            if (!hasContent) {
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text('Medical consultation record. No detailed form data available.', margin, yPos);
                yPos += 8;
            }
            // ── PRESCRIPTION: render medications table ──
        }
        else if (selectedRecord.unifiedType === 'prescription') {
            const prescData = selectedRecord.prescriptionData || selectedRecord.data || {};
            const meds = (prescData.ordersSnapshot || []).filter((o) => o.type === 'PHARMACY');
            if (prescData.diagnosis) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(146, 64, 14);
                doc.text('Diagnosis:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                const dLines = doc.splitTextToSize(prescData.diagnosis, pageWidth - margin * 2 - 30);
                doc.text(dLines, margin + 25, yPos);
                yPos += dLines.length * 5 + 5;
            }
            if (prescData.notes) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(21, 128, 61);
                doc.text('Doctor Notes:', margin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 30);
                const nLines = doc.splitTextToSize(prescData.notes, pageWidth - margin * 2 - 35);
                doc.text(nLines, margin + 35, yPos);
                yPos += nLines.length * 5 + 5;
            }
            if (meds.length > 0) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 27, 75);
                doc.text('Prescribed Medications:', margin, yPos);
                yPos += 5;
                // Table header
                doc.setFillColor(30, 27, 75);
                doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                const cols = [margin + 1, margin + 55, margin + 90, margin + 115, margin + 140];
                ['Medicine', 'Dosage', 'Frequency', 'Duration', 'Qty'].forEach((h, i) => doc.text(h, cols[i], yPos + 5));
                yPos += 8;
                // Table rows
                meds.forEach((med, i) => {
                    if (yPos > pageHeight - 20) {
                        doc.addPage();
                        yPos = 20;
                    }
                    if (i % 2 === 0) {
                        doc.setFillColor(248, 250, 252);
                        doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
                    }
                    doc.setTextColor(30, 30, 30);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.text(String(med.testName || med.name || 'N/A').substring(0, 20), cols[0], yPos + 5);
                    doc.text(String(med.dosage || '-'), cols[1], yPos + 5);
                    doc.text(String(med.frequency || '-'), cols[2], yPos + 5);
                    doc.text(String(med.duration || '-'), cols[3], yPos + 5);
                    doc.text(String(med.quantity || '-'), cols[4], yPos + 5);
                    yPos += 7;
                });
            }
            // ── ATTACHED FILE ──
        }
        else if (fileUrl && !fileUrl.startsWith('data:')) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            const fileNote = `An original file is attached to this record: ${selectedRecord.testName || fileUrl}`;
            const noteLines = doc.splitTextToSize(fileNote, pageWidth - margin * 2);
            doc.text(noteLines, margin, yPos);
            yPos += noteLines.length * 5 + 4;
            doc.setTextColor(45, 59, 174);
            doc.text('→ See the attached file for full document content.', margin, yPos);
            yPos += 8;
        }
        else if (fileUrl && fileUrl.startsWith('data:application/pdf')) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text('This record contains an embedded PDF document.', margin, yPos);
            yPos += 8;
        }
        else if (fileUrl && fileUrl.startsWith('data:image')) {
            try {
                const imgW = pageWidth - margin * 2;
                const imgH = 70;
                doc.addImage(fileUrl, 'JPEG', margin, yPos, imgW, imgH, undefined, 'FAST');
                yPos += imgH + 6;
            }
            catch (e) {
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                doc.text('Image attachment (could not be embedded in PDF).', margin, yPos);
                yPos += 8;
            }
        }
        else if (parsed && typeof parsed === 'object') {
            const entries = Object.entries(parsed);
            doc.setFontSize(9);
            entries.forEach(([key, value]) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 60);
                doc.text(key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1') + ':', margin, yPos);
                yPos += 5;
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 30);
                const lines = doc.splitTextToSize(String(value), pageWidth - margin * 2);
                doc.text(lines, margin, yPos);
                yPos += lines.length * 5 + 4;
            });
        }
        else if (typeof result === 'string' && result && !result.startsWith('{') && !result.startsWith('data:') && !result.startsWith('http')) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const lines = doc.splitTextToSize(result, pageWidth - margin * 2);
            if (yPos + lines.length * 5 > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(lines, margin, yPos);
            yPos += lines.length * 5 + 6;
        }
        else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text('Official clinical record. Please refer to your healthcare provider for detailed interpretation.', margin, yPos);
            yPos += 8;
        }
        // --- NOTES ---
        if (selectedRecord.notes || selectedRecord.description) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }
            yPos += 4;
            doc.setFontSize(10);
            doc.setTextColor(30, 27, 75);
            doc.setFont('helvetica', 'bold');
            doc.text('DOCTOR NOTES', margin, yPos);
            yPos += 2;
            doc.setDrawColor(30, 27, 75);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            const noteLines = doc.splitTextToSize(selectedRecord.notes || selectedRecord.description, pageWidth - margin * 2);
            doc.text(noteLines, margin, yPos);
            yPos += noteLines.length * 5 + 4;
        }
        // --- FOOTER ---
        const footerY = pageHeight - 20;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text(`Report Generated: ${new Date().toLocaleString()} | ${selectedClinic?.name || 'Dhanwantri Hospital'}`, margin, footerY - 3);
        doc.text('This is a computer-generated document. No physical signature required.', pageWidth - margin, footerY - 3, { align: 'right' });
        // Signature line
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        const sigX = pageWidth - margin - 60;
        doc.line(sigX, footerY + 4, pageWidth - margin, footerY + 4);
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text('Authorized Clinical Staff', sigX + 30, footerY + 9, { align: 'center' });
        // Save the file
        const fileName = `Medical_Report_${(selectedRecord.testName || selectedRecord.displayType || 'Record').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
    };
    const handleDelete = async (record) => {
        if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.'))
            return;
        try {
            await patientService.deleteMyDocument(record.id, record.sourceTable);
            // Full refresh to ensure UI is in sync
            await fetchRecords();
        }
        catch (error) {
            console.error('Failed to delete record', error);
            alert('Failed to delete record. It may be restricted or already removed.');
        }
    };
    return (<div className="p-5 fade-in">
            <div className="page-header no-print">
                <div>
                    <h1>Medical Reports & Records</h1>
                    <p>View your complete health history, lab results, and prescriptions.</p>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="stats-grid no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className={`stat-card clickable ${filterType === 'assessment' ? 'active' : ''}`} onClick={() => setFilterType('assessment')}>
                    <div className="stat-icon purple"><FiActivity /></div>
                    <div className="stat-info">
                        <small>Consultations</small>
                        <h3>{records.assessments?.length || 0}</h3>
                    </div>
                </div>
                <div className={`stat-card clickable ${filterType === 'prescription' ? 'active' : ''}`} onClick={() => setFilterType('prescription')}>
                    <div className="stat-icon orange"><FiClipboard /></div>
                    <div className="stat-info">
                        <small>Prescriptions</small>
                        <h3>{records.prescriptions?.length || 0}</h3>
                    </div>
                </div>
                <div className={`stat-card clickable ${filterType === 'report' ? 'active' : ''}`} onClick={() => setFilterType('report')}>
                    <div className="stat-icon blue"><FiFile /></div>
                    <div className="stat-info">
                        <small>Official Reports</small>
                        <h3>{records.medical_reports?.length || 0}</h3>
                    </div>
                </div>
                <div className={`stat-card clickable ${filterType === 'order' ? 'active' : ''}`} onClick={() => setFilterType('order')}>
                    <div className="stat-icon green"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <small>Lab Results</small>
                        <h3>{records.serviceOrders?.length || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="content-card no-print">
                <div className="card-header no-print" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                        <div className="input-with-icon-simple" style={{ flex: 1 }}>
                            <FiSearch />
                            <input type="text" placeholder="Search records, tests, or visits..." className="form-control" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                        </div>
                        <select className="form-control" style={{ width: '180px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="all">All Records</option>
                            <option value="report">Medical Reports</option>
                            <option value="assessment">Consultations</option>
                            <option value="prescription">Prescriptions</option>
                            <option value="order">Lab & Radiology</option>
                            <option value="document">Uploaded Documents</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description / Item</th>
                                <th>Facility</th>
                                <th>Status</th>
                                <th className="no-print">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={6} className="text-center p-lg">Loading records...</td></tr>) : filteredRecords.length > 0 ? (filteredRecords.map((item, idx) => (<tr key={idx}>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-pill record-badge-${item.unifiedType}`}>
                                                {item.displayType}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {item.unifiedType === 'assessment' ? (item.formtemplate?.name || 'Consultation') : (<div className="flex flex-col">
                                                    <span>{item.testName}</span>
                                                    {item.unifiedType === 'prescription' && item.prescriptionData?.advice && (<small className="text-muted" style={{ fontWeight: 400, fontSize: '0.75rem' }}>
                                                            Advice: {item.prescriptionData.advice.substring(0, 60)}...
                                                        </small>)}
                                                </div>)}
                                        </td>
                                        <td>{item.clinic?.name || 'Dhanwantri Hospital'}</td>
                                        <td>
                                            <span className={`status-pill ${(item.testStatus || item.status || 'Completed').toLowerCase()}`}>
                                                {item.testStatus || item.status || 'Completed'}
                                            </span>
                                        </td>
                                        <td className="no-print">
                                            <div className="flex gap-2">
                                                <button className="btn btn-primary btn-sm btn-with-icon" onClick={() => openView(item)} style={{
                background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem'
            }}>
                                                    <FiEye /> View
                                                </button>
                                                <button className="btn btn-sm btn-with-icon" onClick={() => handleDelete(item)} style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem'
            }}>
                                                    <FiTrash2 /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>))) : (<tr><td colSpan={6} className="text-center p-lg text-muted">No records matching your search.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={selectedRecord?.displayType + " Details"} size="lg">
                {selectedRecord && (<div className="record-details-modal" id="print-container" style={{ padding: '0', background: '#fff', color: '#000', minHeight: '100vh', width: '100%' }}>
                        {/* 1. CLINIC HEADER */}
                        <div style={{ textAlign: 'center', padding: '1.5rem 0', borderBottom: '1.5px solid #000', marginBottom: '1rem' }}>
                            {(selectedRecord.clinic?.logo || selectedClinic?.logo) ? (<img src={(selectedRecord.clinic?.logo || selectedClinic?.logo).startsWith('http')
                    ? (selectedRecord.clinic?.logo || selectedClinic?.logo)
                    : `${API_URL.replace(/\/api$/, '')}${((selectedRecord.clinic?.logo || selectedClinic?.logo) || '').startsWith('/') ? (selectedRecord.clinic?.logo || selectedClinic?.logo) : `/${selectedRecord.clinic?.logo || selectedClinic?.logo}`}`} alt="Clinic Logo" style={{ width: '85px', height: '85px', objectFit: 'contain', marginBottom: '8px' }}/>) : (<div style={{ width: '85px', height: '85px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', fontSize: '32px', fontWeight: 800, margin: '0 auto 8px auto', border: '1px solid #e2e8f0' }}>
                                    {(selectedRecord.clinic?.name || selectedClinic?.name || 'EV').substring(0, 2).toUpperCase()}
                                </div>)}
                            <h1 style={{ margin: '0 0 4px 0', fontSize: '26px', fontWeight: 800 }}>{selectedRecord.clinic?.name || selectedClinic?.name || 'Dhanwantri Hospital'}</h1>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                                {selectedRecord.clinic?.location || selectedClinic?.location || 'Clinical Center'}
                                {(selectedRecord.clinic?.phone || selectedClinic?.phone) && ` | Phone: ${selectedRecord.clinic?.phone || selectedClinic?.phone}`}
                                {(selectedRecord.clinic?.email || selectedClinic?.email) && ` | Email: ${selectedRecord.clinic?.email || selectedClinic?.email}`}
                            </p>
                        </div>

                        {/* 2. REPORT TYPE */}
                        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'underline' }}>
                                {selectedRecord.displayType === 'Radiology' ? 'RADIOLOGY REPORT' : (selectedRecord.displayType === 'Lab' ? 'LABORATORY REPORT' : (selectedRecord.displayType.toUpperCase() + ' REPORT'))}
                            </h2>
                        </div>

                        {/* 3. PATIENT DETAILS */}
                        <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '12px' }}>Patient Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 2rem' }}>
                                <div style={{ fontSize: '14px' }}><strong>Name:</strong> {user?.name || 'N/A'}</div>
                                <div style={{ fontSize: '14px' }}><strong>Patient ID:</strong> #{user?.id || 'N/A'}</div>
                                <div style={{ fontSize: '14px' }}><strong>Date:</strong> {new Date(selectedRecord.date).toLocaleDateString()}</div>
                                <div style={{ fontSize: '14px' }}><strong>Phone:</strong> {user?.phone || 'N/A'}</div>
                                <div style={{ fontSize: '14px' }}><strong>Age / Gender:</strong> {user?.age || 'N/A'} Yrs / {user?.gender || 'N/A'}</div>
                            </div>
                        </div>

                        {/* 4. RECORD & DOCTOR DETAILS */}
                        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '12px' }}>Record Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 2rem' }}>
                                <div style={{ fontSize: '14px' }}><strong>Record Type:</strong> {selectedRecord.displayType}</div>
                                <div style={{ fontSize: '14px' }}><strong>Facility / Clinic:</strong> {selectedRecord.clinic?.name || selectedClinic?.name || 'Dhanwantri Hospital'}</div>
                                <div style={{ fontSize: '14px' }}><strong>Created By:</strong> {selectedRecord.doctor?.name || selectedRecord.provider?.name || 'Authorized Staff'}</div>
                                <div style={{ fontSize: '14px' }}><strong>Uploaded File:</strong> {selectedRecord.fileName || (selectedRecord.result && typeof selectedRecord.result === 'string' && selectedRecord.result.includes('.') ? selectedRecord.result : 'Electronic Record')}</div>
                                <div style={{ fontSize: '14px' }}><strong>Status:</strong> {selectedRecord.testStatus || 'Official Document'}</div>
                            </div>
                            {(selectedRecord.notes || selectedRecord.description) && (<div style={{ marginTop: '12px', fontSize: '14px' }}>
                                    <strong>Description / Notes:</strong>
                                    <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: '#444', lineHeight: '1.4' }}>
                                        {selectedRecord.notes || selectedRecord.description}
                                    </p>
                                </div>)}
                        </div>

                        {/* 5. CLINICAL CONTENT / RESULTS */}
                        <div style={{ padding: '0 1.5rem', marginBottom: '3rem' }}>
                            <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0', marginBottom: '1.5rem', textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, textTransform: 'uppercase' }}>Medical Findings & Results</h3>
                            </div>

                            <div className="results-content">
                                {(() => {
                const result = selectedRecord.result || selectedRecord.data;
                let parsed = null;
                try {
                    if (result && typeof result === 'string' && result.trim().startsWith('{')) {
                        parsed = JSON.parse(result);
                    }
                    else if (result && typeof result === 'object') {
                        parsed = result;
                    }
                }
                catch (e) {
                    parsed = null;
                }
                // Robust URL detection from various record schemas
                const rawResult = (typeof result === 'string' && result) ? result : '';
                const looksLikeFile = (str) => {
                    if (!str || typeof str !== 'string')
                        return false;
                    const clean = str.split('?')[0].toLowerCase().trim();
                    return clean.endsWith('.pdf') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp') || clean.endsWith('.gif') || str.startsWith('data:');
                };
                const fileUrl = selectedRecord.fileUrl ||
                    selectedRecord.reportUrl ||
                    selectedRecord.filePath ||
                    (selectedRecord.url && selectedRecord.url !== selectedRecord.testName ? selectedRecord.url : null) ||
                    (looksLikeFile(rawResult) ? rawResult : null) ||
                    selectedRecord.dynamicData?.fileUrl ||
                    selectedRecord.dynamicData?.url ||
                    selectedRecord.dynamicData?.reportUrl ||
                    parsed?.fileData ||
                    parsed?.fileUrl ||
                    parsed?.filePath ||
                    parsed?.reportUrl ||
                    parsed?.url ||
                    // If the record name itself is a filename (patient_document pattern), derive URL from name
                    (looksLikeFile(selectedRecord.testName || '') ? selectedRecord.testName : null) ||
                    (looksLikeFile(selectedRecord.name || '') ? selectedRecord.name : null);
                const resolveDocUrl = (url) => {
                    if (!url)
                        return '';
                    if (url.startsWith('http') || url.startsWith('data:'))
                        return url;
                    const apiBase = API_URL.replace(/\/api$/, '');
                    let path = url;
                    if (!path.startsWith('/') && !path.startsWith('http')) {
                        // If no directory separator — it's just a bare filename, put in /uploads/
                        if (!path.includes('/'))
                            path = '/uploads/' + path;
                        else
                            path = '/' + path;
                    }
                    return `${apiBase}${path}`;
                };
                // For patient_document records, always prefer the stored url field
                const documentSourceUrl = selectedRecord.sourceTable === 'patient_document'
                    ? (selectedRecord.url || selectedRecord.result)
                    : null;
                const finalFileUrl = documentSourceUrl
                    ? resolveDocUrl(documentSourceUrl)
                    : (fileUrl ? resolveDocUrl(fileUrl) : null);
                return (<div className="results-wrapper">
                                            {/* Always show Identification Header */}
                                            <div style={{ marginBottom: '1.5rem', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #1E1B4B' }}>
                                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Record Subject / Item</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B' }}>{selectedRecord.testName || 'General Clinical Record'}</div>
                                                    {finalFileUrl && (<a href={finalFileUrl} download={(selectedRecord?.testName || 'Document').replace(/[^\w\s\.-]/g, '')} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#2D3BAE', textDecoration: 'none', background: '#EEF2FF', padding: '3px 10px', borderRadius: '20px' }}>
                                                            <FiDownload size={11}/> Download Original File
                                                        </a>)}
                                                </div>
                                            </div>

                                            {finalFileUrl ? (<div className="data-content" style={{ marginTop: '1rem', textAlign: 'center', padding: '2rem 1rem', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📄</div>
                                                    <h3 style={{ fontSize: '16px', color: '#334155', marginBottom: '0.5rem' }}>Attached Document</h3>
                                                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>An original file is attached to this record.</p>
                                                    <a href={finalFileUrl} download={(selectedRecord?.testName || 'Document').replace(/[^\w\s\.-]/g, '')} target="_blank" rel="noopener noreferrer" className="btn" style={{
                            background: '#2D3BAE',
                            color: 'white',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0.6rem 1.2rem',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            borderRadius: '8px'
                        }}>
                                                        <FiDownload /> Download Original File
                                                    </a>
                                                </div>) : (<div className="data-content" style={{ marginTop: '1rem' }}>
                                                    {/* ASSESSMENT: Dynamic form fields from formtemplate */}
                                                    {(() => {
                            // Assessment: formtemplate fields
                            if (selectedRecord.unifiedType === 'assessment') {
                                const rawFields = selectedRecord.formtemplate?.fields;
                                // fields may be a JSON string from the DB — parse it safely
                                let templateFields = [];
                                if (Array.isArray(rawFields)) {
                                    templateFields = rawFields;
                                }
                                else if (typeof rawFields === 'string') {
                                    try {
                                        templateFields = JSON.parse(rawFields);
                                    }
                                    catch (e) {
                                        templateFields = [];
                                    }
                                }
                                const formData = selectedRecord.data && typeof selectedRecord.data === 'object'
                                    ? selectedRecord.data
                                    : (() => { try {
                                        return typeof selectedRecord.data === 'string' ? JSON.parse(selectedRecord.data) : {};
                                    }
                                    catch (e) {
                                        return {};
                                    } })();
                                if (Array.isArray(templateFields) && templateFields.length > 0) {
                                    const items = templateFields.map((field) => {
                                        const value = formData[field.id] ?? formData[field.label] ?? formData[field.name];
                                        if (value === undefined || value === null || value === '')
                                            return null;
                                        const displayValue = field.type === 'checkbox'
                                            ? (value ? '✅ Yes' : '❌ No')
                                            : Array.isArray(value) ? value.join(', ') : String(value);
                                        return (<div key={field.id} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #6366F1' }}>
                                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{field.label}</div>
                                                                            <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{displayValue}</div>
                                                                        </div>);
                                    }).filter(Boolean);
                                    if (items.length > 0) {
                                        return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{items}</div>;
                                    }
                                }
                                // Fallback: show raw form data as key-value cards
                                const entries = Object.entries(formData || {}).filter(([k]) => !['id', 'clinicId', 'patientId'].includes(k));
                                if (entries.length > 0) {
                                    return (<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                        {entries.map(([key, value]) => (<div key={key} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #6366F1' }}>
                                                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                                                                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                                                                                </div>
                                                                                <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6' }}>{String(value)}</div>
                                                                            </div>))}
                                                                    </div>);
                                }
                                return (<div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                                                                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#4b5563', fontStyle: 'italic' }}>
                                                                        Medical consultation record. No detailed form data available.
                                                                    </p>
                                                                </div>);
                            }
                            // Prescription: show medications table
                            if (selectedRecord.unifiedType === 'prescription') {
                                const prescData = selectedRecord.prescriptionData || selectedRecord.data || {};
                                const meds = (prescData.ordersSnapshot || []).filter((o) => o.type === 'PHARMACY');
                                return (<div>
                                                                    {prescData.diagnosis && (<div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', borderLeft: '3px solid #F59E0B', marginBottom: '16px' }}>
                                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Diagnosis</div>
                                                                            <div style={{ fontSize: '14px', color: '#78350F', fontWeight: 600 }}>{prescData.diagnosis}</div>
                                                                        </div>)}
                                                                    {prescData.notes && (<div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '3px solid #22C55E', marginBottom: '16px' }}>
                                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Doctor Notes</div>
                                                                            <div style={{ fontSize: '14px', color: '#166534' }}>{prescData.notes}</div>
                                                                        </div>)}
                                                                    {meds.length > 0 && (<div>
                                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E1B4B', marginBottom: '10px' }}>💊 Prescribed Medications</div>
                                                                            <div style={{ overflowX: 'auto' }}>
                                                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                                                    <thead>
                                                                                        <tr style={{ background: '#1E1B4B', color: 'white' }}>
                                                                                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Medicine</th>
                                                                                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Dosage</th>
                                                                                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Frequency</th>
                                                                                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Duration</th>
                                                                                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Qty</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {meds.map((med, i) => (<tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                                                                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{med.testName || med.name || 'N/A'}</td>
                                                                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{med.dosage || '-'}</td>
                                                                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{med.frequency || '-'}</td>
                                                                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{med.duration || '-'}</td>
                                                                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{med.quantity || '-'}</td>
                                                                                            </tr>))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>)}
                                                                    {meds.length === 0 && !prescData.diagnosis && !prescData.notes && (<div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                                                                            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontStyle: 'italic' }}>Prescription issued. Contact your doctor for details.</p>
                                                                        </div>)}
                                                                </div>);
                            }
                            // Radiology / Clinical Findings
                            if (selectedRecord.displayType === 'Radiology' || (parsed && (parsed.findings || parsed.impression))) {
                                return (<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                                    <div>
                                                                        <div style={{ fontSize: '14px', fontWeight: 700 }}>Findings / Description:</div>
                                                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>
                                                                            {parsed?.notes || parsed?.findings || (typeof result === 'string' && !result.startsWith('{') ? result : 'Official clinical record. Reference physician notes.')}
                                                                        </div>
                                                                    </div>
                                                                    {(parsed?.impression || parsed?.notes) && (<div>
                                                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>Impression:</div>
                                                                            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px', color: '#1E1B4B' }}>
                                                                                {parsed?.impression || 'Clinical correlation suggested.'}
                                                                            </div>
                                                                        </div>)}
                                                                </div>);
                            }
                            // Lab / Service Order
                            if (selectedRecord.unifiedType === 'order' || selectedRecord.displayType === 'Lab') {
                                return (<div style={{ overflowX: 'auto' }}>
                                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                        <thead>
                                                                            <tr style={{ borderBottom: '2px solid #000', background: '#f8fafc' }}>
                                                                                <th style={{ textAlign: 'left', padding: '10px 5px', fontSize: '12px', fontWeight: 800 }}>TEST PARAMETER</th>
                                                                                <th style={{ textAlign: 'center', padding: '10px 5px', fontSize: '12px', fontWeight: 800 }}>RESULT</th>
                                                                                <th style={{ textAlign: 'center', padding: '10px 5px', fontSize: '12px', fontWeight: 800 }}>UNIT</th>
                                                                                <th style={{ textAlign: 'center', padding: '10px 5px', fontSize: '12px', fontWeight: 800 }}>REFERENCE</th>
                                                                                <th style={{ textAlign: 'right', padding: '10px 5px', fontSize: '12px', fontWeight: 800 }}>STATUS</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                                                <td style={{ padding: '12px 5px', fontWeight: 700, fontSize: '14px' }}>{selectedRecord.testName}</td>
                                                                                <td style={{ textAlign: 'center', padding: '12px 5px', fontSize: '14px', fontWeight: 800 }}>{parsed?.numericValue || parsed?.resultValue || (typeof result === 'string' && !result.startsWith('{') ? result : 'ANALYZED')}</td>
                                                                                <td style={{ textAlign: 'center', padding: '12px 5px', fontSize: '14px' }}>{parsed?.unit || '-'}</td>
                                                                                <td style={{ textAlign: 'center', padding: '12px 5px', fontSize: '14px' }}>{parsed?.reference || 'Normal'}</td>
                                                                                <td style={{ textAlign: 'right', padding: '12px 5px', fontSize: '13px', fontWeight: 700 }}>{selectedRecord.testStatus || 'Verified'}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>);
                            }
                            // Generic Fallback
                            return (<div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                                                                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#4b5563', fontStyle: 'italic' }}>
                                                                    {typeof result === 'string' && !result.startsWith('{') && !result.startsWith('data:') && !result.startsWith('http') ? result : 'Official clinical record. Please refer to healthcare provider for detailed interpretation.'}
                                                                </p>
                                                            </div>);
                        })()}
                                                </div>)}
                                        </div>);
            })()}
                            </div>
                        </div>

                        {/* 6. FOOTER */}
                        <div style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 1.5rem' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#666' }}>Report Generated Date: {new Date().toLocaleString()}</p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#999' }}>* This is an official digital record and does not require a physical signature.</p>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '220px' }}>
                                <div style={{ borderBottom: '1px solid #000', width: '100%', height: '40px', marginBottom: '8px' }}></div>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>Doctor Signature</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Authorized Clinical Staff</p>
                            </div>
                        </div>

                        {/* MODAL ACTIONS - HIDDEN DURING PRINT */}
                        <div className="modal-actions no-print" style={{
                marginTop: '2.5rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                paddingBottom: '1.5rem'
            }}>
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)} style={{ borderRadius: '10px', padding: '0.8rem 1.8rem' }}>
                                Close Window
                            </button>
                            <button className="btn btn-primary btn-with-icon" onClick={handlePrint} style={{
                background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '10px',
                padding: '0.8rem 2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                                <FiPrinter /> Print Medical Report
                            </button>
                        </div>
                    </div>)}
            </Modal>
        </div>);
};
export default PatientRecords;
