import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit2, FiSearch, FiFileText, FiPlus, FiDownload, FiUser, FiCalendar, FiX, FiClipboard, FiPackage, FiActivity } from 'react-icons/fi';
import { medicalReportService } from '../../services/medicalReport.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import { addClinicHeader } from '../../utils/pdfUtils';
import './MedicalReportList.css';
const MedicalReportList = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { selectedClinic, user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewedReport, setViewedReport] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [reportTypes, setReportTypes] = useState(['all']);
    useEffect(() => {
        fetchReports();
        fetchTemplates();
    }, []);
    const fetchTemplates = async () => {
        try {
            const response = await medicalReportService.getTemplates();
            if (response.success) {
                const names = response.data.map((t) => t.name);
                setReportTypes(['all', ...names]);
            }
        }
        catch (error) {
            console.error('Failed to fetch templates');
        }
    };
    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await medicalReportService.getReports();
            if (response.success) {
                setReports(response.data || []);
            }
            else {
                setReports([]);
            }
        }
        catch (error) {
            toast.error('Failed to fetch medical reports');
        }
        finally {
            setLoading(false);
        }
    };
    // Get unique template types for filter
    const filteredReports = reports.filter((report) => {
        const matchSearch = report.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.patient?.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.template?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterType === 'all' || (report.template?.name || 'General') === filterType;
        return matchSearch && matchFilter;
    });
    // Get medicines from report
    const getMedicines = (report) => {
        if (!report)
            return [];
        const dynamic = report.dynamicData;
        if (dynamic?.prescriptions && Array.isArray(dynamic.prescriptions))
            return dynamic.prescriptions;
        if (dynamic?.ordersSnapshot && Array.isArray(dynamic.ordersSnapshot)) {
            return dynamic.ordersSnapshot.filter((o) => o.type === 'PHARMACY' || o.type === 'MEDICINE');
        }
        return [];
    };
    // Get all orders (lab, radiology, pharmacy)
    const getAllOrders = (report) => {
        if (!report)
            return [];
        const dynamic = report.dynamicData;
        if (dynamic?.ordersSnapshot && Array.isArray(dynamic.ordersSnapshot))
            return dynamic.ordersSnapshot;
        return [];
    };
    // Get dynamic fields to display
    const getDynamicFields = (report) => {
        if (!report?.template?.fields || !report?.dynamicData)
            return [];
        const fields = Array.isArray(report.template.fields)
            ? report.template.fields
            : (typeof report.template.fields === 'string' ? JSON.parse(report.template.fields) : []);
        return fields
            .map((f) => ({ ...f, value: report.dynamicData[f.id] }))
            .filter((f) => f.value !== undefined && f.value !== null && f.value !== '');
    };
    const handleDownloadPDF = async (report) => {
        try {
            setPdfLoading(true);
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const startY = await addClinicHeader(doc, selectedClinic, report.template?.name || 'Medical Report');
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(`Patient: ${report.patient?.name || 'N/A'}`, 15, startY + 8);
            doc.text(`MRN: ${report.patient?.mrn || 'N/A'}`, 15, startY + 15);
            doc.text(`Date: ${new Date(report.reportDate).toLocaleDateString()}`, pageWidth - 60, startY + 8);
            doc.text(`Doctor: Dr. ${report.doctor?.name || user?.name || 'N/A'}`, pageWidth - 60, startY + 15);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(15, startY + 22, pageWidth - 15, startY + 22);
            let yPos = startY + 30;
            const fields = getDynamicFields(report);
            if (fields.length > 0) {
                fields.forEach((field) => {
                    const displayValue = field.type === 'checkbox' ? (field.value ? 'Yes' : 'No') : String(field.value);
                    doc.setFontSize(11);
                    doc.setTextColor(35, 40, 107);
                    doc.setFont('helvetica', 'bold');
                    doc.text(field.label + ':', 15, yPos);
                    yPos += 7;
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(displayValue, pageWidth - 30);
                    if (yPos + lines.length * 6 > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(lines, 15, yPos);
                    yPos += lines.length * 6 + 8;
                });
            }
            else {
                if (report.diagnosisSummary) {
                    doc.setFontSize(11);
                    doc.setTextColor(35, 40, 107);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Diagnosis:', 15, yPos);
                    yPos += 7;
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(report.diagnosisSummary, pageWidth - 30);
                    doc.text(lines, 15, yPos);
                    yPos += lines.length * 6 + 8;
                }
                if (report.treatmentGiven) {
                    doc.setFontSize(11);
                    doc.setTextColor(35, 40, 107);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Treatment:', 15, yPos);
                    yPos += 7;
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(report.treatmentGiven, pageWidth - 30);
                    doc.text(lines, 15, yPos);
                    yPos += lines.length * 6 + 8;
                }
            }
            // Medicines section
            const medicines = getMedicines(report);
            if (medicines.length > 0) {
                yPos += 5;
                doc.setFontSize(11);
                doc.setTextColor(35, 40, 107);
                doc.setFont('helvetica', 'bold');
                doc.text('Prescribed Medicines:', 15, yPos);
                yPos += 7;
                medicines.forEach((med) => {
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`• ${med.testName || med.medicineName || 'Medicine'} ${med.quantity ? `(Qty: ${med.quantity})` : ''}`, 18, yPos);
                    yPos += 6;
                    if (med.details) {
                        const iLines = doc.splitTextToSize(`  ${med.details}`, pageWidth - 40);
                        doc.text(iLines, 20, yPos);
                        yPos += iLines.length * 5 + 2;
                    }
                });
            }
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('This is a computer generated document. Valid without signature.', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.save(`MedicalReport_${report.patient?.name?.replace(/\s+/g, '_') || 'Report'}_${new Date(report.reportDate).toISOString().split('T')[0]}.pdf`);
        }
        catch {
            toast.error('Failed to generate PDF');
        }
        finally {
            setPdfLoading(false);
        }
    };
    const typeColor = {
        'Sick Leave Report': '#3B82F6',
        'Accident Report': '#EF4444',
        'Fitness Certificate': '#10B981',
        'Company Report': '#8B5CF6',
        'General Medical Report': '#F59E0B',
    };
    return (<div className="mrl-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>Medical Reports</h1>
                    <p>Manage and issue medical reports for patients</p>
                </div>
                <button className="btn btn-primary btn-no-hover" onClick={() => navigate('/doctor/medical-report/new')}>
                    <FiPlus /> <span>New Report</span>
                </button>
            </div>

            {/* Stats */}
            <div className="mrl-stats-grid">
                <div className="mrl-stat-card">
                    <div className="mrl-stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                        <FiFileText />
                    </div>
                    <div className="mrl-stat-info">
                        <p>Total Reports</p>
                        <h3>{reports.length}</h3>
                    </div>
                </div>
                <div className="mrl-stat-card">
                    <div className="mrl-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                        <FiUser />
                    </div>
                    <div className="mrl-stat-info">
                        <p>Unique Patients</p>
                        <h3>{new Set(reports.map((r) => r.patientId)).size}</h3>
                    </div>
                </div>
                <div className="mrl-stat-card">
                    <div className="mrl-stat-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                        <FiCalendar />
                    </div>
                    <div className="mrl-stat-info">
                        <p>This Month</p>
                        <h3>{reports.filter((r) => new Date(r.reportDate).getMonth() === new Date().getMonth()).length}</h3>
                    </div>
                </div>
                <div className="mrl-stat-card">
                    <div className="mrl-stat-icon" style={{ background: '#FDF2F8', color: '#DB2777' }}>
                        <FiPackage />
                    </div>
                    <div className="mrl-stat-info">
                        <p>With Prescriptions</p>
                        <h3>{reports.filter((r) => getMedicines(r).length > 0).length}</h3>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mrl-controls card">
                <div className="mrl-search-box">
                    <FiSearch />
                    <input type="text" placeholder="Search by patient name, MRN, or report type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    {searchTerm && (<button className="mrl-clear" onClick={() => setSearchTerm('')}><FiX /></button>)}
                </div>
                <div className="mrl-filter-select">
                    <select className="form-control" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ minWidth: '200px', cursor: 'pointer' }}>
                        {reportTypes.map(type => (<option key={type} value={type}>
                                {type === 'all' ? 'All Report Types' : type}
                            </option>))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="mrl-table-card card">
                <div className="mrl-table-header">
                    <h3>Issued Reports</h3>
                    <span className="mrl-count">{filteredReports.length} records</span>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Report Type</th>
                                <th>Key Details</th>
                                <th>Medicines</th>
                                <th>Date</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr>
                                    <td colSpan={6}>
                                        <div className="mrl-loading">
                                            <div className="mrl-spinner"/>
                                            Loading reports...
                                        </div>
                                    </td>
                                </tr>) : filteredReports.length === 0 ? (<tr>
                                    <td colSpan={6}>
                                        <div className="mrl-empty">
                                            <FiFileText size={48}/>
                                            <h3>{searchTerm ? 'No results found' : 'No medical reports yet'}</h3>
                                            <p>{searchTerm ? 'Try a different search term.' : 'Issued medical reports will appear here once created from assessments.'}</p>
                                            {!searchTerm && (<button className="btn btn-primary" onClick={() => navigate('/doctor/medical-report/new')} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                    <FiPlus /> Create First Report
                                                </button>)}
                                        </div>
                                    </td>
                                </tr>) : (filteredReports.map((report) => {
            const medicines = getMedicines(report);
            const dynamicFields = getDynamicFields(report);
            const previewField = dynamicFields[0];
            const typeName = report.template?.name || 'General Report';
            const typeC = typeColor[typeName] || '#6366F1';
            return (<tr key={report.id}>
                                            <td>
                                                <div className="mrl-patient-cell">
                                                    <div className="mrl-avatar">{report.patient?.name?.charAt(0) || 'P'}</div>
                                                    <div>
                                                        <strong>{report.patient?.name || '—'}</strong>
                                                        <span className="mrl-mrn">{report.patient?.mrn || ''}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="mrl-type-badge" style={{ background: typeC + '18', color: typeC }}>
                                                    {typeName}
                                                </span>
                                            </td>
                                            <td className="mrl-details-cell">
                                                {previewField ? (<span title={String(previewField.value)}>
                                                        <strong>{previewField.label}: </strong>
                                                        {String(previewField.value).length > 60
                        ? String(previewField.value).slice(0, 60) + '...'
                        : String(previewField.value)}
                                                    </span>) : report.diagnosisSummary ? (<span title={report.diagnosisSummary}>
                                                        <strong>Diagnosis: </strong>
                                                        {report.diagnosisSummary.length > 60
                        ? report.diagnosisSummary.slice(0, 60) + '...'
                        : report.diagnosisSummary}
                                                    </span>) : <span className="mrl-no-data">—</span>}
                                            </td>
                                            <td>
                                                {medicines.length > 0 ? (<div className="mrl-medicines-cell">
                                                        {medicines.slice(0, 2).map((m, i) => (<span key={i} className="mrl-med-tag">
                                                                <FiPackage size={10}/> {m.testName || m.medicineName || 'Med'}
                                                                {m.quantity ? ` ×${m.quantity}` : ''}
                                                            </span>))}
                                                        {medicines.length > 2 && (<span className="mrl-more-tag">+{medicines.length - 2} more</span>)}
                                                    </div>) : (<span className="mrl-no-data">None</span>)}
                                            </td>
                                            <td>
                                                <div className="mrl-date-cell">
                                                    {new Date(report.reportDate).toLocaleDateString()}
                                                    <span className="mrl-date-sub">
                                                        {new Date(report.reportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="mrl-actions">
                                                    <button className="mrl-action-btn view" title="View Full Report" onClick={() => { setViewedReport(report); setIsViewOpen(true); }}>
                                                        <FiEye />
                                                    </button>
                                                    <button className="mrl-action-btn edit" title="Edit Report" onClick={() => navigate(`/doctor/medical-report/edit/${report.id}`)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button className="mrl-action-btn download" title="Download PDF" disabled={pdfLoading} onClick={() => handleDownloadPDF(report)}>
                                                        <FiDownload />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>);
        }))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Full Report View Overlay */}
            {isViewOpen && viewedReport && (<div className="mrl-overlay" onClick={() => setIsViewOpen(false)}>
                    <div className="mrl-full-view" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="mrl-fv-header">
                            <div className="mrl-fv-clinic">
                                {selectedClinic?.logo && (<img src={selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${selectedClinic.logo}`} alt="Clinic"/>)}
                                <div>
                                    <h2>{selectedClinic?.name || 'Medical Clinic'}</h2>
                                    <p>{selectedClinic?.location || ''}</p>
                                </div>
                            </div>
                            <div className="mrl-fv-actions-top">
                                <button className="mrl-fv-pdf-btn btn-no-hover" onClick={() => handleDownloadPDF(viewedReport)} disabled={pdfLoading}>
                                    <FiDownload /> {pdfLoading ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button className="mrl-fv-close" onClick={() => setIsViewOpen(false)}>
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        <div className="mrl-fv-body">
                            {/* Report Type Badge */}
                            <div className="mrl-fv-type-row">
                                <span className="mrl-fv-type-badge">
                                    <FiClipboard /> {viewedReport.template?.name || 'Medical Report'}
                                </span>
                                <span className="mrl-fv-date">
                                    {new Date(viewedReport.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            {/* Patient + Doctor Info */}
                            <div className="mrl-fv-info-grid">
                                <div className="mrl-fv-info-block">
                                    <label>Patient Name</label>
                                    <h3>{viewedReport.patient?.name || '—'}</h3>
                                </div>
                                <div className="mrl-fv-info-block">
                                    <label>Patient MRN</label>
                                    <p>{viewedReport.patient?.mrn || '—'}</p>
                                </div>
                                <div className="mrl-fv-info-block">
                                    <label>Attending Doctor</label>
                                    <p>Dr. {viewedReport.doctor?.name || user?.name || '—'}</p>
                                </div>
                                {viewedReport.dynamicData?.companyName && (<div className="mrl-fv-info-block">
                                        <label>Company</label>
                                        <p>{viewedReport.dynamicData.companyName}</p>
                                    </div>)}
                            </div>

                            <hr className="mrl-fv-divider"/>

                            {/* Dynamic Fields */}
                            {getDynamicFields(viewedReport).length > 0 ? (<div className="mrl-fv-section">
                                    <h4 className="mrl-fv-section-title">
                                        <FiActivity /> Clinical Details
                                    </h4>
                                    <div className="mrl-fv-fields-grid">
                                        {getDynamicFields(viewedReport).map((field) => (<div key={field.id} className={`mrl-fv-field ${field.type === 'textarea' || String(field.value).length > 60 ? 'full' : ''}`}>
                                                <label>{field.label}</label>
                                                <p style={{ whiteSpace: 'pre-wrap' }}>
                                                    {field.type === 'checkbox' ? (field.value ? '✓ Yes' : '✗ No') : String(field.value)}
                                                </p>
                                            </div>))}
                                    </div>
                                </div>) : (<>
                                    {viewedReport.diagnosisSummary && (<div className="mrl-fv-section">
                                            <h4 className="mrl-fv-section-title"><FiActivity /> Diagnosis</h4>
                                            <p className="mrl-fv-text">{viewedReport.diagnosisSummary}</p>
                                        </div>)}
                                    {viewedReport.treatmentGiven && (<div className="mrl-fv-section">
                                            <h4 className="mrl-fv-section-title"><FiClipboard /> Treatment</h4>
                                            <p className="mrl-fv-text">{viewedReport.treatmentGiven}</p>
                                        </div>)}
                                    {viewedReport.restDays && (<div className="mrl-fv-sick-leave">
                                            <h4>Sick Leave Details</h4>
                                            <div className="mrl-fv-sick-grid">
                                                <div><label>Rest Days</label><p>{viewedReport.restDays} Days</p></div>
                                                <div><label>From</label><p>{viewedReport.sickLeaveFrom ? new Date(viewedReport.sickLeaveFrom).toLocaleDateString() : '—'}</p></div>
                                                <div><label>To</label><p>{viewedReport.sickLeaveTo ? new Date(viewedReport.sickLeaveTo).toLocaleDateString() : '—'}</p></div>
                                                <div><label>Fit to Resume</label><p>{viewedReport.fitToResume ? '✓ Yes' : '✗ No'}</p></div>
                                            </div>
                                        </div>)}
                                </>)}

                            {/* All Orders */}
                            {getAllOrders(viewedReport).length > 0 && (<div className="mrl-fv-section">
                                    <h4 className="mrl-fv-section-title">
                                        <FiPackage /> Prescriptions & Orders
                                    </h4>
                                    <div className="mrl-fv-orders">
                                        {getAllOrders(viewedReport).map((order, idx) => (<div key={idx} className="mrl-fv-order-row">
                                                <span className={`mrl-fv-order-type ${order.type?.toLowerCase()}`}>
                                                    {order.type}
                                                </span>
                                                <div className="mrl-fv-order-body">
                                                    <strong>{order.testName || order.medicineName || '—'}</strong>
                                                    {order.quantity && <span> — Qty: {order.quantity} {order.unit || ''}</span>}
                                                    {order.details && <p className="mrl-fv-order-instr">{order.details}</p>}
                                                </div>
                                            </div>))}
                                    </div>
                                </div>)}

                            {/* Fallback: Medicines only from medicines parser */}
                            {getAllOrders(viewedReport).length === 0 && getMedicines(viewedReport).length > 0 && (<div className="mrl-fv-section">
                                    <h4 className="mrl-fv-section-title"><FiPackage /> Prescribed Medicines</h4>
                                    <div className="mrl-fv-orders">
                                        {getMedicines(viewedReport).map((med, idx) => (<div key={idx} className="mrl-fv-order-row">
                                                <span className="mrl-fv-order-type pharmacy">PHARMACY</span>
                                                <div className="mrl-fv-order-body">
                                                    <strong>{med.testName || med.medicineName || '—'}</strong>
                                                    {med.quantity && <span> — Qty: {med.quantity}</span>}
                                                    {med.details && <p className="mrl-fv-order-instr">{med.details}</p>}
                                                </div>
                                            </div>))}
                                    </div>
                                </div>)}

                            {/* Footer Signatures */}
                            <div className="mrl-fv-sigs">
                                <div className="mrl-fv-sig-block">
                                    <div className="mrl-fv-sig-line"/>
                                    <p>Dr. {viewedReport.doctor?.name || user?.name || 'Physician'}</p>
                                    <span>Treating Doctor</span>
                                </div>
                                <p className="mrl-fv-disclaimer">
                                    This is a computer generated document. Valid without signature.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>)}
        </div>);
};
export default MedicalReportList;
