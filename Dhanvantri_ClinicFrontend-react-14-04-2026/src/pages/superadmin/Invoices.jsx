/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { FiSearch, FiDollarSign, FiFileText, FiCheckCircle, FiAlertCircle, FiFilter, FiCalendar, FiDownload } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { superService } from '../../services/super.service';
import { useCurrency } from '../../context/CurrencyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL } from '../../config/config';
import './Invoices.css';
const Invoices = () => {
    const { clinics } = useApp();
    const { formatMoney } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
        clinicId: '',
        month: '',
        type: 'all'
    });
    const [reports, setReports] = useState(null);
    useEffect(() => {
        fetchInvoices();
        fetchReports();
    }, [filters]);
    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await superService.getInvoices({
                ...filters,
                search: searchTerm
            });
            setInvoices(res.data || []);
        }
        catch (error) {
            console.error('Failed to fetch invoices:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const fetchReports = async () => {
        try {
            const res = await superService.getReports(filters);
            setReports(res.data);
        }
        catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    const formatCurrency = (amount) => formatMoney(amount);
    const formatDate = (date) => {
        if (!date)
            return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    const getLogoUrl = (logoPath) => {
        if (!logoPath || typeof logoPath !== 'string')
            return null;
        if (logoPath.startsWith('http'))
            return logoPath;
        const apiUrl = API_URL;
        let backendBase = apiUrl;
        if (apiUrl.includes('/api')) {
            backendBase = apiUrl.split('/api')[0];
        }
        const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
        return `${backendBase}${cleanPath}`;
    };
    const handleImageError = (e) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent && !parent.querySelector('.fallback-icon')) {
            const fallback = document.createElement('div');
            fallback.className = 'fallback-icon';
            fallback.innerHTML = '🏢';
            fallback.style.fontSize = '1.2rem';
            parent.appendChild(fallback);
        }
    };
    const parseInvoiceDescription = (desc) => {
        if (!desc)
            return { note: 'No description', base: 0, tax: 0, percent: 0 };
        try {
            const parsed = JSON.parse(desc);
            return typeof parsed === 'object' ? parsed : { note: desc, base: 0, tax: 0, percent: 0 };
        }
        catch {
            return { note: desc, base: 0, tax: 0, percent: 0 };
        }
    };
    const handleDownloadInvoice = (invoice) => {
        const doc = new jsPDF();
        const details = parseInvoiceDescription(invoice.description);
        // Header
        doc.setFillColor(30, 27, 75);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', 15, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice # : ${invoice.invoiceNumber}`, 140, 20);
        doc.text(`GSTIN : ${invoice.clinic?.gstin || '27AAAEV1234F1Z1'}`, 140, 26);
        doc.text(`Date : ${formatDate(invoice.issuedDate)}`, 140, 32);
        doc.text(`Due Date : ${formatDate(invoice.dueDate)}`, 140, 38);
        // EV Clinic Details
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Dhanwantri Hospital Platform', 15, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Dhanwantri Hospital HIS', 15, 62);
        doc.text('dhanwantrihospitalbarmer.com | support@dhanwantrihospitalbarmer.com', 15, 68);
        // Bill To
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Billed To:', 140, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${invoice.clinic?.name || 'Unknown Facility'}`, 140, 62);
        if (invoice.clinic?.location)
            doc.text(invoice.clinic.location, 140, 68);
        if (invoice.clinic?.email)
            doc.text(invoice.clinic.email, 140, 74);
        if (invoice.clinic?.contact)
            doc.text(invoice.clinic.contact, 140, 80);
        // Status Ribbon
        const isPaid = invoice.status === 'Paid';
        doc.setFillColor(isPaid ? 16 : 239, isPaid ? 185 : 68, isPaid ? 129 : 68);
        doc.rect(15, 85, 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.status.toUpperCase(), 18, 91);
        // Table
        const subtotal = details.base || Number(invoice.amount) || 0;
        const tax = details.tax || 0;
        const total = Number(invoice.amount) || 0;
        autoTable(doc, {
            startY: 105,
            head: [['Description', 'Plan', 'Qty/Users', 'Unit Price', 'Total']],
            body: [
                [
                    details.note || invoice.description,
                    details.plan || 'Standard Subscription',
                    details.users || '1',
                    details.pricePerUser ? formatCurrency(details.pricePerUser) : formatCurrency(subtotal),
                    formatCurrency(subtotal)
                ],
            ],
            theme: 'striped',
            headStyles: { fillColor: [45, 59, 174], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            margin: { left: 15, right: 15 }
        });
        // Totals with GST Breakdown
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Subtotal:', 140, finalY);
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(subtotal), 180, finalY, { align: 'right' });
        // Logic for IGST vs (CGST + SGST)
        // For demo: If location is missing or not in 'Maharashtra', assume IGST
        const isInterState = invoice.clinic?.location && !invoice.clinic.location.includes('Maharashtra');
        if (isInterState) {
            doc.setTextColor(100, 100, 100);
            doc.text(`IGST (18%):`, 140, finalY + 8);
            doc.setTextColor(50, 50, 50);
            doc.text(formatCurrency(tax), 180, finalY + 8, { align: 'right' });
            // Empty space where CGST/SGST would be, to keep Grand Total position consistent
            doc.text('', 140, finalY + 16);
        }
        else {
            const cgst = tax / 2;
            const sgst = tax / 2;
            doc.setTextColor(100, 100, 100);
            doc.text(`CGST (9%):`, 140, finalY + 8);
            doc.setTextColor(50, 50, 50);
            doc.text(formatCurrency(cgst), 180, finalY + 8, { align: 'right' });
            doc.setTextColor(100, 100, 100);
            doc.text(`SGST (9%):`, 140, finalY + 16);
            doc.setTextColor(50, 50, 50);
            doc.text(formatCurrency(sgst), 180, finalY + 16, { align: 'right' });
        }
        doc.setDrawColor(200, 200, 200);
        doc.line(140, finalY + 21, 195, finalY + 21);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 27, 75);
        doc.text('Grand Total:', 140, finalY + 28);
        doc.text(formatCurrency(total), 180, finalY + 28, { align: 'right' });
        // Footer terms
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for choosing Dhanwantri Hospital HIS.', 15, 270);
        doc.text('Payment is due within 7 days of the invoice date.', 15, 275);
        doc.save(`${invoice.invoiceNumber}.pdf`);
    };
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await superService.updateInvoiceStatus(id, newStatus);
            // Update local state
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
            fetchReports(); // Refresh stats
        }
        catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update invoice status');
        }
    };
    return (<div className="invoices-page fade-in">
            <div className="page-header">
                <div>
                    <h2>Subscription & Revenue</h2>
                    <p>Track clinic payments, generate invoices, and monitor financial health</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <p className="stat-label">Total Revenue</p>
                        <h3 className="stat-value">{formatCurrency(reports?.totalRevenue || 0)}</h3>
                        <span className="stat-sub text-success">Paid Invoices</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#3F46B815', color: '#3F46B8' }}>
                        <FiFileText />
                    </div>
                    <div>
                        <p className="stat-label">Total Invoices</p>
                        <h3 className="stat-value">{reports?.totalInvoices || 0}</h3>
                        <span className="stat-sub text-muted">All Time</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p className="stat-label">Paid</p>
                        <h3 className="stat-value">{reports?.paidInvoices || 0}</h3>
                        <span className="stat-sub text-success">Collected</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}>
                        <FiAlertCircle />
                    </div>
                    <div>
                        <p className="stat-label">Unpaid</p>
                        <h3 className="stat-value">{reports?.unpaidInvoices || 0}</h3>
                        <span className="stat-sub text-danger">Pending</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-container mt-lg">
                <div className="filters-header">
                    <div className="search-box-wrap">
                        <FiSearch />
                        <input type="text" placeholder="Search by invoice number or clinic name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && fetchInvoices()}/>
                    </div>
                    <div className="filters-actions">
                        <div className="filter-item">
                            <label>Invoice Status</label>
                            <div className="filter-input-group">
                                <FiFilter />
                                <select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="all">Global (All)</option>
                                    <option value="Paid">Paid Only</option>
                                    <option value="Unpaid">Unpaid Only</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Month</label>
                            <div className="filter-input-group">
                                <FiCalendar />
                                <select name="month" value={filters.month} onChange={handleFilterChange}>
                                    <option value="">Full Year</option>
                                    <option value="01">January</option>
                                    <option value="02">February</option>
                                    <option value="03">March</option>
                                    <option value="04">April</option>
                                    <option value="05">May</option>
                                    <option value="06">June</option>
                                    <option value="07">July</option>
                                    <option value="08">August</option>
                                    <option value="09">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Invoice Type</label>
                            <div className="filter-input-group">
                                <FiFilter />
                                <select name="type" value={filters.type} onChange={handleFilterChange}>
                                    <option value="all">Every Category</option>
                                    <option value="pharmacy">Corporate Pharmacy</option>
                                    <option value="service">Clinical Services</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Select Facility</label>
                            <div className="filter-input-group">
                                <select name="clinicId" value={filters.clinicId} onChange={handleFilterChange}>
                                    <option value="">All Facilities</option>
                                    {clinics.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                            </div>
                        </div>
                        <button className="btn-apply" onClick={fetchInvoices}>Filter Result</button>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="table-container">
                    {isLoading ? (<div className="loading-state">
                            <div className="loader"></div>
                            <p>Querying financial records...</p>
                        </div>) : invoices.length === 0 ? (<div className="empty-state">
                            <FiFileText size={48}/>
                            <p>No invoices found matching your criteria</p>
                        </div>) : (<table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Facility</th>
                                    <th>Billing Category</th>
                                    <th>GST (18%)</th>
                                    <th>Total Payable</th>
                                    <th>Current Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (<tr key={invoice.id}>
                                        <td><span className="invoice-number">{invoice.invoiceNumber}</span></td>
                                        <td>
                                            <div className="clinic-info-cell">
                                                <div className="clinic-avatar-sm">
                                                    {invoice.clinic?.logo ? (<img src={getLogoUrl(invoice.clinic.logo)} alt="" onError={handleImageError}/>) : (<div className="clinic-avatar">
                                                            {invoice.clinic?.name?.charAt(0) || 'C'}
                                                        </div>)}
                                                </div>
                                                <div className="clinic-details-stack">
                                                    <strong>{invoice.clinic?.name || 'N/A'}</strong>
                                                    <span className="text-xs text-muted">{invoice.clinic?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">{parseInvoiceDescription(invoice.description).note || invoice.description || 'N/A'}</div>
                                            <div className="text-xs font-bold" style={{ color: invoice.description?.toLowerCase().includes('pharmacy') ? '#0891b2' : '#4f46e5' }}>
                                                {invoice.description?.toLowerCase().includes('pharmacy') ? 'CORPORATE PHARMACY' : 'SERVICE BILLING'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-semibold">{formatCurrency(parseInvoiceDescription(invoice.description).tax || Number(invoice.amount) * 0.18)}</div>
                                            <div className="text-xs text-muted">CGST+SGST</div>
                                        </td>
                                        <td>
                                            <div className="amount-display">{formatCurrency(Number(invoice.amount))}</div>
                                            <div className="text-xs text-muted">Issued: {formatDate(invoice.issuedDate)}</div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${invoice.status?.toLowerCase() || 'unpaid'} clickable-status`} title="Click to toggle status" onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Unpaid' : 'Paid')} style={{ cursor: 'pointer' }}>
                                                {invoice.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="action-btns">
                                            <button className={`action-btn-mini ${invoice.status === 'Paid' ? 'btn-mark-unpaid' : 'btn-mark-paid'}`} title={`Mark as ${invoice.status === 'Paid' ? 'Unpaid' : 'Paid'}`} onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Unpaid' : 'Paid')}>
                                                {invoice.status === 'Paid' ? <FiAlertCircle /> : <FiCheckCircle />}
                                            </button>
                                            <button className="action-btn-mini btn-view-invoice" title="Download PDF" onClick={() => handleDownloadInvoice(invoice)}>
                                                <FiDownload />
                                            </button>
                                        </td>
                                    </tr>))}
                            </tbody>
                        </table>)}
                </div>
            </div>

        </div>);
};
export default Invoices;
