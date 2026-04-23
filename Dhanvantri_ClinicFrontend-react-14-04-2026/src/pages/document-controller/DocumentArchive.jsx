import { useState, useEffect } from 'react';
import { FiList, FiEye, FiDownload } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import '../SharedDashboard.css';
const parseRecordData = (r) => {
    try {
        const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
        return { notes: d.notes || '', fileName: d.fileName || '' };
    }
    catch {
        return { notes: '', fileName: '' };
    }
};
const downloadRecord = async (r, clinic) => {
    try {
        const doc = new jsPDF();
        const { notes, fileName } = parseRecordData(r);
        // Add professional header
        const startY = await addClinicHeader(doc, clinic, 'Document Archive Report');
        // Document Details Table
        const tableData = [
            ['Patient Name', r.patientName || '—'],
            ['Patient ID', `#${r.patientId ?? '—'}`],
            ['Document Type', r.type || '—'],
            ['Creation Date', r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'],
            ['Record ID', String(r.id)],
            ['Status', 'Archived']
        ];
        if (fileName)
            tableData.push(['File Name', fileName]);
        autoTable(doc, {
            body: tableData,
            startY: startY,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold', fillColor: [241, 245, 249] },
                1: { cellWidth: 'auto' }
            }
        });
        // Add Notes Section if they exist
        if (notes) {
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Notes / Description:', 15, finalY);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(notes, 180);
            doc.text(splitNotes, 15, finalY + 7);
        }
        // Add footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
        doc.save(`document-${r.patientName || 'patient'}-${r.id}.pdf`);
    }
    catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    }
};
const DocumentArchive = () => {
    const { selectedClinic } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewRecord, setViewRecord] = useState(null);
    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [sortOrder, setSortOrder] = useState('date-desc'); // date-desc, date-asc, name-asc
    const fetchRecords = async () => {
        try {
            const res = await documentService.getRecords({ archived: true });
            setRecords(res?.data ?? res ?? []);
        }
        catch (error) {
            console.error('Failed to fetch records:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRecords();
    }, []);
    // Get unique types for filter dropdown
    const docTypes = ['All', ...Array.from(new Set(records.map(r => r.type || 'Other')))];
    // Filter & Sort Logic
    const filteredRecords = records
        .filter(r => {
        const matchesSearch = (r.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(r.patientId).includes(searchTerm);
        const matchesType = filterType === 'All' || (r.type || 'Other') === filterType;
        return matchesSearch && matchesType;
    })
        .sort((a, b) => {
        if (sortOrder === 'name-asc') {
            return (a.patientName || '').localeCompare(b.patientName || '');
        }
        else if (sortOrder === 'date-asc') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        else {
            // date-desc (default)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Archive</h1>
                    <p>Archived documents and closed records.</p>
                </div>

            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiList /> Archived Records</h2>
                </div>

                {/* Filter & Sort Controls */}
                <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input type="text" className="form-control" placeholder="Filter by Patient Name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    <div style={{ width: '200px' }}>
                        <select className="form-control" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            {docTypes.map(type => (<option key={type} value={type}>{type === 'All' ? 'All Document Types' : type}</option>))}
                        </select>
                    </div>
                    <div style={{ width: '200px' }}>
                        <select className="form-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                            <option value="date-desc">Date (Newest First)</option>
                            <option value="date-asc">Date (Oldest First)</option>
                            <option value="name-asc">Patient Name (A–Z)</option>
                        </select>
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
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
                                {loading ? (<tr><td colSpan={4} className="text-center">Loading...</td></tr>) : filteredRecords.length > 0 ? filteredRecords.map((r) => (<tr key={r.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, cursor: 'pointer', color: '#2563EB', textDecoration: 'underline' }} onClick={() => setSearchTerm(r.patientName)} title="Click to view all documents for this patient">
                                                {r.patientName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: #{r.patientId}</div>
                                        </td>
                                        <td>{r.type || '—'}</td>
                                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary btn-sm btn-no-hover" title="View" onClick={() => setViewRecord(r)}>
                                                <FiEye />
                                            </button>
                                            <button className="btn btn-secondary btn-sm btn-no-hover" title="Download" onClick={() => downloadRecord(r, selectedClinic)}>
                                                <FiDownload />
                                            </button>
                                        </td>
                                    </tr>)) : (<tr><td colSpan={4} className="text-center">No records found matching filters.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Document Details">
                {viewRecord && (() => {
            const { notes, fileName } = parseRecordData(viewRecord);
            return (<div style={{ lineHeight: 1.6 }}>
                            <p><strong>Patient:</strong> {viewRecord.patientName} (ID: #{viewRecord.patientId})</p>
                            <p><strong>Document Type:</strong> {viewRecord.type || '—'}</p>
                            <p><strong>Date:</strong> {viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '—'}</p>
                            {fileName && <p><strong>File Name:</strong> {fileName}</p>}
                            {notes && <p><strong>Notes:</strong> {notes}</p>}
                            <div style={{ marginTop: '1rem' }}>
                                <button onClick={() => { downloadRecord(viewRecord, selectedClinic); setViewRecord(null); }} style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'default',
                    pointerEvents: 'auto'
                }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0f172a'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}>
                                    <FiDownload /> Download
                                </button>
                            </div>
                        </div>);
        })()}
            </Modal>
        </div>);
};
export default DocumentArchive;
