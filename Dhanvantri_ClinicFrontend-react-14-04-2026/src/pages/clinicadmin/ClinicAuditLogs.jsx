import { useState } from 'react';
import { FiFileText, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import './ClinicAuditLogs.css';
const ClinicAuditLogs = () => {
    const { selectedClinic } = useAuth();
    const { auditLogs } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    // Logs are already clinic-filtered from API; apply only UI search/filter here
    const clinicLogs = (auditLogs || []).filter((log) => {
        if (!log || !log.action || !log.performedBy)
            return false;
        const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
        return matchesSearch && matchesFilter;
    });
    const handleExport = async () => {
        const doc = new jsPDF();
        // Add Professional Branding Header with Logo
        const startY = await addClinicHeader(doc, selectedClinic, 'Clinic Audit Log Report');
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, startY + 5);
        doc.text(`Total Records: ${clinicLogs.length}`, 14, startY + 10);
        // Map data for table
        const tableBody = clinicLogs.map((log) => [
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
            startY: startY + 20,
            head: [['Timestamp', 'Action', 'Performed By', 'IP Address', 'Details']],
            body: tableBody,
            headStyles: {
                fillColor: [45, 59, 174], // #2D3BAE
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 },
                4: { cellWidth: 'auto' }
            },
            theme: 'striped'
        });
        // Save PDF
        doc.save(`${selectedClinic?.name?.toLowerCase().replace(/\s+/g, '-')}-audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (<div className="clinic-audit-logs-page">
            <div className="page-header">
                <div>
                    <h1>System Audit Logs</h1>
                    <p>Comprehensive trail of all administrative and clinical activities.</p>
                </div>
                <button className="btn btn-primary btn-no-hover" onClick={handleExport}>
                    <FiDownload /> <span>Export Report</span>
                </button>
            </div>

            <div className="audit-controls card">
                <div className="search-box-audit">
                    <FiSearch />
                    <input type="text" placeholder="Search logs by action, user, or IP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <div className="filter-group">
                    <div className="filter-item">
                        <FiFilter />
                        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                            <option value="all">Everywhere</option>
                            <option value="Staff">Staff Management</option>
                            <option value="Form">Medical Forms</option>
                            <option value="Booking">Appointments</option>
                            <option value="Settings">System Settings</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container-audit card">
                <div className="table-header-audit">
                    <h3>Recent Activities</h3>
                    <div className="log-count">
                        Displaying {clinicLogs.length} records
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Activity Type</th>
                                <th>Entity / User</th>
                                <th>Network IP</th>
                                <th className="text-right">Activity Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinicLogs.length === 0 ? (<tr>
                                    <td colSpan={5}>
                                        <div className="empty-state-audit">
                                            <FiFileText size={48}/>
                                            <h3>No Activity Found</h3>
                                            <p>No audit logs match your current search or filter criteria.</p>
                                        </div>
                                    </td>
                                </tr>) : (clinicLogs.map((log) => (<tr key={log.id}>
                                        <td className="time-cell">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                            <span className="time-sub">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td>
                                            <span className={`action-badge ${log.action.toLowerCase().split(' ')[0]}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="user-cell">
                                                <strong>{log.performedBy}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <code className="ip-code">{log.ipAddress || '---'}</code>
                                        </td>
                                        <td className="details-cell text-right">
                                            <div className="details-wrapper">
                                                {typeof log.details === 'object'
                ? Object.entries(log.details).slice(0, 3).map(([key, value]) => (<span key={key} className="detail-tag">
                                                            <strong>{key}:</strong> {String(value)}
                                                        </span>))
                : <span className="detail-text">{log.details}</span>}
                                                {typeof log.details === 'object' && Object.keys(log.details).length > 3 && (<span className="more-tag">+{Object.keys(log.details).length - 3} more</span>)}
                                            </div>
                                        </td>
                                    </tr>)))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
export default ClinicAuditLogs;
