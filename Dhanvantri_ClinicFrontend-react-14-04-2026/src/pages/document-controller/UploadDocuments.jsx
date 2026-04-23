import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiFileText, FiUser, FiUsers, FiSearch, FiChevronDown } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
import { receptionService } from '../../services/reception.service';
import { clinicService } from '../../services/clinic.service';
import '../SharedDashboard.css';
const DEFAULT_DOC_TYPES = [
    'Outside Lab Report',
    'Outside Radiology Report',
    'Sick Leave',
    'Medical Report',
    'Previous History',
    'Consent Form',
    'Insurance Card'
];
const UploadDocuments = () => {
    const navigate = useNavigate();
    const [uploadFor, setUploadFor] = useState('patient');
    const [patientId, setPatientId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [docType, setDocType] = useState('Outside Lab Report');
    const [fileName, setFileName] = useState('');
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [patients, setPatients] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [docTypes, setDocTypes] = useState(DEFAULT_DOC_TYPES);
    // Search & Dropdown State
    const [patientSearch, setPatientSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    useEffect(() => {
        clinicService.getClinicDetails()
            .then((res) => {
            const clinicData = res.data?.data || res.data;
            const customTypes = Array.isArray(clinicData?.documentTypes) ? clinicData.documentTypes : [];
            // Merge defaults with custom types and remove duplicates
            const combinedTypes = Array.from(new Set([...DEFAULT_DOC_TYPES, ...customTypes]));
            if (combinedTypes.length > 0) {
                setDocTypes(combinedTypes);
                // Only set default docType if it's currently at the initial value or not in the list
                if (!docType || !combinedTypes.includes(docType)) {
                    setDocType(combinedTypes[0]);
                }
            }
        })
            .catch(err => console.error('Failed to fetch dynamic doc types:', err));
    }, []);
    useEffect(() => {
        receptionService.getPatients()
            .then((res) => {
            const list = res?.data ?? res ?? [];
            setPatients(Array.isArray(list) ? list : []);
        })
            .catch(() => setPatients([]))
            .finally(() => setLoadingPatients(false));
    }, []);
    useEffect(() => {
        clinicService.getStaff()
            .then((res) => {
            const raw = res?.data ?? res ?? [];
            const list = Array.isArray(raw) ? raw : [];
            setStaffList(list.map((s) => ({
                id: s.id,
                name: s.user?.name || s.name || s.email || `Staff #${s.id}`
            })));
        })
            .catch(() => setStaffList([]))
            .finally(() => setLoadingStaff(false));
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
    const [selectedFile, setSelectedFile] = useState(null);
    const handleUpload = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitted(true);
        try {
            // Read file as base64 if selected
            let fileData = undefined;
            if (selectedFile) {
                fileData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(selectedFile);
                });
            }
            if (uploadFor === 'patient') {
                const pid = Number(patientId);
                if (!pid) {
                    setError('Please select a patient.');
                    setSubmitted(false);
                    return;
                }
                const res = await documentService.createRecord({
                    patientId: pid,
                    documentType: docType,
                    fileName: selectedFile?.name || fileName || undefined,
                    notes: notes || undefined,
                    fileData: fileData
                });
                const created = res?.data ?? res;
                alert(`Document uploaded successfully with original content! ${created?.patientName ?? 'Patient'} – ${docType}.`);
                setPatientId('');
                navigate('/documents/patient-documents');
            }
            else {
                const sid = Number(staffId);
                if (!sid) {
                    setError('Please select a staff member.');
                    setSubmitted(false);
                    return;
                }
                await documentService.createStaffRecord({
                    staffId: sid,
                    documentType: docType,
                    fileName: selectedFile?.name || fileName || undefined,
                    notes: notes || undefined,
                    fileData: fileData
                });
                alert(`Staff document uploaded successfully with original content! ${docType}.`);
                setStaffId('');
                navigate('/documents/staff-documents');
            }
            setDocType(docTypes[0] || 'Outside Lab Report');
            setFileName('');
            setNotes('');
            setSelectedFile(null);
        }
        catch (err) {
            setError(err?.message || 'Upload failed.');
        }
        finally {
            setSubmitted(false);
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Upload Documents</h1>
                    <p>Upload external documents and link them to patients or staff.</p>
                </div>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiUpload /> Upload External Document</h2>
                </div>
                <form onSubmit={handleUpload} style={{ padding: '2rem' }}>
                    {error && <div className="form-group" style={{ color: 'var(--danger, #dc3545)' }}>{error}</div>}

                    <div className="form-group">
                        <label>Upload for</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="radio" name="uploadFor" checked={uploadFor === 'patient'} onChange={() => setUploadFor('patient')}/>
                                <FiUser /> Patient
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="radio" name="uploadFor" checked={uploadFor === 'staff'} onChange={() => setUploadFor('staff')}/>
                                <FiUsers /> Staff
                            </label>
                        </div>
                    </div>

                    {uploadFor === 'patient' && (<div className="form-group custom-dropdown-container" style={{ position: 'relative' }}>
                            <label>Patient *</label>
                            <div className="form-control" style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: loadingPatients ? '#f8fafc' : '#fff'
            }} onClick={() => !loadingPatients && setIsDropdownOpen(!isDropdownOpen)}>
                                <span style={{ color: !patientId ? '#94a3b8' : 'inherit' }}>
                                    {loadingPatients
                ? 'Loading...'
                : (patients.find(p => String(p.id) === patientId)?.name || 'Select patient')}
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
                    .filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                    (p.phone && p.phone.includes(patientSearch)))
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
                                                    {p.phone && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.phone}</div>}
                                                </div>))}
                                        {patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                    (p.phone && p.phone.includes(patientSearch))).length === 0 && (<div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                    No patients found
                                                </div>)}
                                    </div>
                                </div>)}
                        </div>)}

                    {uploadFor === 'staff' && (<div className="form-group">
                            <label>Staff *</label>
                            <select className="form-control" value={staffId} onChange={(e) => setStaffId(e.target.value)} required={uploadFor === 'staff'} disabled={loadingStaff}>
                                <option value="">{loadingStaff ? 'Loading...' : 'Select staff'}</option>
                                {staffList.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </select>
                        </div>)}

                    <div className="form-group">
                        <label>Document Type</label>
                        <select className="form-control" value={docType} onChange={(e) => setDocType(e.target.value)}>
                            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Select File *</label>
                        <input type="file" className="form-control" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required/>
                        {selectedFile && (<small style={{ color: '#2563eb', fontWeight: 600 }}>
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </small>)}
                    </div>
                    <div className="form-group">
                        <label>Notes (optional)</label>
                        <input type="text" className="form-control" placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)}/>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{
            width: '100%',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1E1B4B 0%, #2D3BAE 100%)',
            border: 'none',
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
        }} disabled={submitted}>
                        <FiFileText /> {uploadFor === 'patient' ? 'Save to Patient File' : 'Save to Staff File'}
                    </button>
                </form>
            </div>
        </div>);
};
export default UploadDocuments;
