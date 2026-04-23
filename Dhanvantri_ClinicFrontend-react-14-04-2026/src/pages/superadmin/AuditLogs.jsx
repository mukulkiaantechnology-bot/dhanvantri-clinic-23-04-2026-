import { useState, useEffect } from 'react';
import { FiFileText, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import { superService } from '../../services/super.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AuditLogs.css';
const AuditLogs = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchAuditLogs();
    }, [searchTerm, filterAction]);
    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (searchTerm)
                filters.search = searchTerm;
            if (filterAction !== 'all')
                filters.action = filterAction;
            const res = await superService.getAuditLogs(filters);
            setAuditLogs(res.data?.logs || []);
        }
        catch (error) {
            console.error('Failed to fetch audit logs:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleExport = async () => {
        const doc = new jsPDF();
        // Add Logo
        try {
            const logoImg = new Image();
            logoImg.src = '/assets/ev-logo.png';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });
            if (logoImg.complete && logoImg.naturalWidth > 0) {
                const imgWidth = 25;
                const imgHeight = (logoImg.height * imgWidth) / logoImg.width;
                doc.addImage(logoImg, 'PNG', 14, 12, imgWidth, imgHeight);
            }
        }
        catch (error) {
            console.error('Failed to add logo to PDF:', error);
        }
        const textStartX = 45; // Shift text to right of logo
        // Add Professional Header
        doc.setFontSize(22);
        doc.setTextColor(45, 59, 174); // #2D3BAE Indigo color
        doc.text('Dhanwantri Hospital OS', textStartX, 22);
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text('System Audit Log Report', textStartX, 32);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, textStartX, 41);
        doc.text(`Total Records: ${auditLogs.length}`, textStartX, 46);
        // Add a horizontal line
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 52, 196, 52);
        // Map data for table
        const tableBody = auditLogs.map((log) => [
            new Date(log.timestamp).toLocaleString(),
            log.action,
            log.performedBy,
            log.ipAddress || 'N/A',
            typeof log.details === 'object' && log.details
                ? Object.entries(log.details)
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join('\n')
                : log.details || 'N/A'
        ]);
        // Generate Table
        autoTable(doc, {
            startY: 58,
            head: [['Timestamp', 'Action', 'Performed By', 'IP Address', 'Details']],
            body: tableBody,
            headStyles: {
                fillColor: [45, 59, 174], // #2D3BAE
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // light background for readability
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 35 }, // Timestamp
                1: { cellWidth: 40 }, // Action
                2: { cellWidth: 30 }, // Performed By
                3: { cellWidth: 25 }, // IP
                4: { cellWidth: 'auto' } // Details
            },
            theme: 'striped'
        });
        // Save PDF
        doc.save(`audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (<div className="audit-logs-page">
            <div className="page-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p>Track all system activities and administrative actions.</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={handleExport} disabled={auditLogs.length === 0}>
                    <FiDownload />
                    <span>Export Logs</span>
                </button>
            </div>

            <div className="table-controls card">
                <div className="search-box">
                    <FiSearch />
                    <input type="text" placeholder="Search by action or user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <div className="filter-box">
                    <FiFilter />
                    <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                        <option value="all">All Actions</option>
                        <option value="Clinic">Clinic Actions</option>
                        <option value="Admin">Admin Actions</option>
                        <option value="Module">Module Actions</option>
                        <option value="Login">Login Actions</option>
                    </select>
                </div>
            </div>

            <div className="table-container card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (<tr>
                                <td colSpan={5} className="empty-state">
                                    <p>Loading...</p>
                                </td>
                            </tr>) : auditLogs.length === 0 ? (<tr>
                                <td colSpan={5} className="empty-state">
                                    <FiFileText size={48}/>
                                    <p>No audit logs found</p>
                                </td>
                            </tr>) : (auditLogs.map((log) => (<tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>
                                        <span className="action-badge">{log.action}</span>
                                    </td>
                                    <td>{log.performedBy}</td>
                                    <td><code>{log.ipAddress || 'N/A'}</code></td>
                                    <td className="details-cell">
                                        {typeof log.details === 'object' && log.details
                ? Object.entries(log.details).map(([key, value]) => (<span key={key} className="detail-item">
                                                    <strong>{key}:</strong> {String(value)}
                                                </span>))
                : log.details || 'N/A'}
                                    </td>
                                </tr>)))}
                    </tbody>
                </table>
            </div>
        </div>);
};
export default AuditLogs;
