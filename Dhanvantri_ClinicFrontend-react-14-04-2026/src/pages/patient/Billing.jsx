import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { useCurrency } from '../../context/CurrencyContext';
import { FiDollarSign, FiInfo } from 'react-icons/fi';
import { buildTaxSummary } from '../../utils/taxCalculator';
import '../SharedDashboard.css';
const PatientBilling = () => {
    const { user } = useAuth();
    const { formatMoney } = useCurrency();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await patientService.getMyInvoices();
                setInvoices(res.data?.data || res.data || []);
            }
            catch (error) {
                console.error('Failed to fetch invoices', error);
            }
            finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchInvoices();
        }
    }, [user]);
    if (loading) {
        return <div className="p-20 text-center">Loading billing information...</div>;
    }
    const totalUnpaid = invoices.reduce((sum, inv) => sum + (['Unpaid', 'Pending'].includes(inv.status) ? Number(inv.totalAmount || inv.amount || 0) : 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.status === 'Paid' ? Number(inv.totalAmount || inv.amount || 0) : 0), 0);
    const getInvoiceSummary = (invoice) => invoice.taxSummary || buildTaxSummary({
        subtotal: Number(invoice.subtotal ?? invoice.totalAmount ?? invoice.amount ?? 0),
        gstRate: Number(invoice.gstRate || 0),
        clinicState: invoice.clinicState || invoice.clinic?.location || '',
        placeOfSupply: invoice.placeOfSupply || invoice.clinic?.location || ''
    });
    return (<div className="p-5 fade-in">
            <div className="page-header">
                <div>
                    <h1><FiDollarSign /> Invoices & Billing</h1>
                    <p>Track your payments, pending bills, and health service costs.</p>
                </div>
            </div>

            <div className="stats-grid mt-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
                    <div className="stat-icon red" style={{ background: '#FEE2E2', color: '#EF4444' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-info">
                        <h3>{formatMoney(totalUnpaid)}</h3>
                        <p>Total Unpaid</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #10B981' }}>
                    <div className="stat-icon green" style={{ background: '#D1FAE5', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-info">
                        <h3>{formatMoney(totalPaid)}</h3>
                        <p>Total Paid</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #3B82F6' }}>
                    <div className="stat-icon blue" style={{ background: '#DBEAFE', color: '#3B82F6' }}>
                        <FiInfo />
                    </div>
                    <div className="stat-info">
                        <h3>{invoices.length}</h3>
                        <p>Invoices Issued</p>
                    </div>
                </div>
            </div>

            <div className="content-card mt-xl">
                <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <h2>Recent Bills</h2>
                </div>
                <div className="table-responsive" style={{ padding: '0 1rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Description / Visit</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Clinic</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? invoices.map((inv) => (<tr key={inv.id}>
                                    <td><span style={{ fontWeight: 700, color: '#64748b' }}>#{inv.id.toString().padStart(4, '0')}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{inv.service || 'Medical Services'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {inv.doctorName ? `By Dr. ${inv.doctorName}` : `${inv.items?.length || 0} items included`}
                                        </div>
                                    </td>
                                    <td><span style={{ fontWeight: 700 }}>{formatMoney(Number(inv.totalAmount || inv.amount || 0))}</span></td>
                                    <td>
                                        <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>{new Date(inv.date || inv.createdAt || Date.now()).toLocaleDateString()}</td>
                                    <td>{inv.clinic?.name || 'Dhanvantri Hospital'}</td>
                                    <td>
                                        <button className="btn btn-primary btn-sm" onClick={() => setSelectedInvoice(inv)} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                border: 'none',
                color: 'white'
            }}>
                                            <FiInfo /> Details
                                        </button>
                                    </td>
                                </tr>)) : (<tr>
                                    <td colSpan={7} className="text-center p-xl">
                                        <div style={{ opacity: 0.5, marginBottom: '0.5rem' }}><FiDollarSign size={48}/></div>
                                        No billing records found.
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedInvoice && (<div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '16px' }}>
                        <div className="modal-header">
                            <h2>Invoice Details #{selectedInvoice.id.toString().padStart(4, '0')}</h2>
                            <button className="close-btn" onClick={() => setSelectedInvoice(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Clinic</label>
                                    <div style={{ fontWeight: 600 }}>{selectedInvoice.clinic?.name || 'Main Clinic'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Date</label>
                                    <div style={{ fontWeight: 600 }}>{new Date(selectedInvoice.date || selectedInvoice.createdAt || Date.now()).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Status</label>
                                    <span className={`status-pill ${selectedInvoice.status.toLowerCase()}`}>{selectedInvoice.status}</span>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Doctor</label>
                                    <div style={{ fontWeight: 600 }}>{selectedInvoice.doctorName ? `Dr. ${selectedInvoice.doctorName}` : '—'}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Payment Method</label>
                                    <div style={{ fontWeight: 600 }}>{selectedInvoice.paymentMethod || '—'}</div>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700 }}>Itemized Services</h4>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', width: '100%', overflow: 'hidden' }}>
                                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', whiteSpace: 'normal' }}>Description</th>
                                            <th style={{ width: '120px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (selectedInvoice.items.map((item, idx) => (<tr key={idx}>
                                                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                        <div style={{ fontWeight: 500, lineHeight: 1.4 }}>{item.description}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Type: {item.serviceType}</div>
                                                    </td>
                                                    <td style={{ width: '120px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                                        {formatMoney(Number(item.amount))}
                                                    </td>
                                                </tr>))) : (<tr>
                                                <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{selectedInvoice.service || 'Medical Service'}</td>
                                                <td style={{ width: '120px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {formatMoney(Number(selectedInvoice.totalAmount || selectedInvoice.amount || 0))}
                                                </td>
                                            </tr>)}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <td style={{ fontWeight: 700, whiteSpace: 'normal' }}>Subtotal</td>
                                            <td style={{ width: '120px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {formatMoney(getInvoiceSummary(selectedInvoice).subtotal)}
                                            </td>
                                        </tr>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <td style={{ fontWeight: 700, whiteSpace: 'normal' }}>{getInvoiceSummary(selectedInvoice).taxMode === 'IGST' ? 'IGST' : 'CGST + SGST'}</td>
                                            <td style={{ width: '120px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {formatMoney(getInvoiceSummary(selectedInvoice).totalTax)}
                                            </td>
                                        </tr>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <td style={{ fontWeight: 700, whiteSpace: 'normal' }}>Total</td>
                                            <td style={{ width: '120px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', whiteSpace: 'nowrap' }}>
                                                {formatMoney(getInvoiceSummary(selectedInvoice).grandTotal)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {['Unpaid', 'Pending'].includes(selectedInvoice.status) && (<div style={{ marginTop: '1.5rem', padding: '1rem', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FiInfo size={20}/>
                                    <span>Please visit the reception counter to settle this bill. Online payments are currently disabled.</span>
                                </div>)}
                        </div>
                        <div className="modal-actions" style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                            <button className="btn btn-primary" onClick={() => setSelectedInvoice(null)} style={{ width: '100%', background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none' }}>Close Details</button>
                        </div>
                    </div>
                </div>)}
        </div>);
};
export default PatientBilling;
