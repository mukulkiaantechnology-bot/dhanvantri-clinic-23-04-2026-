import { useState, useEffect } from 'react';
import { FiShoppingCart, FiPlus, FiTrash2, FiRefreshCw, FiList, FiInfo } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { receptionService } from '../../services/reception.service';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { buildTaxSummary } from '../../utils/taxCalculator';
import '../SharedDashboard.css';
import './PharmacyMedicineSale.css';
const PharmacyMedicineSale = () => {
    const toast = useToast();
    const { formatMoney } = useCurrency();
    const { selectedClinic } = useAuth();
    const [patients, setPatients] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState('');
    const [saleMode, setSaleMode] = useState('REGISTERED');
    const [outsidePatient, setOutsidePatient] = useState({ name: '', phone: '', prescriptionRef: '' });
    const [corporateBilling, setCorporateBilling] = useState(false);
    const [corporateInfo, setCorporateInfo] = useState({ companyName: '', userName: '', employeeCode: '' });
    const [lineItems, setLineItems] = useState([]);
    const [placeOfSupply, setPlaceOfSupply] = useState(selectedClinic?.location || '');
    const [submitting, setSubmitting] = useState(false);
    const [sales, setSales] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const fetchData = async () => {
        try {
            setLoading(true);
            const [patientsRes, invRes] = await Promise.all([
                receptionService.getPatients().catch(() => ({ data: [] })),
                pharmacyService.getInventory().catch(() => ({ data: [] }))
            ]);
            const pData = patientsRes?.data ?? (Array.isArray(patientsRes) ? patientsRes : []);
            const iData = invRes?.data ?? (Array.isArray(invRes) ? invRes : []);
            setPatients(Array.isArray(pData) ? pData : []);
            setInventory(Array.isArray(iData) ? iData : []);
        }
        catch (e) {
            console.error(e);
            toast.error('Failed to load patients or inventory');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchSales = async () => {
        try {
            setLoadingSales(true);
            const res = await pharmacyService.getPosSales();
            const data = res?.data ?? res ?? [];
            setSales(Array.isArray(data) ? data : []);
        }
        catch (e) {
            console.error(e);
            toast.error('Failed to load sales');
        }
        finally {
            setLoadingSales(false);
        }
    };
    useEffect(() => { fetchData(); }, []);
    useEffect(() => { fetchSales(); }, []);
    const addLine = () => {
        if (inventory.length === 0) {
            toast.error('No inventory items available');
            return;
        }
        const first = inventory[0];
        setLineItems(prev => [...prev, {
                inventoryId: first.id,
                name: first.name,
                unitPrice: Number(first.unitPrice) || 0,
                quantity: 1,
                gstRate: 12
            }]);
    };
    const updateLine = (index, field, value) => {
        setLineItems(prev => {
            const next = [...prev];
            if (field === 'inventoryId') {
                const item = inventory.find(i => i.id === Number(value));
                if (item) {
                    next[index] = { ...next[index], inventoryId: item.id, name: item.name, unitPrice: Number(item.unitPrice) || 0, quantity: next[index].quantity };
                }
            }
            else if (field === 'quantity') {
                next[index] = { ...next[index], quantity: Number(value) || 0 };
            }
            else if (field === 'gstRate') {
                next[index] = { ...next[index], gstRate: Number(value) || 0 };
            }
            return next;
        });
    };
    const removeLine = (index) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };
    const clinicState = selectedClinic?.location || '';
    const lineSummaries = lineItems.map((row) => buildTaxSummary({
        subtotal: row.unitPrice * row.quantity,
        gstRate: row.gstRate || 0,
        clinicState,
        placeOfSupply
    }));
    const subtotalAmount = lineSummaries.reduce((sum, row) => sum + row.subtotal, 0);
    const totalTaxAmount = lineSummaries.reduce((sum, row) => sum + row.totalTax, 0);
    const grandTotal = subtotalAmount + totalTaxAmount;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saleMode === 'REGISTERED' && !patientId) {
            toast.error('Please select a patient');
            return;
        }
        if (saleMode === 'OUTSIDE' && !outsidePatient.name.trim()) {
            toast.error('Outside patient name is required');
            return;
        }
        if (lineItems.length === 0 || lineItems.every(l => l.quantity <= 0)) {
            toast.error('Add at least one item with quantity');
            return;
        }
        setSubmitting(true);
        try {
            await pharmacyService.directSale({
                patientId: saleMode === 'REGISTERED' ? Number(patientId) : null,
                saleMode,
                source: saleMode === 'OUTSIDE' ? 'OUTSIDE_PRESCRIPTION' : 'POS',
                outsidePatient: saleMode === 'OUTSIDE' ? {
                    name: outsidePatient.name.trim(),
                    phone: outsidePatient.phone.trim(),
                    prescriptionRef: outsidePatient.prescriptionRef.trim()
                } : undefined,
                corporateBilling,
                corporateInfo: corporateBilling ? {
                    companyName: corporateInfo.companyName.trim(),
                    userName: corporateInfo.userName.trim(),
                    employeeCode: corporateInfo.employeeCode.trim()
                } : undefined,
                items: lineItems.filter(l => l.quantity > 0).map(l => ({
                    inventoryId: l.inventoryId,
                    quantity: l.quantity,
                    price: l.unitPrice,
                    gstRate: Number(l.gstRate || 0)
                })),
                subtotal: subtotalAmount,
                totalTax: totalTaxAmount,
                totalAmount: grandTotal,
                taxSummary: buildTaxSummary({
                    subtotal: subtotalAmount,
                    gstRate: subtotalAmount > 0 ? (totalTaxAmount * 100) / subtotalAmount : 0,
                    clinicState,
                    placeOfSupply
                }),
                placeOfSupply,
                paid: false
            });
            toast.success(corporateBilling ? 'Corporate pharmacy order created' : 'Order sent to billing');
            setPatientId('');
            setOutsidePatient({ name: '', phone: '', prescriptionRef: '' });
            setCorporateInfo({ companyName: '', userName: '', employeeCode: '' });
            setCorporateBilling(false);
            setLineItems([]);
            fetchSales();
        }
        catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Sale failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Medicine Sale</h1>
                    <p>Direct sale (POS) — sell medicines over the counter without a prescription.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchData} disabled={loading}>
                    <FiRefreshCw className={loading ? 'spin' : ''}/>
                    <span>Refresh</span>
                </button>
            </div>

            <div className="content-card pharmacy-medicine-sale-form" style={{ maxWidth: '720px', width: '100%' }}>
                <div className="card-header">
                    <h2><FiShoppingCart /> New Sale</h2>
                </div>
                <form onSubmit={handleSubmit} className="pharmacy-medicine-sale-form-body">
                    <div className="form-group">
                        <label>Sale Type *</label>
                        <select className="form-control" value={saleMode} onChange={e => setSaleMode(e.target.value)}>
                            <option value="REGISTERED">Registered Patient</option>
                            <option value="OUTSIDE">Outside Patient (Walk-in Prescription)</option>
                        </select>
                    </div>

                    {saleMode === 'REGISTERED' ? (<div className="form-group">
                        <label>Patient *</label>
                        <select className="form-control" value={patientId} onChange={e => setPatientId(e.target.value)} required>
                            <option value="">Select patient</option>
                            {patients.map(p => (<option key={p.id} value={p.id}>{p.name} {p.email ? `(${p.email})` : ''}</option>))}
                        </select>
                    </div>) : (<>
                        <div className="form-group">
                            <label>Outside Patient Name *</label>
                            <input className="form-control" value={outsidePatient.name} onChange={e => setOutsidePatient(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter patient full name" required/>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="form-control" value={outsidePatient.phone} onChange={e => setOutsidePatient(prev => ({ ...prev, phone: e.target.value }))} placeholder="Optional"/>
                            </div>
                            <div className="form-group">
                                <label>Outside Prescription Ref</label>
                                <input className="form-control" value={outsidePatient.prescriptionRef} onChange={e => setOutsidePatient(prev => ({ ...prev, prescriptionRef: e.target.value }))} placeholder="RX Number / Doctor Name"/>
                            </div>
                        </div>
                    </>)}

                    <div className="form-group">
                        <label className="remember-me">
                            <input type="checkbox" checked={corporateBilling} onChange={e => setCorporateBilling(e.target.checked)}/>
                            <span>Mark as corporate pharmacy billing</span>
                        </label>
                    </div>

                    {corporateBilling && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label>Company Name *</label>
                            <input className="form-control" value={corporateInfo.companyName} onChange={e => setCorporateInfo(prev => ({ ...prev, companyName: e.target.value }))} required={corporateBilling}/>
                        </div>
                        <div className="form-group">
                            <label>User Name *</label>
                            <input className="form-control" value={corporateInfo.userName} onChange={e => setCorporateInfo(prev => ({ ...prev, userName: e.target.value }))} required={corporateBilling}/>
                        </div>
                        <div className="form-group">
                            <label>Employee Code</label>
                            <input className="form-control" value={corporateInfo.employeeCode} onChange={e => setCorporateInfo(prev => ({ ...prev, employeeCode: e.target.value }))}/>
                        </div>
                    </div>)}

                    <div className="medicine-sale-items-row">
                        <label className="medicine-sale-items-label">Items</label>
                        <button type="button" className="btn btn-primary btn-sm btn-with-icon medicine-sale-add-btn" onClick={addLine} style={{ width: 'auto', minWidth: 'unset' }}>
                            <FiPlus /> <span>Add item</span>
                        </button>
                    </div>

                    {lineItems.length > 0 && (<div className="table-responsive medicine-sale-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Unit Price</th>
                                        <th>Qty</th>
                                        <th>GST %</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((row, idx) => (<tr key={idx}>
                                            <td>
                                                <select className="form-control" value={row.inventoryId} onChange={e => updateLine(idx, 'inventoryId', e.target.value)}>
                                                    {inventory.map(i => (<option key={i.id} value={i.id}>{i.name} {i.sku ? `(${i.sku})` : ''}</option>))}
                                                </select>
                                            </td>
                                            <td>{row.unitPrice.toFixed(2)}</td>
                                            <td>
                                                <input type="number" min={1} className="form-control medicine-sale-qty-input" value={row.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)}/>
                                            </td>
                                            <td>
                                                <input type="number" min={0} className="form-control medicine-sale-qty-input" value={row.gstRate ?? 0} onChange={e => updateLine(idx, 'gstRate', e.target.value)}/>
                                            </td>
                                            <td>{(row.unitPrice * row.quantity).toFixed(2)}</td>
                                            <td>
                                                <button type="button" className="btn btn-secondary btn-sm medicine-sale-remove-btn" onClick={() => removeLine(idx)} title="Remove">
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>)}

                    {lineItems.length === 0 && (<p className="text-muted medicine-sale-empty-hint">Click &quot;Add item&quot; to add medicines from inventory.</p>)}

                    <div className="form-group">
                        <label>Place of Supply</label>
                        <input className="form-control" value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} placeholder="State/Location"/>
                    </div>

                    <div className="medicine-sale-total">
                        Subtotal: {formatMoney(subtotalAmount)}
                        <br />
                        GST: {formatMoney(totalTaxAmount)}
                        <br />
                        Grand Total: {formatMoney(grandTotal)}
                    </div>

                    <div className="medicine-sale-actions">
                        <button type="submit" className="btn btn-primary btn-sm medicine-sale-submit-btn" disabled={submitting || lineItems.length === 0} style={{ width: 'auto' }}>
                            {submitting ? 'Processing...' : 'Send to Billing'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="content-card mt-xl" style={{ width: '100%' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2><FiList /> Pharmacy Sale Orders</h2>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={fetchSales} disabled={loadingSales}>
                        <FiRefreshCw className={loadingSales ? 'spin' : ''}/> Refresh
                    </button>
                </div>
                <div className="table-status-info" style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiInfo /> All walk-in sales must be sent to Billing. Dispense items ONLY after payment is confirmed in Orders View.
                    </div>
                </div>
                <div className="table-responsive" style={{ padding: '1rem 1.5rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Patient</th>
                                <th>Source</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingSales ? (<tr><td colSpan={8} className="text-center">Loading...</td></tr>) : sales.length === 0 ? (<tr><td colSpan={8} className="text-center p-lg text-muted">No sale orders yet. Create one above.</td></tr>) : sales.map((s) => (<tr key={s.id}>
                                    <td>#{s.id}</td>
                                    <td>{s.patientName || s.patient?.name || '—'}</td>
                                    <td>{s.saleMode === 'OUTSIDE' ? 'Outside Rx' : (s.corporateBilling ? 'Corporate' : 'Internal')}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.testName || s.service}>{s.testName || s.service || '—'}</td>
                                    <td>{formatMoney(Number(s.amount || s.totalAmount) || 0)}</td>
                                    <td>
                                        <span className={`status-pill ${s.paymentStatus === 'Paid' || s.status === 'Paid' ? 'paid' : 'pending'}`}>
                                            {s.paymentStatus || s.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${(s.testStatus || s.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                            {s.testStatus || s.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                                </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>);
};
export default PharmacyMedicineSale;
