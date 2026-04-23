import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { FiFile, FiSearch, FiClock, FiDownload, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import { addClinicHeader } from '../../utils/pdfUtils';
import { useToast } from '../../context/ToastContext';
import { API_URL } from '../../config/config';
import '../SharedDashboard.css';
const Documents = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewName, setPreviewName] = useState('');
    const [uploadForm, setUploadForm] = useState({
        name: '',
        type: 'OTHER',
        url: '',
        clinicId: ''
    });
    const toast = useToast();
    const [clinics, setClinics] = useState([]);
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const [docRes, medRes, clinicRes] = await Promise.all([
                    patientService.getMyDocuments(),
                    patientService.getMyMedicalRecords(),
                    patientService.getMyClinics()
                ]);
                setClinics(clinicRes.data?.data || clinicRes.data || []);
                const pureDocs = docRes.data?.data || (Array.isArray(docRes.data) ? docRes.data : []) || [];
                const medData = medRes.data?.data || medRes.data || {};
                const internalDocs = medData.documents || [];
                const formattedInternalDocs = internalDocs.map((d) => {
                    let parsedData = {};
                    try {
                        parsedData = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
                    }
                    catch (e) { }
                    // Prioritize actual file content (URL or Base64)
                    const fileUrl = parsedData.fileUrl || parsedData.url || parsedData.fileData || null;
                    return {
                        id: d.id,
                        name: parsedData.fileName || d.type || 'Clinical Document',
                        type: d.type,
                        date: d.visitDate || d.createdAt,
                        source: 'Medical Record',
                        url: fileUrl,
                        notes: parsedData.notes || d.notes || '',
                        clinic: d.clinic?.name || 'Dhanwantri Hospital',
                        fullData: d
                    };
                });
                const formattedPureDocs = pureDocs.map((d) => ({
                    id: d.id,
                    name: d.name || 'Document',
                    type: d.type || 'EXTERNAL',
                    date: d.createdAt,
                    source: 'External Upload',
                    url: d.url,
                    notes: d.notes || '',
                    clinic: d.clinic?.name || 'Dhanwantri Hospital',
                    fullData: d
                }));
                setDocuments([...formattedPureDocs, ...formattedInternalDocs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
            catch (error) {
                console.error('Failed to fetch documents', error);
            }
            finally {
                setLoading(false);
            }
        };
        if (user)
            fetchDocuments();
    }, [user]);
    const generatePDF = async (doc, shouldDownload = true) => {
        // If the document has original content (URL or Base64), use it immediately without modification
        if (doc.url) {
            const finalUrl = doc.url.startsWith('data:') || doc.url.startsWith('http')
                ? doc.url
                : `${API_URL.replace(/\/api$/, '')}${doc.url.startsWith('/') ? doc.url : `/${doc.url}`}`;
            if (shouldDownload) {
                const link = document.createElement('a');
                link.href = finalUrl;
                // If it's base64 pdf, we set filename, otherwise let browser decide
                link.download = doc.name.toLowerCase().endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            else {
                setPreviewUrl(finalUrl);
                setPreviewName(doc.name || 'Document Preview');
            }
            return;
        }
        const pdf = new jsPDF();
        const clinicInfo = {
            name: doc.clinic || 'Dhanwantri Hospital',
            location: 'Healthcare City, Block A, Suite 204',
            contact: '+1 234 567 890',
            email: 'care@evclinic.com'
        };
        const startY = await addClinicHeader(pdf, clinicInfo, 'OFFICIAL CLINICAL RECORD');
        // Document Info Section
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Record ID: ARCH-${doc.id}`, 15, startY + 5);
        pdf.text(`Date of Entry: ${new Date(doc.date).toLocaleDateString()}`, 15, startY + 10);
        pdf.text(`Patient Identity: ${user?.name || 'Registered Patient'}`, 15, startY + 15);
        // Content Title
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.text(doc.name, 15, startY + 30);
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(1);
        pdf.line(15, startY + 33, 60, startY + 33);
        // Observations Body
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        pdf.text('Clinical Observations & Record Details:', 15, startY + 45);
        pdf.setFontSize(11);
        pdf.setTextColor(71, 85, 105);
        const splitContent = pdf.splitTextToSize(doc.notes || "This clinical entry serves as an official document in the patient's medical history. No additional notes was recorded for this specific entry.", 180);
        pdf.text(splitContent, 15, startY + 55);
        // Footer / Disclaimer
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text('This is a digitally generated clinical record from the Dhanwantri Hospital Medical Information System.', 15, pageHeight - 20);
        pdf.text('The content above reflects the original medical entry as recorded by the facility.', 15, pageHeight - 16);
        if (shouldDownload) {
            pdf.save(`${doc.name.replace(/\s+/g, '_')}_Record.pdf`);
        }
        else {
            const blobUrl = pdf.output('bloburl');
            setPreviewUrl(blobUrl.toString());
            setPreviewName(doc.name || 'Document Preview');
        }
    };
    const handleDelete = async (doc) => {
        if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`))
            return;
        try {
            setDeletingId(doc.id);
            await patientService.deleteMyDocument(doc.id);
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
            toast.success('Document deleted successfully');
        }
        catch (error) {
            console.error('Failed to delete document', error);
            const msg = error.response?.data?.message || 'Failed to delete document. Please try again.';
            toast.error(msg);
        }
        finally {
            setDeletingId(null);
        }
    };
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.name || !uploadForm.url || !uploadForm.clinicId) {
            toast.error('Please fill all required fields');
            return;
        }
        setUploading(true);
        try {
            const patientDataRes = await patientService.getMyAppointments();
            const appointments = patientDataRes.data?.data || patientDataRes.data || [];
            const patientForClinic = appointments.find((a) => Number(a.clinicId) === Number(uploadForm.clinicId))?.patientId || Number(user?.patientId || user?.id || 0);
            await patientService.uploadDocument(Number(uploadForm.clinicId), patientForClinic, {
                name: uploadForm.name,
                type: uploadForm.type,
                url: uploadForm.url
            });
            toast.success('Document uploaded successfully');
            setShowUploadModal(false);
            setUploadForm({ name: '', type: 'OTHER', url: '', clinicId: '' });
            // Refresh documents
            window.location.reload();
        }
        catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload document');
        }
        finally {
            setUploading(false);
        }
    };
    const filteredDocs = documents.filter(doc => (doc.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    return (<div className="dashboard-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>My Documents</h1>
                    <p>Access all your clinical and external documents in one place.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #2D3BAE 0%, #17153B 100%)',
            border: 'none',
            padding: '0.6rem 1.2rem',
            boxShadow: '0 4px 12px rgba(45, 59, 174, 0.2)'
        }}>
                    <FiPlus /> Upload Document
                </button>
            </div>

            <div className="content-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="input-with-icon-simple" style={{ maxWidth: '400px', flex: 1 }}>
                        <FiSearch />
                        <input type="text" placeholder="Search documents by name, type or notes..." className="form-control" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Document Name</th>
                                <th>Type</th>
                                <th>Source</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={5} className="text-center p-lg">Retrieving documents...</td></tr>) : filteredDocs.length > 0 ? (filteredDocs.map((doc, idx) => (<tr key={idx}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FiClock style={{ color: '#94a3b8' }}/>
                                                {new Date(doc.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: '#1e293b' }}>
                                                <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
            }}>
                                                    <FiFile />
                                                </div>
                                                {doc.name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-pill blue">{doc.type}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                {doc.source}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => generatePDF(doc, false)} title="View PDF Document" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px'
            }}>
                                                    <FiDownload /> {doc.url ? 'View' : 'PDF'}
                                                </button>

                                                <button onClick={() => handleDelete(doc)} title="Delete Document" disabled={deletingId === doc.id} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                background: '#FEF2F2',
                color: '#EF4444',
                border: '1.5px solid #FECACA',
                borderRadius: '8px',
                cursor: deletingId === doc.id ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                opacity: deletingId === doc.id ? 0.7 : 1
            }} onMouseEnter={e => {
                if (deletingId === doc.id)
                    return;
                e.currentTarget.style.background = '#EF4444';
                e.currentTarget.style.color = '#fff';
            }} onMouseLeave={e => {
                if (deletingId === doc.id)
                    return;
                e.currentTarget.style.background = '#FEF2F2';
                e.currentTarget.style.color = '#EF4444';
            }}>
                                                    <FiTrash2 size={13}/> {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>))) : (<tr>
                                    <td colSpan={5} className="text-center p-xl">
                                        <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                                            <FiFile size={48}/>
                                        </div>
                                        <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No documents found</h3>
                                        <p style={{ color: '#94a3b8' }}>Documents uploaded by you or the clinic will appear here.</p>
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Embedded PDF Preview Modal */}
            {previewUrl && (<div className="modal-overlay" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2000, backdropFilter: 'blur(4px)'
            }}>
                    <div className="modal-content" style={{
                background: 'white', padding: '1.5rem', borderRadius: '16px',
                width: '90%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column'
            }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{previewName || 'Document Preview'}</h2>
                            <button onClick={() => setPreviewUrl(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <FiX size={24}/>
                            </button>
                        </div>
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview"/>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setPreviewUrl(null)} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none' }}>Close Window</button>
                        </div>
                    </div>
                </div>)}

            {/* Upload Modal */}
            {showUploadModal && (<div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
            }}>
                    <div className="modal-content" style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Upload New Document</h2>
                            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <FiX size={24}/>
                            </button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 500 }}>Select Clinic</label>
                                <select className="form-control" required value={uploadForm.clinicId} onChange={e => setUploadForm({ ...uploadForm, clinicId: e.target.value })}>
                                    <option value="">-- Choose Clinic --</option>
                                    {clinics.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 500 }}>Document Name</label>
                                <input type="text" className="form-control" placeholder="e.g. Lab Results, ID Card" required value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}/>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 500 }}>Category</label>
                                <select className="form-control" value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}>
                                    {(() => {
                const defaultCats = [
                    'Outside Lab Report',
                    'Outside Radiology Report',
                    'Sick Leave',
                    'Medical Report',
                    'Previous History',
                    'Consent Form',
                    'Insurance Card',
                    'ID Card / Passport',
                    'Other Document'
                ];
                // Collect all unique custom types from ALL clinics the patient is enrolled in
                const allCustomTypes = clinics.flatMap(c => c.documentTypes || []);
                const combined = Array.from(new Set([...defaultCats, ...allCustomTypes]));
                return combined.map(t => (<option key={t} value={t}>{t}</option>));
            })()}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 500 }}>Upload File (PDF or Image)</label>
                                <input type="file" className="form-control" accept=".pdf,image/png,image/jpeg,image/jpg" required style={{ padding: '0.5rem' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    if (file.size > 8 * 1024 * 1024) {
                        // Assuming toast is available
                        toast.error('File size must be less than 8MB');
                        e.target.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setUploadForm(prev => ({
                            ...prev,
                            url: reader.result,
                            name: prev.name || file.name.replace(/\.[^/.]+$/, "")
                        }));
                    };
                    reader.readAsDataURL(file);
                }
            }}/>
                                <small style={{ color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                                    Accepted formats: PDF, PNG, JPG (Max 8MB)
                                </small>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)} style={{ flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading} style={{ flex: 1, background: '#2D3BAE', border: 'none' }}>
                                    {uploading ? 'Processing...' : 'Add Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>)}
        </div>);
};
export default Documents;
