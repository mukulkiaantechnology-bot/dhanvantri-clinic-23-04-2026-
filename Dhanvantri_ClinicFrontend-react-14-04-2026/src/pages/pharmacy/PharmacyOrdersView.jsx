import { useState, useEffect } from 'react';
import { FiPackage, FiCheck, FiInfo, FiClock, FiCheckCircle, FiAlertTriangle, FiGrid } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { pharmacyService } from '../../services/pharmacy.service';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import '../SharedDashboard.css';
const LOW_STOCK_THRESHOLD = 10;
const PharmacyOrdersView = ({ title, subtitle, mode = 'dashboard' }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user, selectedClinic } = useAuth();
    const { formatMoney } = useCurrency();
    const [stats, setStats] = useState({ prescriptionsToday: 0, dispensedToday: 0, lowStock: 0, totalItems: 0 });
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const fetchOrders = async () => {
        try {
            const [ordersRes, invRes] = await Promise.all([
                pharmacyService.getOrders(),
                pharmacyService.getInventory().catch(() => ({ data: [] }))
            ]);
            const response = ordersRes;
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data))
                data = response.data;
            else if (Array.isArray(response))
                data = response;
            else if (response?.data !== undefined)
                data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
            const invRaw = invRes?.data ?? (Array.isArray(invRes) ? invRes : []);
            const invList = Array.isArray(invRaw) ? invRaw : [];
            setInventory(invList);
            const completed = data.filter((o) => o.status === 'Completed').length;
            const lowStockCount = invList.filter((i) => Number(i.quantity || 0) <= LOW_STOCK_THRESHOLD).length;
            setStats({ prescriptionsToday: data.length, dispensedToday: completed, lowStock: lowStockCount, totalItems: invList.length });
        }
        catch (error) {
            console.error('Failed to fetch pharmacy orders', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(), 10000);
        return () => clearInterval(interval);
    }, []);
    const handleOpenProcess = (order) => {
        setSelectedOrder(order);
        if (order.taxSummary?.grandTotal || order.amount) {
            setAmount(String(Number(order.taxSummary?.grandTotal || order.amount || 0)));
            setIsProcessModalOpen(true);
            return;
        }
        let calculatedAmount = 0;
        if (order.items && Array.isArray(order.items)) {
            calculatedAmount = order.items.reduce((acc, item) => {
                const qty = Number(item.quantity) || 0;
                let price = Number(item.unitPrice || item.price || 0);
                // Look up in inventory for dynamic pricing
                if (price === 0 && inventory.length > 0) {
                    const invItem = inventory.find(i => i.id === item.inventoryId ||
                        i.name?.toLowerCase() === item.medicineName?.toLowerCase());
                    if (invItem)
                        price = Number(invItem.unitPrice || 0);
                }
                return acc + (qty * price);
            }, 0);
        }
        setAmount(calculatedAmount.toString());
        setIsProcessModalOpen(true);
    };
    const handleDispense = async (e) => {
        e.preventDefault();
        if (!selectedOrder)
            return;
        try {
            const items = selectedOrder?.items || [];
            await pharmacyService.processOrder(selectedOrder.id, items, true, Number(amount) || 0, selectedOrder.source);
            toast.success('Prescription processed successfully');
            setIsProcessModalOpen(false);
            fetchOrders();
        }
        catch (error) {
            console.error('Dispense failed', error);
            toast.error('Failed to process order');
        }
    };
    const handlePrintSlip = async (order) => {
        try {
            const doc = new jsPDF();
            let details = {};
            try {
                if (typeof order.result === 'string' && order.result.startsWith('{'))
                    details = JSON.parse(order.result);
                else if (typeof order.result === 'object')
                    details = order.result || {};
            }
            catch (e) { }
            const startY = await addClinicHeader(doc, selectedClinic, 'Pharmacy Dispensing Slip');
            // Patient Info Box (Modern Layout)
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(15, startY + 5, 180, 25, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text('PATIENT NAME', 20, startY + 12);
            doc.text('ORDER ID', 85, startY + 12);
            doc.text('DATE', 130, startY + 12);
            doc.text('SOURCE', 165, startY + 12);
            doc.setTextColor(30);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(order.patientName || 'Unknown Patient', 20, startY + 18);
            doc.text(`#${order.id}`, 85, startY + 18);
            doc.text(new Date(order.createdAt).toLocaleDateString(), 130, startY + 18);
            doc.text(order.source || 'EMR', 165, startY + 18);
            // Itemized Table
            const tableBody = [];
            const items = order.items && order.items.length > 0 ? order.items : (details.items || []);
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    // Normalize item data
                    let rawName = item.medicineName || item.name || (typeof item === 'string' ? item : item.testName || 'Medicine');
                    // Try to extract quantity from name if it looks like "Medicine x10"
                    let name = rawName.split(' x')[0].split(' X')[0];
                    let qty = Number(item.quantity);
                    if (isNaN(qty) || qty <= 0) {
                        const match = rawName.match(/x(\d+)$/i);
                        qty = match ? Number(match[1]) : 1;
                    }
                    let unitPrice = Number(item.unitPrice || item.price || 0);
                    let sku = item.sku || '-';
                    let expiry = item.expiryDate || item.expiry || '-';
                    // Lookup from inventory for real-time dynamic data
                    const invMatch = inventory.find(inv => inv.id === item.inventoryId ||
                        inv.name?.toLowerCase() === name.toLowerCase() ||
                        inv.name?.toLowerCase() === rawName.toLowerCase() ||
                        inv.sku === item.sku);
                    if (invMatch) {
                        if (unitPrice === 0)
                            unitPrice = Number(invMatch.unitPrice || 0);
                        if (sku === '-')
                            sku = invMatch.sku || '-';
                        if (expiry === '-')
                            expiry = invMatch.expiryDate ? new Date(invMatch.expiryDate).toLocaleDateString() : '-';
                        if (!item.medicineName && !item.name)
                            name = invMatch.name;
                    }
                    tableBody.push([
                        name,
                        sku,
                        qty.toString(),
                        formatMoney(unitPrice),
                        formatMoney(qty * unitPrice),
                        expiry !== '-' ? expiry : 'N/A'
                    ]);
                });
            }
            autoTable(doc, {
                startY: startY + 40,
                head: [['Medicine Name', 'SKU', 'Qty', 'Unit Price', 'Subtotal', 'Expiry']],
                body: tableBody,
                foot: [[
                        { content: 'TOTAL PAID AMOUNT:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                        { content: formatMoney(order.amount || details.amount || details.totalAmount || 0), colSpan: 2, styles: { fontStyle: 'bold', textColor: [45, 59, 174], halign: 'left' } }
                    ]],
                theme: 'striped',
                headStyles: { fillColor: [45, 59, 174], textColor: 255, fontSize: 8, fontStyle: 'bold' },
                footStyles: { fillColor: [241, 245, 249], fontSize: 10 },
                styles: { fontSize: 8, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                },
                margin: { left: 15, right: 15 }
            });
            const finalY = doc.lastAutoTable.finalY + 15;
            // Footer Branding & Note
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Note: This is an electronically generated dispensing slip. Please check medicines before leaving.', 15, finalY);
            doc.text(`Dispensed By: ${user?.name || 'Pharmacist'} | Date: ${new Date().toLocaleString()}`, 15, finalY + 5);
            // Watermark
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.setFontSize(35);
            doc.setTextColor(200);
            doc.text('HUSRI CLINIC PHARMACY', 45, 160, { angle: 45 });
            doc.save(`Husri_Clinic_Slip_${order.id}.pdf`);
            toast.success('Professional Pharmacy Slip Generated');
        }
        catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate professional slip');
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>

            </div>

            {mode === 'dashboard' && (<div className="stats-grid mt-lg">
                    <div className="stat-card" onClick={() => navigate('/pharmacy/inventory')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#2D3BAE15', color: '#2D3BAE' }}><FiGrid /></div>
                        <div className="stat-info">
                            <h3>{stats.totalItems}</h3>
                            <p>Total Items (Inventory)</p>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/pharmacy/reports')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#2D3BAE15', color: '#2D3BAE' }}><FiClock /></div>
                        <div className="stat-info">
                            <h3>{stats.dispensedToday}</h3>
                            <p>Today Sales</p>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/pharmacy/prescriptions')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#10B98115', color: '#10B981' }}><FiCheckCircle /></div>
                        <div className="stat-info">
                            <h3>{stats.prescriptionsToday}</h3>
                            <p>Prescriptions Today</p>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/pharmacy/stock-alert')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: '#F59E0B15', color: '#F59E0B' }}><FiAlertTriangle /></div>
                        <div className="stat-info">
                            <h3>{stats.lowStock}</h3>
                            <p>Low Stock</p>
                        </div>
                    </div>
                </div>)}

            <div className={`content-section ${mode === 'dashboard' ? 'mt-xl' : 'mt-md'}`}>
                <div className="content-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2><FiPackage /> {mode === 'dashboard' ? 'Recent Pending Prescriptions' : 'All Pending Prescriptions'}</h2>
                        {mode === 'dashboard' && (<button className="btn btn-secondary btn-sm" onClick={() => navigate('/pharmacy/prescriptions')}>View All</button>)}
                    </div>
                    <div className="prescriptions-list mt-md">
                        {loading ? (<div className="p-lg text-center">Loading prescriptions...</div>) : (<>
                                {orders
                .filter(p => p.status === 'Pending')
                .slice(0, mode === 'dashboard' ? 5 : undefined)
                .map(p => {
                const isPaid = p.paymentStatus === 'Paid';
                return (<div key={p.id} className="list-item">
                                                <div className="item-main">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <h3>{p.patientName || p.patient?.name || 'Unknown Patient'}</h3>
                                                        <span className={`status-pill ${isPaid ? 'paid' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                                                            {isPaid ? 'PAYMENT RECEIVED' : 'AWAITING PAYMENT'}
                                                        </span>
                                                    </div>
                                                    <p className="item-sub" style={{ fontWeight: 500, color: '#1E293B' }}>
                                                        {p.items?.length
                        ? p.items.map((i) => i.medicineName || i.name || i.testName).join(', ')
                        : (p.testName || 'Prescription Details Viewable in System')}
                                                    </p>
                                                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '0.25rem' }}>ID: #{p.id} - {new Date(p.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <button className="btn btn-primary btn-with-icon" style={{
                        opacity: isPaid ? 1 : 0.5,
                        cursor: isPaid ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        background: isPaid ? 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)' : '#94A3B8',
                        border: 'none',
                        color: 'white'
                    }} onClick={() => isPaid && handleOpenProcess(p)} disabled={!isPaid} title={!isPaid ? "Direct patient to reception for payment first" : ""}>
                                                    <FiCheck /> <span>{isPaid ? 'Dispense Medicines' : 'Wait for Payment'}</span>
                                                </button>
                                            </div>);
            })}
                                {orders.filter(p => p.status === 'Pending').length === 0 && (<div className="empty-state text-center p-xl">
                                        <FiInfo size={48} className="text-secondary mb-md"/>
                                        <h3>All Prescriptions Dispensed</h3>
                                        <p>No pending orders at the moment.</p>
                                    </div>)}
                            </>)}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> {mode === 'dashboard' ? 'Recently Completed' : 'Completed Orders History'}</h2>
                    </div>
                    <div className="prescriptions-list mt-md">
                        {orders
            .filter(p => p.status === 'Completed')
            .slice(0, mode === 'dashboard' ? 5 : undefined)
            .length > 0 ? (orders
            .filter(p => p.status === 'Completed')
            .slice(0, mode === 'dashboard' ? 5 : undefined)
            .map(p => {
            let details = { amount: 0, invoiceId: 'N/A' };
            try {
                if (p.result?.startsWith('{'))
                    details = JSON.parse(p.result);
                else if (typeof p.result === 'object')
                    details = p.result || {};
            }
            catch (e) { }
            return (<div key={p.id} className="list-item" style={{ opacity: 0.8 }}>
                                            <div className="item-main">
                                                <h3>{p.patientName || p.patient?.name || 'Unknown Patient'}</h3>
                                                <p className="item-sub">
                                                    {p.items?.length ? p.items.map((i) => i.medicineName).join(', ') : (details.items ? (Array.isArray(details.items) ? details.items.join(', ') : 'Details Saved') : 'Prescription Fulfilled')}
                                                </p>
                                                <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '0.25rem' }}>
                                                    Inv-Status: PAID - {formatMoney(p.amount || details.amount || details.totalAmount || 0)}
                                                </span>
                                            </div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handlePrintSlip(p)}>
                                                <FiPackage /> <span>Print Slip</span>
                                            </button>
                                        </div>);
        })) : (<p className="text-center p-md text-muted">No completed orders today.</p>)}
                    </div>
                </div>
            </div>

            {isProcessModalOpen && (<div className="modal-overlay">
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>Confirm Dispensing</h2>
                            <button className="close-btn" onClick={() => setIsProcessModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleDispense}>
                            <div className="modal-body">
                                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }}>
                                        <FiCheckCircle size={24}/>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Verified</p>
                                        <h3 style={{ margin: 0, color: '#14532D', fontSize: '1.1rem', fontWeight: 700 }}>{selectedOrder?.patientName || selectedOrder?.patient?.name}</h3>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Order Value</label>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', color: '#1E293B', border: '1px solid #E2E8F0' }}>
                                        {formatMoney(Number(amount) || 0)}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.5rem' }}>Full payment cleared at Reception.</p>
                                </div>

                                {selectedOrder?.items && selectedOrder.items.length > 0 && (<div style={{ marginTop: '1.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Prescribed Items & BreakDown</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {selectedOrder.items.map((item, idx) => {
                    const qty = Number(item.quantity) || 0;
                    const itemPrice = Number(item.unitPrice || item.price || (inventory.find(inv => inv.id === item.inventoryId ||
                        inv.name?.toLowerCase() === item.medicineName?.toLowerCase())?.unitPrice) || 0);
                    return (<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>{item.medicineName || item.testName}</p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                                                                {qty} {item.unit || 'Piece'} × {formatMoney(itemPrice)}
                                                            </p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '1.1rem' }}>
                                                                {formatMoney(qty * itemPrice)}
                                                            </div>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16A34A', marginTop: '2px' }}>
                                                                READY TO DISPENSE
                                                            </div>
                                                        </div>
                                                    </div>);
                })}
                                        </div>
                                    </div>)}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsProcessModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white', opacity: 1 }}>Confirm Dispensing</button>
                            </div>
                        </form>
                    </div>
                </div>)}

            <div id="print-container" style={{ display: 'none' }}>
                <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>INVOICE</h1>
                            <p style={{ color: '#64748B', marginTop: '5px' }}>Pharmacy Department</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Dhanwantri Hospital</h2>
                            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Healthcare City, Dubai</p>
                        </div>
                    </div>
                    {selectedOrder && (<>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                                <div>
                                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>Bill To</h3>
                                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>{selectedOrder.patientName || selectedOrder.patient?.name}</p>
                                    <p style={{ color: '#64748B', marginTop: '5px' }}>Date: {new Date().toLocaleDateString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>Invoice Details</h3>
                                    <p style={{ color: '#1E293B', fontWeight: '600' }}>Order #{selectedOrder.id}</p>
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 16px', borderRadius: '8px 0 0 8px' }}>Description</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '16px', color: '#1E293B' }}>
                                            {selectedOrder.result?.startsWith('{') ? (() => {
                try {
                    const res = JSON.parse(selectedOrder.result);
                    return Array.isArray(res.items) ? res.items.join(', ') : res.service || 'Pharmacy Services';
                }
                catch {
                    return 'Pharmacy Services';
                }
            })() : selectedOrder.items?.length ? selectedOrder.items.map((i) => i.medicineName).join(', ') : selectedOrder.testName || 'Pharmacy Services'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#1E293B' }}>
                                            {selectedOrder.result && (() => { try {
            const r = JSON.parse(selectedOrder.result);
            return r.amount;
        }
        catch {
            return null;
        } })() ? formatMoney(JSON.parse(selectedOrder.result).amount) : 'Pending'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #E2E8F0', paddingTop: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '5px' }}>Total Amount</p>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563EB' }}>
                                        {selectedOrder.result && (() => { try {
            const r = JSON.parse(selectedOrder.result);
            return r.amount;
        }
        catch {
            return null;
        } })() ? formatMoney(JSON.parse(selectedOrder.result).amount) : '0.00'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ marginTop: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                <p>Thank you for choosing Dhanwantri Hospital.</p>
                                <p>This is a computer-generated invoice.</p>
                            </div>
                        </>)}
                </div>
            </div>
        </div>);
};
export default PharmacyOrdersView;
