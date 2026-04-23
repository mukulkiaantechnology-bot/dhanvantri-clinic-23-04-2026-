import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { medicalReportService } from '../../services/medicalReport.service';
import { useToast } from '../../context/ToastContext';
import { jsPDF } from 'jspdf';
import { addClinicHeader } from '../../utils/pdfUtils';
import './MedicalReportForm.css';
const MedicalReportForm = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user, selectedClinic } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [dynamicData, setDynamicData] = useState({});
    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        companyName: '',
        employeeId: '',
        reportDate: new Date().toISOString().split('T')[0],
        diagnosisSummary: '',
        treatmentGiven: '',
        restDays: 0,
        sickLeaveFrom: new Date().toISOString().split('T')[0],
        sickLeaveTo: new Date().toISOString().split('T')[0],
        fitToResume: true,
    });
    useEffect(() => { fetchTemplates(); }, []);
    useEffect(() => {
        if (id) {
            fetchReport(Number(id));
        }
        else if (state && state.patient) {
            setFormData(prev => ({
                ...prev,
                patientId: state.patient.id,
                patientName: state.patient.name,
                diagnosisSummary: state.assessment?.diagnosis || '',
                treatmentGiven: state.assessment?.advice || ''
            }));
            setDynamicData({
                diagnosisSummary: state.assessment?.diagnosis || '',
                treatmentGiven: state.assessment?.advice || '',
                diagnosis: state.assessment?.diagnosis || '',
                advice: state.assessment?.advice || ''
            });
        }
    }, [id, state]);
    const fetchTemplates = async () => {
        try {
            const response = await medicalReportService.getTemplates();
            if (response.success && Array.isArray(response.data)) {
                setTemplates(response.data);
            }
        }
        catch (error) {
            toast.error('Failed to fetch templates');
        }
    };
    const fetchReport = async (reportId) => {
        try {
            setLoading(true);
            const response = await medicalReportService.getReportById(reportId);
            if (response.success) {
                const report = response.data;
                setFormData({
                    patientId: report.patientId,
                    patientName: report.patient.name,
                    companyName: report.companyName || '',
                    employeeId: report.employeeId || '',
                    reportDate: new Date(report.reportDate).toISOString().split('T')[0],
                    diagnosisSummary: report.diagnosisSummary || '',
                    treatmentGiven: report.treatmentGiven || '',
                    restDays: report.restDays || 0,
                    sickLeaveFrom: report.sickLeaveFrom ? new Date(report.sickLeaveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    sickLeaveTo: report.sickLeaveTo ? new Date(report.sickLeaveTo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    fitToResume: report.fitToResume ?? true,
                });
                if (report.templateId) {
                    setSelectedTemplateId(report.templateId);
                    setDynamicData(report.dynamicData || {});
                }
            }
        }
        catch (error) {
            toast.error('Failed to fetch report');
        }
        finally {
            setLoading(false);
        }
    };
    const handleStaticChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };
    const handleDynamicChange = (fieldId, value) => {
        setDynamicData(prev => ({ ...prev, [fieldId]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                templateId: selectedTemplateId || null,
                dynamicData: selectedTemplateId ? dynamicData : null
            };
            // Sync dynamic company fields to top-level columns for DB compatibility
            if (dynamicData.companyName)
                payload.companyName = dynamicData.companyName;
            if (dynamicData.employeeId)
                payload.employeeId = dynamicData.employeeId;
            if (id) {
                await medicalReportService.updateReport(Number(id), payload);
                toast.success('Report updated successfully');
            }
            else {
                await medicalReportService.createReport(payload);
                toast.success('Report created successfully');
            }
            navigate('/doctor/medical-report');
        }
        catch (error) {
            toast.error(error?.message || 'Failed to save report');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDownloadPDF = async () => {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template && !formData.diagnosisSummary) {
            toast.error('Please select a report type and fill in the details first.');
            return;
        }
        try {
            setPdfLoading(true);
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const startY = await addClinicHeader(doc, selectedClinic, template?.name || 'Medical Report');
            // Patient Info Block
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(`Patient: ${formData.patientName || 'N/A'}`, 15, startY + 8);
            doc.text(`Doctor: Dr. ${user?.name || 'N/A'}`, pageWidth / 2, startY + 8);
            doc.text(`Date: ${new Date(formData.reportDate).toLocaleDateString()}`, 15, startY + 15);
            const displayCompany = dynamicData.companyName || formData.companyName;
            if (displayCompany)
                doc.text(`Company: ${displayCompany}`, pageWidth / 2, startY + 15);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(15, startY + 22, pageWidth - 15, startY + 22);
            let yPos = startY + 30;
            // Dynamic content
            if (template && template.fields) {
                template.fields.forEach((field) => {
                    const value = dynamicData[field.id];
                    if (value === undefined || value === null || value === '')
                        return;
                    doc.setFontSize(11);
                    doc.setTextColor(35, 40, 107);
                    doc.setFont('helvetica', 'bold');
                    doc.text(field.label + ':', 15, yPos);
                    yPos += 7;
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont('helvetica', 'normal');
                    const displayValue = field.type === 'checkbox' ? (value ? 'Yes' : 'No') : String(value);
                    const textLines = doc.splitTextToSize(displayValue, pageWidth - 30);
                    if (yPos + (textLines.length * 6) > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(textLines, 15, yPos);
                    yPos += (textLines.length * 6) + 8;
                });
            }
            else {
                // Legacy fallback
                const fields = [
                    { label: 'Diagnosis Summary', value: formData.diagnosisSummary },
                    { label: 'Treatment Given', value: formData.treatmentGiven },
                ];
                fields.forEach(f => {
                    if (!f.value)
                        return;
                    doc.setFontSize(11);
                    doc.setTextColor(35, 40, 107);
                    doc.setFont('helvetica', 'bold');
                    doc.text(f.label + ':', 15, yPos);
                    yPos += 7;
                    doc.setFontSize(10);
                    doc.setTextColor(50, 50, 50);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(f.value, pageWidth - 30);
                    doc.text(lines, 15, yPos);
                    yPos += (lines.length * 6) + 8;
                });
            }
            // Footer
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('This is a computer generated document. No signature required.', pageWidth / 2, pageHeight - 15, { align: 'center' });
            doc.text(`Dr. ${user?.name || 'Physician'} | ${selectedClinic?.name || ''}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            const fileName = `MedicalReport_${formData.patientName?.replace(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        }
        catch (error) {
            toast.error('Failed to generate PDF');
        }
        finally {
            setPdfLoading(false);
        }
    };
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const renderDynamicField = (field) => {
        const value = dynamicData[field.id] ?? (field.type === 'checkbox' ? false : (field.type === 'number' ? '' : ''));
        return (<div key={field.id} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                {field.type !== 'checkbox' && <label>{field.label} {field.required && <span style={{ color: 'red' }}>*</span>}</label>}
                {field.type === 'textarea' ? (<textarea value={value} onChange={(e) => handleDynamicChange(field.id, e.target.value)} required={field.required}/>) : field.type === 'checkbox' ? (<div className="checkbox-group">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={!!value} onChange={(e) => handleDynamicChange(field.id, e.target.checked)}/>
                            <span>{field.label}</span>
                        </label>
                    </div>) : (<input type={field.type} value={value} onChange={(e) => handleDynamicChange(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)} required={field.required}/>)}
            </div>);
    };
    return (<div className="medical-report-form-container fade-in">
            <div className="form-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back
                </button>
                <h2>{id ? 'Edit Medical Report' : 'Create New Medical Report'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="report-form-card">
                <div className="form-grid">
                    {/* Header Info */}
                    <div className="form-group readonly">
                        <label>Patient Name</label>
                        <input type="text" value={formData.patientName} readOnly/>
                    </div>
                    <div className="form-group readonly">
                        <label>Doctor Name</label>
                        <input type="text" value={user?.name || ''} readOnly/>
                    </div>

                    <div className="form-group full-width" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                            Search & Select Report Type <span style={{ color: 'red' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', marginTop: '8px' }}>
                            <input type="text" placeholder="Start typing to search report type (e.g. Sick Leave, Radiology Result...)" list="template-list" value={templates.find(t => t.id === selectedTemplateId)?.name || ''} onChange={(e) => {
            const val = e.target.value;
            const matched = templates.find(t => t.name === val);
            if (matched) {
                setSelectedTemplateId(matched.id);
            }
            else if (val === '') {
                setSelectedTemplateId('');
            }
        }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/>
                            <datalist id="template-list">
                                {templates.map(t => (<option key={t.id} value={t.name}/>))}
                            </datalist>
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>Report Date</label>
                        <input type="date" name="reportDate" value={formData.reportDate} onChange={handleStaticChange} required/>
                    </div>
                </div>

                <div className="divider"></div>

                <div className="form-grid">
                    {selectedTemplate ? (selectedTemplate.fields.map(renderDynamicField)) : (!id ? (<p style={{ gridColumn: '1 / -1', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                Please select a report type above to load the fields.
                            </p>) : (<>
                                <div className="form-group full-width">
                                    <label>Diagnosis Summary</label>
                                    <textarea name="diagnosisSummary" value={formData.diagnosisSummary} onChange={handleStaticChange}/>
                                </div>
                                <div className="form-group full-width">
                                    <label>Treatment Given</label>
                                    <textarea name="treatmentGiven" value={formData.treatmentGiven} onChange={handleStaticChange}/>
                                </div>
                                <div className="form-group"><label>Rest Days</label><input type="number" name="restDays" value={formData.restDays} onChange={handleStaticChange}/></div>
                                <div className="form-group"><label>Sick Leave From</label><input type="date" name="sickLeaveFrom" value={formData.sickLeaveFrom} onChange={handleStaticChange}/></div>
                                <div className="form-group"><label>Sick Leave To</label><input type="date" name="sickLeaveTo" value={formData.sickLeaveTo} onChange={handleStaticChange}/></div>
                                <div className="form-group checkbox-group"><label className="checkbox-label"><input type="checkbox" name="fitToResume" checked={formData.fitToResume} onChange={handleStaticChange}/><span>Fit to Resume Work</span></label></div>
                            </>))}
                </div>

                <div className="form-footer mt-4">
                    <button type="button" className="btn-save" onClick={handleDownloadPDF} disabled={pdfLoading}>
                        <FiDownload /> {pdfLoading ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button type="submit" className="btn-save" disabled={loading}>
                        <FiSave /> {loading ? 'Saving...' : 'Save Report'}
                    </button>
                </div>
            </form>
        </div>);
};
export default MedicalReportForm;
