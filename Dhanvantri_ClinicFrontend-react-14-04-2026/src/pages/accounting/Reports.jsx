import { useState, useMemo, useEffect } from 'react';
import { FiDownload, FiFilter, FiCalendar, FiSearch, FiInfo } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import './Reports.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import { billingService } from '../../services/billing.service';
const AccountingReports = () => {
    const { invoices, patients } = useApp();
    const { selectedClinic } = useAuth();
    const { formatMoney, symbol } = useCurrency();
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [corporateSummary, setCorporateSummary] = useState(null);
    const [loadingCorporate, setLoadingCorporate] = useState(false);
    const filteredInvoices = useMemo(() => {
        const clinicInvoices = invoices.filter((inv) => inv.clinicId === selectedClinic?.id);
        return clinicInvoices.filter((inv) => {
            const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
            const patient = (patients || []).find((p) => p.id === Number(inv.patientId));
            const patientName = patient?.name?.toLowerCase() || 'unknown';
            const invoiceId = inv.id?.toLowerCase() || '';
            const serviceDesc = (inv.items || []).map((i) => i.description || '').join(' ').toLowerCase();
            const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                invoiceId.includes(searchTerm.toLowerCase()) ||
                serviceDesc.includes(searchTerm.toLowerCase());
            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && new Date(inv.date || inv.createdAt) >= new Date(dateRange.start);
            }
            if (dateRange.end) {
                const end = new Date(dateRange.end);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && new Date(inv.date || inv.createdAt) <= end;
            }
            return matchesStatus && matchesSearch && matchesDate;
        });
    }, [invoices, filterStatus, searchTerm, dateRange, patients, selectedClinic?.id]);
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount), 0);
    useEffect(() => {
        const loadCorporateSummary = async () => {
            try {
                setLoadingCorporate(true);
                const res = await billingService.getCorporatePharmacySummary(reportMonth);
                setCorporateSummary(res?.data ?? res ?? null);
            }
            catch (error) {
                console.error('Corporate summary failed', error);
                setCorporateSummary(null);
            }
            finally {
                setLoadingCorporate(false);
            }
        };
        loadCorporateSummary();
    }, [reportMonth]);
    const exportToPDF = async () => {
        try {
            const doc = new jsPDF();
            await addClinicHeader(doc, selectedClinic, 'DETAILED FINANCIAL REPORT');
            const tableColumn = ["Date", "Invoice #", "Patient", "Status", "Amount"];
            const tableRows = [];
            filteredInvoices.forEach((inv) => {
                const patient = (patients || []).find((p) => p.id === Number(inv.patientId));
                const invoiceData = [
                    inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-',
                    inv.id,
                    patient?.name || 'Unknown',
                    inv.status.toUpperCase(),
                    `${symbol} ${Number(inv.totalAmount || inv.amount).toFixed(2)}`
                ];
                tableRows.push(invoiceData);
            });
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 3.5 },
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    4: { halign: 'right', fontStyle: 'bold' }
                }
            });
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Aggregated Revenue: ${symbol} ${totalRevenue.toFixed(2)}`, doc.internal.pageSize.width - 15, finalY, { align: 'right' });
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(150);
                doc.text(`Financial Audit Report | Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        }
        catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };
    return (<div className="reports-page-container">
            <div className="reports-header">
                <div>
                    <h1>Financial Reporting</h1>
                    <p>Audit and analyze all clinical transactions and invoices.</p>
                </div>
                <button className="btn-download-pdf" onClick={exportToPDF}>
                    <FiDownload />
                    <span>Download Audit Report</span>
                </button>
            </div>

            <div className="filter-section card">
                <div className="filter-grid">
                    <div className="filter-group">
                        <label><FiSearch /> Comprehensive Search</label>
                        <input type="text" placeholder="Invoice #, Patient, Item..." className="filter-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="filter-group">
                        <label><FiFilter /> Status</label>
                        <select className="filter-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="All">All Transactions</option>
                            <option value="Paid">Cleared / Paid</option>
                            <option value="Pending">Outstanding / Pending</option>
                            <option value="Cancelled">Voided / Cancelled</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label><FiCalendar /> Start Date</label>
                        <input type="date" className="filter-input" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}/>
                    </div>
                    <div className="filter-group">
                        <label><FiCalendar /> End Date</label>
                        <input type="date" className="filter-input" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}/>
                    </div>
                </div>
            </div>

            <div className="reports-table-card card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0 }}>Corporate Pharmacy Monthly Summary</h3>
                    <input type="month" className="filter-input" style={{ maxWidth: '180px' }} value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}/>
                </div>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {loadingCorporate ? (<p style={{ margin: 0 }}>Loading corporate summary...</p>) : corporateSummary ? (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div><strong>Total Corporate Bills:</strong> {corporateSummary.totalBills || 0}</div>
                        <div><strong>Total Users:</strong> {corporateSummary.totalUsers || 0}</div>
                        <div><strong>Total Amount:</strong> {formatMoney(corporateSummary.totalAmount || 0)}</div>
                    </div>) : (<p style={{ margin: 0 }}>No corporate pharmacy summary available.</p>)}
                </div>
                <div className="table-responsive" style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>User</th>
                                <th>Employee Code</th>
                                <th>Medicine Consumption</th>
                                <th>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!corporateSummary?.userConsumption?.length ? (<tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>No user-wise consumption for selected month.</td></tr>) : corporateSummary.userConsumption.map((row, idx) => (<tr key={`${row.companyName}-${row.userName}-${idx}`}>
                                <td>{row.companyName}</td>
                                <td>{row.userName}</td>
                                <td>{row.employeeCode || '-'}</td>
                                <td>{(row.medicines || []).map(m => `${m.name} x${m.quantity}`).join(', ')}</td>
                                <td>{formatMoney(row.totalAmount || 0)}</td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
                <div className="table-responsive" style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Total Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!corporateSummary?.medicineConsumption?.length ? (<tr><td colSpan={2} style={{ textAlign: 'center', padding: '1rem' }}>No medicine consumption data.</td></tr>) : corporateSummary.medicineConsumption.map((row, idx) => (<tr key={`${row.name}-${idx}`}>
                                <td>{row.name}</td>
                                <td>{row.quantity}</td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
                <div className="table-responsive">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Billing Date</th>
                                <th>Invoice #</th>
                                <th>Patient Name</th>
                                <th>Charge Items</th>
                                <th>Total Value</th>
                                <th>Cleared Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => {
            const patient = patients.find((p) => p.id === Number(inv.patientId));
            return (<tr key={inv.id}>
                                        <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                                            {new Date(inv.createdAt || inv.date).toLocaleDateString()}
                                        </td>
                                        <td><strong>{inv.id}</strong></td>
                                        <td style={{ fontWeight: 600 }}>{patient?.name || 'Unknown Patient'}</td>
                                        <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                            {inv.items?.length || 0} items
                                        </td>
                                        <td style={{ fontWeight: 800, color: '#1e293b' }}>{formatMoney(inv.totalAmount || inv.amount)}</td>
                                        <td>
                                            <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>);
        }) : (<tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <FiInfo size={32}/>
                                            No financial records match your current refined filters.
                                        </div>
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>

                {filteredInvoices.length > 0 && (<div className="total-footer">
                        <div className="total-box">
                            <span className="total-label">Aggregated Total:</span>
                            <span className="total-amount">{formatMoney(totalRevenue)}</span>
                        </div>
                    </div>)}
            </div>
        </div>);
};
export default AccountingReports;
