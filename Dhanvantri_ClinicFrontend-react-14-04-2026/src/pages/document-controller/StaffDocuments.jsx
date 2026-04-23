import { useState, useEffect } from 'react';
import { FiFileText, FiRefreshCw, FiEye, FiDownload } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
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
        link.download = fileName || `staff-document-${r.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    const lines = [
        `Staff: ${r.staffName || '—'}`,
        `Staff ID: #${r.staffId ?? '—'}`,
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
    a.download = `staff-document-${r.staffName || 'staff'}-${r.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};
const StaffDocuments = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewRecord, setViewRecord] = useState(null);
    const fetchRecords = async () => {
        try {
            setRefreshing(true);
            const res = await documentService.getStaffRecords();
            setRecords(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        }
        catch (error) {
            console.error('Failed to fetch staff records:', error);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        fetchRecords();
    }, []);
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Staff Documents</h1>
                    <p>View staff-related documents and clinical records.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchRecords} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>Refresh</span>
                </button>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiFileText /> Document List</h2>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Doc Type</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (<tr><td colSpan={4} className="text-center">Loading...</td></tr>) : records.length > 0 ? records.map((r) => (<tr key={r.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{r.staffName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: #{r.staffId}{r.staffRole ? ` · ${r.staffRole}` : ''}</div>
                                        </td>
                                        <td>{r.type || '—'}</td>
                                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary btn-sm" title="View" onClick={() => setViewRecord(r)} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                <FiEye />
                                            </button>
                                            <button className="btn btn-primary btn-sm" title="Download" onClick={() => downloadRecord(r)} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                <FiDownload />
                                            </button>
                                        </td>
                                    </tr>)) : (<tr><td colSpan={4} className="text-center">No staff documents found.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Staff Document Details">
                {viewRecord && (() => {
            const { notes, fileName } = parseRecordData(viewRecord);
            return (<div style={{ lineHeight: 1.6 }}>
                            <p><strong>Staff:</strong> {viewRecord.staffName} (ID: #{viewRecord.staffId})</p>
                            {viewRecord.staffRole && <p><strong>Role:</strong> {viewRecord.staffRole}</p>}
                            <p><strong>Document Type:</strong> {viewRecord.type || '—'}</p>
                            <p><strong>Date:</strong> {viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '—'}</p>
                            {fileName && <p><strong>File Name:</strong> {fileName}</p>}
                            {notes && <p><strong>Notes:</strong> {notes}</p>}
                            <div style={{ marginTop: '1rem' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => { downloadRecord(viewRecord); setViewRecord(null); }}>
                                    <FiDownload /> Download
                                </button>
                            </div>
                        </div>);
        })()}
            </Modal>
        </div>);
};
export default StaffDocuments;
