import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiDollarSign, FiFileText, FiPrinter, FiPlus, FiUser, FiCheck, FiCreditCard, FiShoppingCart, FiEye, FiActivity } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { billingService } from '../../services/billing.service';
import { clinicService } from '../../services/clinic.service';
import Modal from '../../components/Modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader, ensureUnicodeFont } from '../../utils/pdfUtils';
import { buildTaxSummary } from '../../utils/taxCalculator';
import './Dashboard.css';
const Billing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { patients, refreshData } = useApp();
    const { selectedClinic, user } = useAuth();
    const toast = useToast();
    const { formatMoney, symbol } = useCurrency();
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    // Consolidated Invoice Modal State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [pendingItems, setPendingItems] = useState({ consultations: [], orders: [] });
    const [loadingPending, setLoadingPending] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [isPaidImmediate, setIsPaidImmediate] = useState(false);
    const [gstRate, setGstRate] = useState(18);
    const [placeOfSupply, setPlaceOfSupply] = useState(selectedClinic?.location || '');
    const [remarks, setRemarks] = useState('');
    // Pay Invoice State
    const [invoiceToPay, setInvoiceToPay] = useState(null);
    const [payMethod, setPayMethod] = useState('Cash');
    const clinicPatients = (patients || []).filter((p) => Number(p.clinicId || selectedClinic?.id) === Number(selectedClinic?.id));
    const fetchInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const res = await billingService.getInvoices();
            setInvoices(res.data || res || []);
        }
        catch (error) {
            console.error(error);
            toast.error('Failed to load invoices');
        }
        finally {
            setLoadingInvoices(false);
        }
    };
    const fetchPendingItems = async (pId) => {
        try {
            setLoadingPending(true);
            const res = await billingService.getPendingItems(pId);
            setPendingItems(res.data || { consultations: [], orders: [] });
            // By default, select all
            const allItems = [
                ...(res.data?.consultations || []),
                ...(res.data?.orders || [])
            ];
            setSelectedItems(allItems);
        }
        catch (error) {
            console.error(error);
            toast.error('Failed to load pending items for patient');
        }
        finally {
            setLoadingPending(false);
        }
    };
    useEffect(() => {
        fetchInvoices();
    }, []);
    useEffect(() => {
        setPlaceOfSupply(selectedClinic?.location || '');
    }, [selectedClinic?.location]);
    useEffect(() => {
        if (selectedPatientId) {
            fetchPendingItems(Number(selectedPatientId));
        }
        else {
            setPendingItems({ consultations: [], orders: [] });
            setSelectedItems([]);
        }
    }, [selectedPatientId]);
    // Handle focus from navigation
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const pId = queryParams.get('focusedPatientId');
        if (pId && patients) {
            setSelectedPatientId(pId);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, patients]);
    const handleToggleItem = (item) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id && i.type === item.type);
            if (exists) {
                return prev.filter(i => !(i.id === item.id && i.type === item.type));
            }
            else {
                return [...prev, item];
            }
        });
    };
    const clinicState = selectedClinic?.location || '';
    const subtotalAmount = selectedItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxSummary = buildTaxSummary({
        subtotal: subtotalAmount,
        gstRate,
        clinicState,
        placeOfSupply
    });
    const handleSubmitInvoice = async (e) => {
        e.preventDefault();
        if (!selectedPatientId || selectedItems.length === 0) {
            toast.error('Please select a patient and at least one item');
            return;
        }
        try {
            await billingService.createInvoice({
                patientId: selectedPatientId,
                items: selectedItems,
                subtotal: taxSummary.subtotal,
                gstRate: taxSummary.gstRate,
                taxSummary,
                placeOfSupply: taxSummary.placeOfSupply,
                clinicState: taxSummary.clinicState,
                totalTax: taxSummary.totalTax,
                totalAmount: taxSummary.grandTotal,
                remarks: remarks || null,
                status: isPaidImmediate ? 'Paid' : 'Pending',
                paymentMethod: isPaidImmediate ? paymentMethod : null,
                createdBy: user?.id
            });
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsModalOpen(false);
                setSelectedPatientId('');
                setSelectedItems([]);
                setGstRate(18);
                setPlaceOfSupply(selectedClinic?.location || '');
                setRemarks('');
                fetchInvoices();
                refreshData?.();
            }, 1500);
        }
        catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to create invoice');
        }
    };
    const handleMarkPaid = async () => {
        if (!invoiceToPay)
            return;
        try {
            await billingService.updateInvoiceStatus(invoiceToPay.id, 'Paid', payMethod);
            toast.success('Payment recorded successfully');
            setIsPayModalOpen(false);
            setInvoiceToPay(null);
            fetchInvoices();
            refreshData?.();
        }
        catch (err) {
            toast.error('Failed to update payment status');
        }
    };
    const handlePrint = async (invoice) => {
        try {
            const invoiceSummary = invoice.taxSummary || buildTaxSummary({
                subtotal: Number(invoice.subtotal ?? invoice.totalAmount ?? 0),
                gstRate: Number(invoice.gstRate || 0),
                clinicState: invoice.clinicState || clinicState,
                placeOfSupply: invoice.placeOfSupply || placeOfSupply || clinicState
            });
            // Requirement 1: Fixed A4 layout and proper margins
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const unicodeFontEnabled = await ensureUnicodeFont(doc);
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15; // Balanced 15mm margin (~56px)
            // Requirement 2: Header Section
            const clinicRes = await clinicService.getClinicDetails();
            const clinic = clinicRes.data?.data || clinicRes.data || selectedClinic;
            // Professional header with utility
            await addClinicHeader(doc, clinic, 'TAX INVOICE');
            let yPos = 50;
            // Requirement 3: Invoice Information Section (Aligned Boxes)
            const contentWidth = pageWidth - (margin * 2);
            const boxWidth = (contentWidth - 6) / 2;
            // LEFT BOX: Billed To
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, yPos, boxWidth, 32, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100);
            doc.text('BILLED TO', margin + 5, yPos + 7);
            doc.setFontSize(10);
            doc.setTextColor(31, 41, 55);
            doc.text(invoice.patient?.name || 'N/A', margin + 5, yPos + 15);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            if (invoice.patient?.phone)
                doc.text(`Phone: ${invoice.patient.phone}`, margin + 5, yPos + 22);
            if (invoice.patient?.email)
                doc.text(`Email: ${invoice.patient.email}`, margin + 5, yPos + 27);
            // RIGHT BOX: Invoice Details
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin + boxWidth + 6, yPos, boxWidth, 32, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100);
            doc.text('INVOICE DETAILS', margin + boxWidth + 11, yPos + 7);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            doc.text('Invoice Number:', margin + boxWidth + 11, yPos + 15);
            doc.setFont('helvetica', 'bold');
            doc.text(`${invoice.id}`, margin + boxWidth + 45, yPos + 15);
            doc.setFont('helvetica', 'normal');
            doc.text('Date Issued:', margin + boxWidth + 11, yPos + 21);
            doc.text(new Date(invoice.createdAt).toLocaleDateString(), margin + boxWidth + 45, yPos + 21);
            doc.text('Status:', margin + boxWidth + 11, yPos + 27);
            if (invoice.status === 'Paid')
                doc.setTextColor(16, 185, 129);
            else
                doc.setTextColor(245, 158, 11);
            doc.setFont('helvetica', 'bold');
            doc.text(invoice.status.toUpperCase(), margin + boxWidth + 45, yPos + 27);
            yPos += 42;
            // Requirement 4: Invoice Items Table
            const tableBody = invoice.items?.map((item) => [
                item.description || 'Medical Service',
                item.serviceType || 'Service',
                // Using toFixed(2) to prevent potential spacing issues from grouping separators
                Number(item.amount).toFixed(2)
            ]) || [];
            autoTable(doc, {
                startY: yPos,
                margin: { left: margin, right: margin },
                head: [['Description', 'Category', `Amount (${symbol})`]],
                body: tableBody,
                theme: 'grid',
                headStyles: {
                    fillColor: [45, 59, 174],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    font: unicodeFontEnabled ? 'NotoSans' : 'helvetica',
                    halign: 'left',
                    cellPadding: 4
                },
                bodyStyles: {
                    fontSize: 9,
                    font: unicodeFontEnabled ? 'NotoSans' : 'helvetica',
                    cellPadding: 4,
                    lineColor: [226, 232, 240]
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 40, halign: 'center' },
                    2: { cellWidth: 40, halign: 'right' }
                }
            });
            let finalY = doc.lastAutoTable.finalY + 10;
            // Requirement 5: Totals Section (Aligned right)
            const summaryWidth = 70;
            const summaryX = pageWidth - margin - summaryWidth;
            doc.setFontSize(10);
            doc.setFont(unicodeFontEnabled ? 'NotoSans' : 'helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text('Subtotal:', summaryX, finalY);
            doc.setTextColor(31, 41, 55);
            doc.text(`${symbol}${Number(invoiceSummary.subtotal).toFixed(2)}`, pageWidth - margin, finalY, { align: 'right' });
            finalY += 8;
            doc.setTextColor(107, 114, 128);
            const taxLabel = invoiceSummary.taxMode === 'IGST'
                ? `IGST (${invoiceSummary.gstRate || 0}%)`
                : `CGST+SGST (${invoiceSummary.gstRate || 0}%)`;
            doc.text(`${taxLabel}:`, summaryX, finalY);
            doc.setTextColor(31, 41, 55);
            doc.text(`${symbol}${Number(invoiceSummary.totalTax).toFixed(2)}`, pageWidth - margin, finalY, { align: 'right' });
            finalY += 6;
            // Total Payable Highlighted Box
            doc.setFillColor(45, 59, 174);
            doc.roundedRect(summaryX - 5, finalY, summaryWidth + 5, 12, 1, 1, 'F');
            doc.setFontSize(11);
            doc.setFont(unicodeFontEnabled ? 'NotoSans' : 'helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Total Payable:', summaryX, finalY + 8);
            doc.text(`${symbol}${Number(invoiceSummary.grandTotal).toFixed(2)}`, pageWidth - margin - 2, finalY + 8, { align: 'right' });
            finalY += 20;
            // Requirement 6: Payment Method
            if (invoice.paymentMethod) {
                doc.setFontSize(9);
                doc.setFont(unicodeFontEnabled ? 'NotoSans' : 'helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text(`Payment Method: ${invoice.paymentMethod}`, margin, finalY);
                finalY += 6;
            }
            if (invoice.remarks) {
                doc.setFontSize(9);
                doc.setFont(unicodeFontEnabled ? 'NotoSans' : 'helvetica', 'normal');
                doc.setTextColor(75, 85, 99);
                doc.text(`Remarks: ${String(invoice.remarks)}`, margin, finalY);
            }
            // Requirement 7, 8: Footer & Spacing (Fixed bottom placement)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(156, 163, 175);
            doc.text('This is a computer-generated tax invoice and does not require a signature.', pageWidth / 2, pageHeight - 20, { align: 'center' });
            doc.text('Healthcare excellence is our priority. Thank you for choosing our clinic.', pageWidth / 2, pageHeight - 15, { align: 'center' });
            // Requirement 9, 10: PDF Rendering
            doc.save(`Invoice_${invoice.id}.pdf`);
            toast.success('Professional Tax Invoice generated');
        }
        catch (error) {
            console.error('PDF generation failed', error);
            toast.error('Failed to generate professional invoice template');
        }
    };
    return (<div className="reception-dashboard">
            <div className="page-header">
                <div>
                    <h1>Centralized Billing & Invoices</h1>
                    <p>Consolidate and process all patient charges from one place.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-save btn-with-icon" onClick={() => {
            setSelectedPatientId('');
            setRemarks('');
            setIsModalOpen(true);
        }}>
                        <FiPlus />
                        <span>Generate Consolidated Invoice</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Volume</p>
                        <h3 className="stat-value">{formatMoney(invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + Number(i.totalAmount), 0))}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <FiFileText />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Unpaid Invoices</p>
                        <h3 className="stat-value">{invoices.filter(i => i.status === 'Pending').length}</h3>
                    </div>
                </div>
            </div>

            <div className="section-card card mt-lg">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Recent Invoices</h3>
                    <button className="btn btn-secondary btn-sm" onClick={fetchInvoices}>Refresh</button>
                </div>
                <div className="table-container mt-md">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingInvoices ? (<tr><td colSpan={7} className="text-center p-lg">Loading invoices...</td></tr>) : invoices.length > 0 ? invoices.map((inv) => (<tr key={inv.id}>
                                    <td><strong>{inv.id}</strong></td>
                                    <td>{inv.patient?.name}</td>
                                    <td>{inv.items?.length || 0} items</td>
                                    <td><strong>{formatMoney(inv.totalAmount)}</strong></td>
                                    <td>
                                        <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <FiEye className="clickable action-icon text-primary" onClick={() => {
                setSelectedInvoice(inv);
                setIsViewModalOpen(true);
            }} title="View Details"/>
                                            <FiPrinter className="clickable action-icon" onClick={() => handlePrint(inv)} title="Print"/>
                                            {inv.status === 'Pending' && (<FiCreditCard className="clickable action-icon text-success" onClick={() => {
                    setInvoiceToPay(inv);
                    setIsPayModalOpen(true);
                }} title="Pay"/>)}
                                        </div>
                                    </td>
                                </tr>)) : (<tr><td colSpan={7} className="text-center p-lg">No invoices found.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Consolidated Invoice Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Consolidated Invoice" size="lg">
                {isSuccess ? (<div className="success-message text-center p-lg">
                        <FiCheck size={48} color="#10B981"/>
                        <h3>Invoice Generated!</h3>
                        <p>The patient charges have been successfully consolidated.</p>
                    </div>) : (<div className="billing-modal-content">
                        <div className="form-group">
                            <label><FiUser /> Patient Selection</label>
                            <select className="form-control" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                                <option value="">Select a patient to fetch charges...</option>
                                {(clinicPatients.length ? clinicPatients : patients).map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.id})</option>))}
                            </select>
                        </div>

                        {selectedPatientId && (<div className="pending-items-section mt-lg">
                                <h3><FiShoppingCart /> Pending Charges</h3>
                                {loadingPending ? (<p className="p-md text-center">Fetching unpaid services...</p>) : (<div className="pending-items-list mt-md">
                                        {[...pendingItems.consultations, ...pendingItems.orders].length > 0 ? (<table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '40px' }}>Select</th>
                                                        <th>Service</th>
                                                        <th>Type</th>
                                                        <th>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...pendingItems.consultations, ...pendingItems.orders].map((item) => {
                            const isSelected = selectedItems.find(i => i.id === item.id && i.type === item.type);
                            return (<tr key={`${item.type}-${item.id}`} className={isSelected ? 'selected-row' : ''}>
                                                                <td>
                                                                    <input type="checkbox" checked={!!isSelected} onChange={() => handleToggleItem(item)}/>
                                                                </td>
                                                                <td>{item.description}</td>
                                                                <td><span className={`type-tag ${item.type}`}>{item.type.toUpperCase()}</span></td>
                                                                <td>{formatMoney(item.amount)}</td>
                                                            </tr>);
                        })}
                                                </tbody>
                                            </table>) : (<p className="text-center p-lg text-muted italic">No unpaid charges found for this patient.</p>)}
                                    </div>)}
                            </div>)}

                        {selectedItems.length > 0 && (<div className="invoice-summary-box mt-xl p-lg" style={{ background: '#F8FAFC', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 600 }}>Subtotal:</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>{formatMoney(taxSummary.subtotal)}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>GST Rate (%)</label>
                                        <input type="number" min="0" className="form-control" value={gstRate} onChange={(e) => setGstRate(Number(e.target.value) || 0)}/>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Place of Supply</label>
                                        <input type="text" className="form-control" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)}/>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#475569' }}>
                                    <span>{taxSummary.taxMode === 'IGST' ? 'IGST' : 'CGST + SGST'}:</span>
                                    <span style={{ fontWeight: 700 }}>{formatMoney(taxSummary.totalTax)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 700 }}>Grand Total:</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatMoney(taxSummary.grandTotal)}</span>
                                </div>
                                <div className="form-group">
                                    <label>Remarks (optional)</label>
                                    <textarea className="form-control" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add manual note for invoice/PDF"/>
                                </div>
                                <div className="form-group">
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" checked={isPaidImmediate} onChange={e => setIsPaidImmediate(e.target.checked)}/>
                                        <span>Mark as Paid immediately</span>
                                    </label>
                                </div>
                                {isPaidImmediate && (<div className="form-group mt-md">
                                        <label>Payment Method</label>
                                        <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>)}
                                <div className="modal-actions mt-lg">
                                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button className="btn btn-save" onClick={handleSubmitInvoice}>Generate Invoice</button>
                                </div>
                            </div>)}
                    </div>)}
            </Modal>

            {/* Pay Modal */}
            <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Record Payment" size="sm">
                <div className="payment-modal p-md">
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <p className="text-muted">Invoice: {invoiceToPay?.id}</p>
                        <h2 style={{ fontSize: '2.5rem', color: '#10B981', margin: '0.5rem 0' }}>{formatMoney(invoiceToPay?.totalAmount)}</h2>
                    </div>
                    <div className="form-group">
                        <label>Payment Method</label>
                        <select className="form-control" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <div className="modal-actions mt-lg">
                        <button className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleMarkPaid}>Confirm Payment</button>
                    </div>
                </div>
            </Modal>

            {/* Professional Invoice View Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Tax Invoice Details" size="lg">
                {selectedInvoice && (<div className="invoice-detail-template" id="invoice-print-area">
                        {/* Premium Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2D3BAE', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '50px', height: '50px', background: '#2D3BAE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 800 }}>
                                    {selectedClinic?.name?.substring(0, 2).toUpperCase() || 'DH'}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{selectedClinic?.name || 'Dhanvantri Hospital'}</h2>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>{selectedClinic?.location || 'Healthcare City, Dubai'}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2D3BAE', fontWeight: 800 }}>INVOICE</h1>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>#{selectedInvoice.id}</p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billed To</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                                        <FiUser size={14}/>
                                    </div>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedInvoice.patient?.name}</span>
                                </div>
                                <div style={{ marginLeft: '2.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    {selectedInvoice.patient?.phone && <div><FiActivity size={12}/> {selectedInvoice.patient.phone}</div>}
                                    {selectedInvoice.patient?.email && <div>{selectedInvoice.patient.email}</div>}
                                </div>
                            </div>
                            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Details</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>Date Issued</label>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>Status</label>
                                        <span className={`status-pill ${selectedInvoice.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                            {selectedInvoice.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>Payment Method</label>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedInvoice.paymentMethod || 'Reserved'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div style={{ marginBottom: '2rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#2D3BAE', color: '#fff' }}>
                                        <th style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px 0 0 0', fontWeight: 600 }}>Description</th>
                                        <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 600 }}>Category</th>
                                        <th style={{ textAlign: 'right', padding: '0.75rem 1rem', borderRadius: '0 8px 0 0', fontWeight: 600 }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.items?.map((item, idx) => (<tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.description}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span className={`type-tag ${item.serviceType?.toLowerCase() || 'other'}`} style={{ fontSize: '10px' }}>
                                                    {item.serviceType || 'Service'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                                                {formatMoney(item.amount)}
                                            </td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>

                        {/* Final Summary */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #2D3BAE', paddingTop: '1.5rem' }}>
                            <div style={{ width: '250px' }}>
                                {(() => {
                const summary = selectedInvoice.taxSummary || buildTaxSummary({
                    subtotal: Number(selectedInvoice.subtotal ?? selectedInvoice.totalAmount ?? 0),
                    gstRate: Number(selectedInvoice.gstRate || 0),
                    clinicState: selectedInvoice.clinicState || clinicState,
                    placeOfSupply: selectedInvoice.placeOfSupply || placeOfSupply || clinicState
                });
                return <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748b', fontWeight: 500 }}>Subtotal</span>
                                    <span style={{ fontWeight: 600 }}>{formatMoney(summary.subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ color: '#64748b', fontWeight: 500 }}>{summary.taxMode === 'IGST' ? `IGST (${summary.gstRate || 0}%)` : `CGST+SGST (${summary.gstRate || 0}%)`}</span>
                                    <span style={{ fontWeight: 600 }}>{formatMoney(summary.totalTax)}</span>
                                </div>
                                {selectedInvoice.remarks && (<div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                                        <strong>Remarks:</strong> {selectedInvoice.remarks}
                                    </div>)}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#2D3BAE', borderRadius: '8px', color: '#fff' }}>
                                    <span style={{ fontWeight: 700 }}>Total Payable</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{formatMoney(summary.grandTotal)}</span>
                                </div>
                                </>;
            })()}
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="no-print" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => handlePrint(selectedInvoice)} style={{ background: '#1e293b' }}>
                                <FiPrinter /> Print Invoice
                            </button>
                            {selectedInvoice.status === 'Pending' && (<button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => {
                    setInvoiceToPay(selectedInvoice);
                    setIsPayModalOpen(true);
                    setIsViewModalOpen(false);
                }}>
                                    <FiCreditCard /> Record Payment
                                </button>)}
                        </div>
                    </div>)}
            </Modal>

            <style>{`
                .type-tag { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
                .type-tag.consultation { background: #DBEAFE; color: #1E40AF; }
                .type-tag.lab { background: #FEF3C7; color: #92400E; }
                .type-tag.radiology { background: #F3E8FF; color: #6B21A8; }
                .type-tag.pharmacy { background: #D1FAE5; color: #065F46; }
                .selected-row { background: #EFF6FF; }
            `}</style>
        </div>);
};
export default Billing;
