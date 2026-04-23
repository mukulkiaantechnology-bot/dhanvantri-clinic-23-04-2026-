import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEye, FiTrash2 } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { doctorService } from '../../services/doctor.service';
import { useCurrency } from '../../context/CurrencyContext';
import Modal from '../../components/Modal';
import './Dashboard.css';
import './Orders.css';
const Orders = () => {
    const { patients: contextPatients } = useApp();
    const { formatMoney } = useCurrency();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderType, setOrderType] = useState('');
    const [inventory, setInventory] = useState([]);
    const [prescriptionItems, setPrescriptionItems] = useState([]);
    const [addItemInventoryId, setAddItemInventoryId] = useState('');
    const [addItemQty, setAddItemQty] = useState(1);
    const [viewedOrder, setViewedOrder] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const handleViewOrder = (order) => {
        setViewedOrder(order);
        setIsViewModalOpen(true);
    };
    useEffect(() => {
        const list = Array.isArray(contextPatients) ? contextPatients : [];
        if (list.length > 0) {
            setPatients(list);
        }
        else {
            doctorService.getPatients().then((r) => {
                const d = r?.data ?? r;
                setPatients(Array.isArray(d) ? d : []);
            }).catch(() => setPatients([]));
        }
    }, [contextPatients]);
    const fetchOrders = async () => {
        try {
            const res = await doctorService.getOrders();
            const data = res?.data ?? res;
            setOrders(Array.isArray(data) ? data : []);
        }
        catch (error) {
            console.error('Failed to fetch orders', error);
            setOrders([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOrders();
    }, []);
    useEffect(() => {
        if (isNewOrderOpen && orderType === 'prescription') {
            doctorService.getPrescriptionInventory()
                .then((r) => {
                const data = r?.data ?? r;
                setInventory(Array.isArray(data) ? data : []);
            })
                .catch(() => setInventory([]));
        }
    }, [isNewOrderOpen, orderType]);
    const handleAddPrescriptionItem = () => {
        const id = Number(addItemInventoryId);
        if (!id || addItemQty < 1)
            return;
        const product = inventory.find((i) => i.id === id);
        if (!product)
            return;
        setPrescriptionItems(prev => [...prev, {
                inventoryId: product.id,
                medicineName: product.name,
                quantity: addItemQty,
                unitPrice: Number(product.unitPrice) || 0
            }]);
        setAddItemInventoryId('');
        setAddItemQty(1);
    };
    const removePrescriptionItem = (index) => {
        setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
    };
    const getOrderTypeKey = (type) => {
        const t = (type || '').toUpperCase();
        if (t === 'LAB' || t === 'LABORATORY')
            return 'lab';
        if (t === 'RADIOLOGY')
            return 'radiology';
        if (t === 'PHARMACY' || t === 'PRESCRIPTION')
            return 'pharmacy';
        return '';
    };
    const getOrderTypeLabel = (type) => {
        const t = (type || '').toUpperCase();
        if (t === 'LAB' || t === 'LABORATORY')
            return 'Laboratory';
        if (t === 'RADIOLOGY')
            return 'Radiology';
        if (t === 'PHARMACY' || t === 'PRESCRIPTION')
            return 'Prescription';
        return type || 'Other';
    };
    const tabs = [
        { id: 'all', label: 'All Orders', count: orders.length },
        { id: 'lab', label: 'Laboratory', count: orders.filter(o => getOrderTypeKey(o.type) === 'lab').length },
        { id: 'radiology', label: 'Radiology', count: orders.filter(o => getOrderTypeKey(o.type) === 'radiology').length },
        { id: 'pharmacy', label: 'Prescriptions', count: orders.filter(o => getOrderTypeKey(o.type) === 'pharmacy').length }
    ];
    const filteredOrders = orders.filter(order => order.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (activeTab === 'all' || getOrderTypeKey(order.type) === activeTab));
    return (<div className="doctor-dashboard">
            {/* Page Header */}
            <div className="orders-page-header">
                <div>
                    <h1 className="orders-title">Medical Orders</h1>
                    <p className="orders-subtitle">Manage lab tests, radiology scans, and prescriptions</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={() => setIsNewOrderOpen(true)}>
                    <FiPlus />
                    <span>New Order</span>
                </button>
            </div>

            {/* Search and Filter Card */}
            <div className="orders-filter-card">
                <div className="search-box-full">
                    <FiSearch className="search-icon-small"/>
                    <input type="text" placeholder="Search by patient name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-minimal"/>
                </div>

                <div className="filter-tabs">
                    {tabs.map(tab => (<button key={tab.id} className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.label} ({tab.count})
                        </button>))}
                </div>
            </div>

            {/* Orders Grid */}
            <div className="orders-grid">
                {loading ? (<div className="p-20 text-center">Loading orders...</div>) : filteredOrders.length > 0 ? (filteredOrders.map(order => (<div key={order.id} className="order-card-modern">
                            <div className="order-card-header">
                                <div className="order-patient-section">
                                    <h3 className="order-patient-name">{order.patientName}</h3>
                                    <p className="order-meta">Order #{order.id} • {new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`order-type-badge ${getOrderTypeKey(order.type) || 'other'}`}>
                                    {getOrderTypeLabel(order.type)}
                                </span>
                            </div>

                            <div className="order-details-section">
                                <div className="order-detail-row">
                                    <span className="order-label">Details:</span>
                                    <span className="order-value">{order.details}</span>
                                </div>
                                <div className="order-detail-row">
                                    <span className="order-label">Status:</span>
                                    <span className="order-value">{order.status}</span>
                                </div>
                            </div>

                            <div className="order-card-footer">
                                <span className={`status-badge-order ${order.status.toLowerCase()}`}>
                                    {order.status}
                                </span>
                                <button className="btn-view-order" onClick={() => handleViewOrder(order)}>
                                    <FiEye />
                                    View
                                </button>
                            </div>
                        </div>))) : (<div className="empty-state-orders">
                        <div className="empty-icon-large">
                            <FiSearch />
                        </div>
                        <h3>No orders found</h3>
                        <p>No orders match your search criteria</p>
                    </div>)}
            </div>

            {/* New Order Modal */}
            <Modal isOpen={isNewOrderOpen} onClose={() => { setIsNewOrderOpen(false); setOrderType(''); setPrescriptionItems([]); }} title="Create New Order" size="lg">
                <form className="order-form-modal" onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
                const form = e.target;
                const isPrescription = (form.type.value || orderType || '').toLowerCase().includes('presc') || (form.type.value || orderType || '').toLowerCase().includes('pharm');
                const data = {
                    patientId: form.patientId.value,
                    type: form.type.value,
                    priority: form.priority.value,
                    date: form.date.value,
                    notes: form.notes.value
                };
                if (isPrescription) {
                    if (prescriptionItems.length === 0) {
                        alert('Add at least one medicine to the prescription.');
                        setLoading(false);
                        return;
                    }
                    data.items = prescriptionItems;
                }
                else {
                    data.items = form.querySelector('[name="items"]')?.value || '';
                    if (!data.items.trim()) {
                        alert('Enter tests or items.');
                        setLoading(false);
                        return;
                    }
                }
                await doctorService.createOrder(data);
                alert('Order created successfully!');
                setIsNewOrderOpen(false);
                setOrderType('');
                setPrescriptionItems([]);
                fetchOrders();
            }
            catch (err) {
                console.error(err);
                alert('Failed to create order');
            }
            finally {
                setLoading(false);
            }
        }}>
                    <div className="form-group">
                        <label>Select Patient *</label>
                        <select name="patientId" required>
                            <option value="">Choose patient...</option>
                            {(patients || []).map((patient) => (<option key={patient.id} value={patient.id}>
                                    {patient.id.toString().padStart(3, '0')}-{patient.name}

                                </option>))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Order Type *</label>
                        <select name="type" required value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                            <option value="">Select type...</option>
                            <option value="lab">Laboratory Test</option>
                            <option value="radiology">Radiology Scan</option>
                            <option value="prescription">Prescription</option>
                        </select>
                    </div>

                    {orderType === 'prescription' ? (<div className="form-group">
                            <label>Medicines * (select from pharmacy inventory)</label>
                            <div className="prescription-add-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                                <select value={addItemInventoryId} onChange={(e) => setAddItemInventoryId(e.target.value)} className="form-control" style={{ flex: '1 1 200px', minWidth: '140px' }}>
                                    <option value="">Select medicine...</option>
                                    {inventory.map((inv) => (<option key={inv.id} value={inv.id}>
                                            {inv.name} {inv.sku ? `(${inv.sku})` : ''} — {formatMoney(Number(inv.unitPrice || 0))}
                                        </option>))}
                                </select>
                                <input type="number" min={1} value={addItemQty} onChange={(e) => setAddItemQty(Number(e.target.value) || 1)} style={{ width: '80px', padding: '0.5rem' }}/>
                                <button type="button" className="btn btn-primary btn-sm btn-no-hover" onClick={handleAddPrescriptionItem}>
                                    <FiPlus /> Add
                                </button>
                            </div>
                            {prescriptionItems.length > 0 && (<ul className="prescription-items-list" style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    {prescriptionItems.map((item, idx) => (<li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                            <span><strong>{item.medicineName}</strong> x{item.quantity} — {formatMoney(item.unitPrice * item.quantity)}</span>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => removePrescriptionItem(idx)} style={{ padding: '0.25rem 0.5rem' }}>
                                                <FiTrash2 />
                                            </button>
                                        </li>))}
                                </ul>)}
                            {orderType === 'prescription' && inventory.length === 0 && (<p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>Loading inventory… Add medicines in Pharmacy → Inventory if none appear.</p>)}
                        </div>) : (<div className="form-group">
                            <label>Tests/Items *</label>
                            <textarea name="items" rows={3} placeholder="Enter tests or items (e.g., CBC, Blood Sugar)" required={orderType !== 'prescription'}></textarea>
                        </div>)}

                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Priority</label>
                            <select name="priority">
                                <option value="routine">Routine</option>
                                <option value="urgent">Urgent</option>
                                <option value="stat">STAT</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Order Date</label>
                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Clinical Notes</label>
                        <textarea name="notes" rows={3} placeholder="Additional instructions or notes..."></textarea>
                    </div>


                    <div className="modal-actions-refined">
                        <button type="button" className="btn-cancel" onClick={() => setIsNewOrderOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-no-hover" disabled={loading}>
                            {loading ? 'Creating...' : (<>
                                    <FiPlus />
                                    Create Order
                                </>)}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Order Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setViewedOrder(null); }} title="Order Details" size="md">
                {viewedOrder && (<div className="order-view-content" style={{ padding: '0.5rem' }}>
                        <div className="view-section" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{viewedOrder.patientName}</h2>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Order #{viewedOrder.id} • {new Date(viewedOrder.date).toLocaleDateString()}</p>
                        </div>

                        <div className="view-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="view-item">
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Type</label>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{getOrderTypeLabel(viewedOrder.type)}</div>
                            </div>
                            <div className="view-item">
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Status</label>
                                <span className={`status-badge-order ${viewedOrder.status.toLowerCase()}`}>
                                    {viewedOrder.status}
                                </span>
                            </div>
                        </div>

                        <div className="view-section" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Details / Requirements</label>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                                {viewedOrder.details}
                            </div>
                        </div>

                        {viewedOrder.result?.notes && (<div className="view-section" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Clinical Notes</label>
                                <div style={{ color: '#475569', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                    "{viewedOrder.result.notes}"
                                </div>
                            </div>)}

                        {viewedOrder.result?.items && Array.isArray(viewedOrder.result.items) && viewedOrder.result.items.length > 0 && (<div className="view-section" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Prescription Items</label>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead style={{ background: '#f1f5f9' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b' }}>Item</th>
                                                <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b' }}>Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewedOrder.result.items.map((item, idx) => (<tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{item.medicineName}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.quantity}</td>
                                                </tr>))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>)}

                        <div className="modal-actions-refined" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                            <button className="btn btn-primary" onClick={() => setIsViewModalOpen(false)} style={{ width: '100%', justifyContent: 'center', background: 'var(--primary-color)', transform: 'none', boxShadow: 'none' }}>
                                Close
                            </button>
                        </div>
                    </div>)}
            </Modal>
        </div>);
};
export default Orders;
