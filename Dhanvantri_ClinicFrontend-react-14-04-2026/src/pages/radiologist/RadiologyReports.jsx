import { useState, useEffect } from 'react';
import { FiPieChart, FiSearch, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import '../SharedDashboard.css';
const RadiologyReports = () => {
    const { selectedClinic } = useAuth();
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await labService.getOrders('RADIOLOGY');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data))
                data = response.data;
            else if (Array.isArray(response))
                data = response;
            else if (response?.data !== undefined)
                data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
        }
        catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load reports');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOrders();
    }, []);
    const filteredAndSortedOrders = orders
        .filter((o) => {
        const name = (o.patient?.name || '').toLowerCase();
        const id = String(o.patientId || o.patient?.id || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || id.includes(search);
    })
        .sort((a, b) => {
        let valA, valB;
        if (sortBy === 'date') {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
        }
        else if (sortBy === 'name') {
            valA = (a.patient?.name || '').toLowerCase();
            valB = (b.patient?.name || '').toLowerCase();
        }
        else if (sortBy === 'test') {
            valA = (a.testName || '').toLowerCase();
            valB = (b.testName || '').toLowerCase();
        }
        if (valA < valB)
            return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB)
            return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    const downloadReport = async (order) => {
        try {
            // Check if findings contain a JSON-encoded PDF attachment
            const rawFindings = order.results || order.resultText || order.findings || '';
            let pdfAttachment = null;
            try {
                if (rawFindings && rawFindings.trim().startsWith('{')) {
                    const parsed = JSON.parse(rawFindings);
                    if (parsed.type === 'pdf_attachment')
                        pdfAttachment = parsed;
                }
            }
            catch (e) {
                // Not JSON, treat as text results
            }
            if (pdfAttachment && pdfAttachment.fileData) {
                // If there's an attached PDF, open/save that directly
                const link = document.createElement('a');
                link.href = pdfAttachment.fileData;
                link.download = pdfAttachment.fileName || `radiology-report-${order.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Original PDF scan report downloaded');
                return;
            }
            // Generate a standard PDF if no attachment exists
            const doc = new jsPDF();
            const startY = await addClinicHeader(doc, selectedClinic, 'Radiology Scan Report');
            const reportDetails = [
                ['Patient Name', order.patient?.name || '—'],
                ['Patient ID', `#${order.patientId || order.patient?.id || '—'}`],
                ['Scan Type', order.testName || '—'],
                ['Date of Scan', new Date(order.createdAt).toLocaleDateString()],
                ['Status', order.testStatus || order.status || '—'],
                ['Report ID', String(order.id)]
            ];
            autoTable(doc, {
                body: reportDetails,
                startY: startY,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 50, fontStyle: 'bold', fillColor: [241, 245, 249] },
                    1: { cellWidth: 'auto' }
                }
            });
            if (rawFindings) {
                const finalY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Scan Findings / Results:', 15, finalY);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const splitFindings = doc.splitTextToSize(rawFindings, 180);
                doc.text(splitFindings, 15, finalY + 7);
            }
            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            doc.save(`radiology-report-${order.patient?.name || 'patient'}-${order.id}.pdf`);
            toast.success('Generated report downloaded');
        }
        catch (error) {
            console.error("Failed to handle report:", error);
            toast.error("Failed to process scan report download");
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {selectedClinic?.logo && (<div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid #E2E8F0', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${selectedClinic.logo}`} alt="Clinic Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/>
                        </div>)}
                    <div>
                        <h1>{selectedClinic?.name || 'Radiology Reports'}</h1>
                        <p>Comprehensive history of patient imaging scans and reports.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders}>
                        <FiRefreshCw />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            <div className="content-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2><FiPieChart /> Patient Scan History</h2>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ maxWidth: '300px' }}>
                            <div className="input-with-icon-simple">
                                <FiSearch />
                                <input type="text" placeholder="Search by Name or ID..." className="form-control" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </div>
                        </div>
                        <select className="form-control" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="date">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                            <option value="test">Sort by Scan Type</option>
                        </select>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Patient ID</th>
                                <th>Patient Name</th>
                                <th>Scan Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading reports...</td></tr>) : filteredAndSortedOrders.length > 0 ? (filteredAndSortedOrders.map((order) => (<tr key={order.id}>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>#{order.patientId || order.patient?.id}</td>
                                        <td style={{ fontWeight: 600 }}>{order.patient?.name || 'Unknown'}</td>
                                        <td>{order.testName}</td>
                                        <td>
                                            <span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase().replace(' ', '-')}`}>
                                                {order.testStatus || order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-primary btn-sm btn-with-icon" onClick={() => downloadReport(order)} style={{
                background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                border: 'none',
                color: 'white'
            }}>
                                                <FiPrinter />
                                                <span>Print PDF</span>
                                            </button>
                                        </td>
                                    </tr>))) : (<tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
export default RadiologyReports;
