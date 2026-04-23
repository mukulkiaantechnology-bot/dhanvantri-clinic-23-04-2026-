import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiSearch, FiFileText, FiClock, FiEye, FiDownload, FiChevronDown } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
import { receptionService } from '../../services/reception.service';
import { clinicService } from '../../services/clinic.service';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
const parseRecordData = (r) => {
    try {
        const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
        return {
            notes: d.notes || '',
            fileName: d.fileName || '',
            fileData: d.fileData || null
        };
    }
    catch {
        return { notes: '', fileName: '', fileData: null };
    }
};
const downloadRecord = (r) => {
    const { notes, fileName, fileData } = parseRecordData(r);
    // If we have actual file content, download it directly
    if (fileData) {
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName || `document-${r.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    const lines = [
        `Patient: ${r.patientName || '—'}`,
        `Patient ID: #${r.patientId ?? '—'}`,
        `Document Type: ${r.type || '—'}`,
        `Date: ${r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}`,
        fileName ? `File Name: ${fileName}` : '',
        notes ? `Notes: ${notes}` : '',
        `Record ID: ${r.id}`
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${r.patientName || 'patient'}-${r.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};
const DocumentControllerDashboard = () => {
    const navigate = useNavigate();
    const [patientId, setPatientId] = useState('');
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewRecord, setViewRecord] = useState(null);
    const [uploadDocType, setUploadDocType] = useState('Previous History');
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploadFiles, setUploadFiles] = useState([]);
    const [patients, setPatients] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [docTypes, setDocTypes] = useState([
        'Previous History',
        'Outside Lab Report',
        'Passport Copy',
        'Insurance Card',
        'Consent Form',
        'Any Other Custom Document'
    ]);
    const fetchData = async () => {
        try {
            const [recRes, statsRes, patRes, clinicRes] = await Promise.all([
                documentService.getRecords(),
                documentService.getStats(),
                receptionService.getPatients().catch(() => ({ data: [] })),
                clinicService.getClinicDetails().catch(() => ({ data: null }))
            ]);
            setRecords(recRes?.data ?? recRes ?? []);
            setStats(statsRes?.data ?? statsRes ?? null);
            const pList = patRes?.data ?? (Array.isArray(patRes) ? patRes : []);
            setPatients(pList);
            // Fetch dynamic doc types
            const clinicData = clinicRes?.data?.data || clinicRes?.data;
            if (clinicData?.documentTypes && Array.isArray(clinicData.documentTypes)) {
                setDocTypes(prev => Array.from(new Set([...prev, ...clinicData.documentTypes])));
            }
        }
        catch (error) {
            console.error('Failed to fetch data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.custom-dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!patientId)
            return alert('Please select a patient.');
        if (uploadFiles.length === 0)
            return alert('Please select at least one file.');
        try {
            setLoading(true);
            // Upload multiple files
            for (const file of uploadFiles) {
                // Read file as base64
                const fileData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                await documentService.createRecord({
                    patientId: Number(patientId),
                    documentType: uploadDocType,
                    fileName: file.name,
                    notes: uploadNotes,
                    fileData: fileData // Pass the actual file content
                });
            }
            alert(`${uploadFiles.length} document(s) uploaded successfully with original content!`);
            setPatientId('');
            setUploadNotes('');
            setUploadFiles([]);
            fetchData();
        }
        catch (err) {
            alert(err?.message || 'Upload failed.');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredRecords = records.filter(r => (r.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.patientId).includes(searchTerm));
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Document Controller Dashboard</h1>
                    <p>Manage and track clinical records and uploads.</p>
                </div>

            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={() => navigate('/documents/archive')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon purple"><FiFileText /></div>
                    <div className="stat-info">
                        <h3>{stats != null ? stats.total : (loading ? '—' : records.length)}</h3>
                        <p>Total Clinical Records</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/documents/upload')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats != null ? stats.pending : (loading ? '—' : records.filter(r => !r.isClosed).length)}</h3>
                        <p>Pending Processing</p>
                    </div>
                </div>
            </div>

            <div className="auto-grid mt-lg">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiUpload /> Upload External Document</h2>
                    </div>
                    <form onSubmit={handleUpload} style={{ padding: '2rem' }}>
                        <div className="form-group custom-dropdown-container" style={{ position: 'relative' }}>
                            <label>Patient *</label>
                            <div className="form-control" style={{
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: loading ? '#f8fafc' : '#fff'
        }} onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}>
                                <span style={{ color: !patientId ? '#94a3b8' : 'inherit' }}>
                                    {loading
            ? 'Loading...'
            : (patients.find(p => String(p.id) === patientId)?.name || 'Select Patient')}
                                </span>
                                <span style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', display: 'flex', alignItems: 'center' }}>
                                    <FiChevronDown />
                                </span>
                            </div>

                            {isDropdownOpen && (<div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                marginTop: '5px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="input-with-icon-simple" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <FiSearch style={{ position: 'absolute', left: '12px', color: '#94a3b8' }}/>
                                            <input type="text" className="form-control" placeholder="Search patient..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} autoFocus style={{ paddingLeft: '2.5rem', marginBottom: 0, height: '38px' }} onClick={(e) => e.stopPropagation()}/>
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {patients
                .filter(p => (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
                (p.phone && p.phone.includes(patientSearch)) ||
                String(p.id).includes(patientSearch))
                .map(p => (<div key={p.id} style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    fontSize: '0.9rem',
                    borderBottom: '1px solid #f8fafc'
                }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => {
                    setPatientId(String(p.id));
                    setIsDropdownOpen(false);
                    setPatientSearch('');
                }}>
                                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        ID: {p.mrn || p.id} {p.phone ? `• ${p.phone}` : ''}
                                                    </div>
                                                </div>))}
                                        {patients.filter(p => (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
                (p.phone && p.phone.includes(patientSearch)) ||
                String(p.id).includes(patientSearch)).length === 0 && (<div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                    No patients found
                                                </div>)}
                                    </div>
                                </div>)}
                        </div>
                        <div className="form-group">
                            <label>Document Type</label>
                            <select className="form-control" value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)}>
                                {docTypes.map(t => (<option key={t} value={t}>{t}</option>))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <input type="text" className="form-control" placeholder="Add notes (optional)..." value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)}/>
                        </div>
                        <div className="form-group">
                            <label>Select Files (Multiple allowed)</label>
                            <input type="file" className="form-control" multiple onChange={(e) => {
            if (e.target.files) {
                setUploadFiles(Array.from(e.target.files));
            }
        }}/>
                            <small style={{ color: '#64748B', display: 'block', marginTop: '0.5rem' }}>
                                Supported: PDF, JPG, PNG, DOCX. Select multiple files to upload at once.
                            </small>
                        </div>
                        <div className="files-preview" style={{ marginBottom: '1rem' }}>
                            {uploadFiles.length > 0 && (<ul style={{ listStyle: 'none', padding: '0.5rem', fontSize: '0.9rem', color: '#334155', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                    {uploadFiles.map((f, i) => (<li key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            • {f.name} ({(f.size / 1024).toFixed(1)} KB)
                                        </li>))}
                                </ul>)}
                        </div>
                        <button type="submit" className="btn btn-primary" style={{
            width: '100%',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
            border: 'none',
            color: 'white',
            transform: 'none',
            transition: 'none',
            boxShadow: 'none'
        }} disabled={uploadFiles.length === 0}>
                            Upload {uploadFiles.length > 0 ? `${uploadFiles.length} Documents` : 'Documents'}
                        </button>
                    </form>
                </div>


                <div className="content-card">
                    <div className="card-header">
                        <h2><FiSearch /> Recent Medical Records</h2>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        <div className="search-box mb-md">
                            <div className="input-with-icon-simple">
                                <FiSearch />
                                <input type="text" className="form-control" placeholder="Search by Patient Name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Doc Type</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (<tr><td colSpan={4} className="text-center">Loading...</td></tr>) : filteredRecords.length > 0 ? filteredRecords.map(r => (<tr key={r.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{r.patientName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: #{r.patientId}</div>
                                            </td>
                                            <td>{r.type}</td>
                                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-primary btn-sm" title="View" onClick={() => setViewRecord(r)} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                    <FiEye />
                                                </button>
                                                <button className="btn btn-primary btn-sm" title="Download" onClick={() => downloadRecord(r)} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                    <FiDownload />
                                                </button>
                                            </td>
                                        </tr>)) : (<tr><td colSpan={4} className="text-center">No records found.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Document Details">
                {viewRecord && (() => {
            // const { notes, fileName } = parseRecordData(viewRecord);
            return (<div style={{ lineHeight: 1.6 }}>
                            <p><strong>Patient:</strong> {viewRecord.patientName} (ID: #{viewRecord.patientId})</p>
                            <p><strong>Document Type:</strong> {viewRecord.documentType || viewRecord.type || '—'}</p>
                            <p><strong>Date:</strong> {viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '—'}</p>
                            <div style={{ marginTop: '1rem' }}>
                                <button onClick={() => { downloadRecord(viewRecord); }}>
                                    <FiDownload /> Download
                                </button>
                            </div>
                        </div>);
        })()}
            </Modal>
        </div>);
};
export default DocumentControllerDashboard;
