import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiDownload, FiArrowLeft, FiActivity } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { medicalReportService } from '../../services/medicalReport.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import { API_URL } from '../../config/config';
import './MedicalReport.css';
const MedicalReport = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { selectedClinic, user } = useAuth();
    // State to hold report data
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchReport = async (reportId) => {
        try {
            setLoading(true);
            const response = await medicalReportService.getReportById(reportId);
            if (response.success) {
                setReportData(response.data);
            }
        }
        catch (error) {
            console.error('Error fetching report:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (id) {
            fetchReport(Number(id));
        }
        else if (state && state.reportData) {
            setReportData(state.reportData);
            setLoading(false);
        }
        else {
            setLoading(false);
        }
    }, [id, state]);
    const handleDownloadPDF = async () => {
        if (!reportData)
            return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const startY = await addClinicHeader(doc, selectedClinic, 'Medical Report');
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Patient Name: ${reportData.patient?.name || 'N/A'}`, 15, startY + 10);
        doc.text(`Patient ID: ${reportData.patient?.mrn || 'N/A'}`, 15, startY + 17);
        doc.text(`Date: ${new Date(reportData.reportDate || Date.now()).toLocaleDateString()}`, pageWidth - 60, startY + 10);
        let yPos = startY + 30;
        const pageHeight = doc.internal.pageSize.getHeight();
        if (reportData.template && reportData.template.fields) {
            reportData.template.fields.forEach((field) => {
                const value = reportData.dynamicData?.[field.id];
                if (value === undefined || value === null || value === '')
                    return;
                doc.setFontSize(14);
                doc.setTextColor(35, 40, 107);
                doc.text(field.label, 15, yPos);
                yPos += 8;
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
                const displayValue = field.type === 'checkbox' ? (value ? 'Yes' : 'No') : String(value);
                const textLines = doc.splitTextToSize(displayValue, pageWidth - 30);
                // Handle page breaks
                if (yPos + (textLines.length * 6) > pageHeight - 30) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(textLines, 15, yPos);
                yPos += (textLines.length * 6) + 10;
            });
        }
        else {
            // Legacy PDF Generation
            // Diagnosis Summary
            doc.setFontSize(14);
            doc.setTextColor(35, 40, 107);
            doc.text('Diagnosis Summary', 15, yPos);
            yPos += 8;
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'normal');
            const diagnosisText = doc.splitTextToSize(reportData.diagnosisSummary || 'N/A', pageWidth - 30);
            doc.text(diagnosisText, 15, yPos);
            yPos += (diagnosisText.length * 6) + 10;
            // Treatment Given
            doc.setFontSize(14);
            doc.setTextColor(35, 40, 107);
            doc.text('Treatment Given', 15, yPos);
            yPos += 8;
            doc.setFontSize(11);
            doc.setTextColor(0);
            const treatmentText = doc.splitTextToSize(reportData.treatmentGiven || 'N/A', pageWidth - 30);
            doc.text(treatmentText, 15, yPos);
            yPos += (treatmentText.length * 6) + 15;
            // Leave Details
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Sick Leave Details:', 15, yPos);
            yPos += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Duration: ${reportData.restDays || 0} Days`, 15, yPos);
            doc.text(`From: ${reportData.sickLeaveFrom ? new Date(reportData.sickLeaveFrom).toLocaleDateString() : 'N/A'}  To: ${reportData.sickLeaveTo ? new Date(reportData.sickLeaveTo).toLocaleDateString() : 'N/A'}`, 15, yPos + 7);
            doc.text(`Fit to Resume Work: ${reportData.fitToResume ? 'Yes' : 'No'}`, 15, yPos + 14);
        }
        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('This is a computer generated document. No signature required.', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.save(`Medical_Report_${reportData.patient?.name?.replace(/\s+/g, '_') || 'Report'}.pdf`);
    };
    if (loading)
        return <div className="loading-screen">Loading Report Preview...</div>;
    if (!reportData)
        return (<div className="empty-report-state">
            <FiActivity size={48}/>
            <h2>No Report Data Available</h2>
            <p>Please select a medical report to view.</p>
            <button className="btn-back" onClick={() => navigate(user?.role === 'PATIENT' ? '/patient/reports' : '/doctor/medical-report')}>
                <FiArrowLeft /> Back to List
            </button>
        </div>);
    return (<div className="medical-report-page fade-in">
            <div className="report-header-actions">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back
                </button>
                <div className="report-actions">
                    <button className="btn-primary" onClick={handleDownloadPDF}>
                        <FiDownload /> Download PDF
                    </button>
                </div>
            </div>

            <div className="report-paper">
                <header className="paper-header">
                    <div className="clinic-branding">
                        {selectedClinic?.logo && (<img src={selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${API_URL.replace(/\/api$/, '')}${selectedClinic.logo.startsWith('/') ? selectedClinic.logo : `/${selectedClinic.logo}`}`} alt="Clinic Logo"/>)}
                        <div>
                            <h1>{selectedClinic?.name || 'Medical Clinic'}</h1>
                            <p>Official Medical Report</p>
                        </div>
                    </div>
                    <div className="report-meta">
                        <div className="meta-item">
                            <label>Date</label>
                            <span>{new Date(reportData.reportDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </header>

                <hr className="divider"/>

                <section className="patient-section">
                    <div className="patient-info-card">
                        <div className="avatar-placeholder">
                            {reportData.patient?.name?.charAt(0) || 'P'}
                        </div>
                        <div className="patient-details-grid">
                            <div className="full-width">
                                <label>Patient Name</label>
                                <h3>{reportData.patient?.name || 'N/A'}</h3>
                            </div>
                            <div>
                                <label>Patient MRN</label>
                                <p>{reportData.patient?.mrn || 'N/A'}</p>
                            </div>
                            {(reportData.dynamicData?.companyName || reportData.companyName) && (<div>
                                    <label>Company Name</label>
                                    <p>{reportData.dynamicData?.companyName || reportData.companyName}</p>
                                </div>)}
                            {(reportData.dynamicData?.employeeId || reportData.employeeId) && (<div>
                                    <label>Employee ID</label>
                                    <p>{reportData.dynamicData?.employeeId || reportData.employeeId}</p>
                                </div>)}
                        </div>
                    </div>
                </section>

                <section className="report-body">
                    {reportData.template && reportData.template.fields ? (reportData.template.fields.map((field) => {
            const value = reportData.dynamicData?.[field.id];
            if (value === undefined || value === null || value === '')
                return null;
            return (<div key={field.id} className="field-box" style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '15px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{field.label}</h3>
                                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>{field.type === 'checkbox' ? (value ? 'Yes' : 'No') : value}</p>
                                </div>);
        })) : (<>
                            <div className="diagnosis-box">
                                <h3>Diagnosis Summary</h3>
                                <p>{reportData.diagnosisSummary}</p>
                            </div>

                            <div className="advice-section">
                                <h3>Treatment / Advice Given</h3>
                                <p>{reportData.treatmentGiven}</p>
                            </div>

                            <div className="leave-details-section" style={{ marginTop: '32px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Sick Leave Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Recommended Rest Days</label>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{reportData.restDays} Days</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Fit to Resume Work</label>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{reportData.fitToResume ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Period</label>
                                        <p style={{ margin: 0 }}>
                                            {reportData.sickLeaveFrom ? new Date(reportData.sickLeaveFrom).toLocaleDateString() : 'N/A'} - {reportData.sickLeaveTo ? new Date(reportData.sickLeaveTo).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>)}
                </section>

                <footer className="paper-footer">
                    <div className="doctor-signature">
                        <p>Treating Doctor</p>
                        <div className="signature-line"></div>
                        <h4>Dr. {reportData.doctor?.name || user?.name || 'Physician'}</h4>
                    </div>
                    <p className="disclaimer">This is a computer generated document. Valid without signature.</p>
                </footer>
            </div>
        </div>);
};
export default MedicalReport;
