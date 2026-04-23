import { useState, useEffect } from 'react';
import { FiCheck, FiPrinter, FiInfo, FiSearch, FiPlus, FiX, FiShoppingCart, FiMinus } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { labService } from '../../services/lab.service';
import { receptionService } from '../../services/reception.service';
import { useCurrency } from '../../context/CurrencyContext';
import { buildTaxSummary } from '../../utils/taxCalculator';
import './DepartmentDashboard.css';
const DepartmentDashboard = ({ department, title }) => {
    const { formatMoney } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddStockOpen, setIsAddStockOpen] = useState(false);
    // Form states for completion
    const [resultData, setResultData] = useState({});
    const [priceData, setPriceData] = useState({});
    const [qtyData, setQtyData] = useState({});
    const [gstRateData, setGstRateData] = useState({});
    const [reportUrlData, setReportUrlData] = useState({});
    const [placeOfSupply, setPlaceOfSupply] = useState('');
    const [stockForm, setStockForm] = useState({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '' });
    // POS / Direct Sale states
    const [isDirectSaleOpen, setIsDirectSaleOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [posSearchPatient, setPosSearchPatient] = useState('');
    const [selectedPosPatient, setSelectedPosPatient] = useState(null);
    const [cart, setCart] = useState([]);
    const [submittingPos, setSubmittingPos] = useState(false);
    const [paidData, setPaidData] = useState({});
    const [posPaid, setPosPaid] = useState(false);
    useEffect(() => {
        fetchData();
        if (department === 'pharmacy') {
            fetchPatients();
        }
    }, [department]);
    const fetchPatients = async () => {
        try {
            const res = await receptionService.getPatients();
            setPatients(res.data.data || []);
        }
        catch (e) {
            console.error('Failed to fetch patients', e);
        }
    };
    const fetchData = async () => {
        setLoading(true);
        try {
            if (department === 'pharmacy') {
                const [ordersRes, invRes] = await Promise.all([
                    pharmacyService.getOrders(),
                    pharmacyService.getInventory()
                ]);
                setOrders(ordersRes.data || []);
                setInventory(invRes.data || []);
            }
            else {
                const type = department === 'laboratory' ? 'LAB' : 'RADIOLOGY';
                const ordersRes = await labService.getOrders(type);
                setOrders(ordersRes.data || []);
            }
        }
        catch (error) {
            console.error('Failed to fetch department data', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            await pharmacyService.addInventory(stockForm);
            alert('Stock added successfully!');
            setIsAddStockOpen(false);
            setStockForm({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '' });
            fetchData();
        }
        catch (error) {
            alert('Failed to add stock');
        }
    };
    const handleCompleteLab = async (orderId) => {
        const result = resultData[orderId];
        const price = priceData[orderId];
        if (!result || !price) {
            alert('Please enter result and price');
            return;
        }
        try {
            const finalResult = JSON.stringify({
                findings: result,
                reportUrl: reportUrlData[orderId] || ''
            });
            const taxSummary = buildTaxSummary({
                subtotal: Number(price),
                gstRate: Number(gstRateData[orderId] || 0),
                clinicState: placeOfSupply,
                placeOfSupply
            });
            await labService.completeOrder(orderId, finalResult, Number(price), !!paidData[orderId], {
                gstRate: Number(gstRateData[orderId] || 0),
                taxSummary,
                totalAmount: taxSummary.grandTotal,
                placeOfSupply
            });
            alert('Order completed and invoice generated!');
            fetchData();
        }
        catch (error) {
            alert('Failed to complete order');
        }
    };
    const handleCompletePharmacy = async (order) => {
        const quantity = Number(qtyData[order.id] || 1);
        const stockItem = inventory.find(i => i.name.toLowerCase().includes(order.testName.toLowerCase()));
        if (!stockItem || stockItem.quantity < quantity) {
            alert(`Insufficient stock. Available: ${stockItem?.quantity || 0}. Needed: ${quantity}`);
            return;
        }
        try {
            const baseAmount = Number(stockItem.unitPrice) * quantity;
            const taxSummary = buildTaxSummary({
                subtotal: baseAmount,
                gstRate: Number(gstRateData[order.id] || 0),
                clinicState: placeOfSupply,
                placeOfSupply
            });
            await pharmacyService.processOrder(order.id, [
                { inventoryId: stockItem.id, quantity: quantity, price: stockItem.unitPrice }
            ], !!paidData[order.id], taxSummary.grandTotal, order.source || 'ORDER');
            alert('Pharmacy order processed, stock updated, and invoice generated!');
            fetchData();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to process pharmacy order');
        }
    };
    const handleRejectOrder = async (orderId) => {
        if (!confirm('Are you sure you want to reject this order?'))
            return;
        try {
            await labService.rejectOrder(orderId);
            alert('Order rejected');
            fetchData();
        }
        catch (e) {
            alert('Failed to reject order');
        }
    };
    const addToCart = (product) => {
        const existing = cart.find(c => c.id === product.id);
        if (existing) {
            if (existing.quantity >= product.quantity) {
                alert('Out of stock');
                return;
            }
            setCart(cart.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
        }
        else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };
    const removeFromCart = (productId) => {
        setCart(cart.filter(c => c.id !== productId));
    };
    const updateCartQty = (productId, qty) => {
        const product = inventory.find(p => p.id === productId);
        if (qty > product.quantity) {
            alert('Insufficient stock');
            return;
        }
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(cart.map(c => c.id === productId ? { ...c, quantity: qty } : c));
    };
    const handlePosSubmit = async () => {
        if (!selectedPosPatient) {
            alert('Please select a patient');
            return;
        }
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }
        setSubmittingPos(true);
        try {
            const items = cart.map(c => ({ inventoryId: c.id, quantity: c.quantity, price: c.unitPrice }));
            await pharmacyService.directSale({ patientId: selectedPosPatient.id, items, paid: posPaid });
            alert('Sale completed and invoice generated!');
            setIsDirectSaleOpen(false);
            setCart([]);
            setSelectedPosPatient(null);
            setPosPaid(false);
            fetchData();
        }
        catch (e) {
            alert(e.response?.data?.message || 'Sale failed');
        }
        finally {
            setSubmittingPos(false);
        }
    };
    if (loading)
        return <div className="p-20 text-center">Loading {title}...</div>;
    return (<div className="department-dashboard fade-in">
            <div className="page-header">
                <div>
                    <h1>{title}</h1>
                    <p>Processing pending requests for {department}.</p>
                </div>
                {department === 'pharmacy' && (<div className="header-actions">
                        <button className="btn btn-secondary btn-with-icon" onClick={() => setIsAddStockOpen(true)}>
                            <FiPlus /> <span>Inventory</span>
                        </button>
                        <button className="btn btn-primary btn-with-icon" onClick={() => setIsDirectSaleOpen(true)}>
                            <FiShoppingCart /> <span>Direct Sale (POS)</span>
                        </button>
                    </div>)}
            </div>

            <div className="dashboard-content mt-lg">
                <div className="orders-section">
                    <h2>Pending Orders ({orders.length})</h2>
                    <div className="notifications-grid mt-md">
                        {orders.filter(o => o.status === 'Pending').length > 0 ? (orders.filter(o => o.status === 'Pending').map((o) => (<div key={o.id} className="notification-card card">
                                    <div className="card-top">
                                        <div className="patient-info">
                                            <h3>{o.patient?.name}</h3>
                                            <span className="timestamp">{new Date(o.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="status-pill pending">Pending</div>
                                    </div>

                                    <div className="card-content mt-md">
                                        <div className="order-item-box">
                                            <p><strong>Item/Test:</strong> {o.testName}</p>
                                            {o.result && o.result.includes('{') && (<p className="text-secondary text-sm">
                                                    Notes: {JSON.parse(o.result).notes}
                                                </p>)}
                                        </div>

                                        {(department === 'laboratory' || department === 'radiology') && (<div className="result-form mt-md">
                                                <div className="form-group mb-sm">
                                                    <label>Test Result / Findings</label>
                                                    <textarea className="form-control" placeholder="Enter results here..." value={resultData[o.id] || ''} onChange={(e) => setResultData({ ...resultData, [o.id]: e.target.value })}></textarea>
                                                </div>
                                                <div className="form-group mb-sm">
                                                    <label>Report Link / URL (Optional)</label>
                                                    <input type="text" className="form-control" placeholder="https://storage.link/report.pdf" value={reportUrlData[o.id] || ''} onChange={(e) => setReportUrlData({ ...reportUrlData, [o.id]: e.target.value })}/>
                                                </div>
                                                <div className="form-group">
                                                    <label>Price</label>
                                                    <input type="number" className="form-control" placeholder="0.00" value={priceData[o.id] || ''} onChange={(e) => setPriceData({ ...priceData, [o.id]: e.target.value })}/>
                                                </div>
                                                <div className="form-group">
                                                    <label>GST Rate (%)</label>
                                                    <input type="number" className="form-control" placeholder="0" value={gstRateData[o.id] || ''} onChange={(e) => setGstRateData({ ...gstRateData, [o.id]: e.target.value })}/>
                                                </div>
                                            </div>)}
                                    </div>

                                    <div className="card-actions mt-lg">
                                        {(department === 'laboratory' || department === 'radiology') && (<button className="btn btn-secondary text-danger" onClick={() => handleRejectOrder(o.id)}>
                                                Reject
                                            </button>)}
                                        {department === 'pharmacy' && (<div className="qty-selector mr-md">
                                                <label>Qty:</label>
                                                <input type="number" min="1" className="form-control-qty" value={qtyData[o.id] || 1} onChange={(e) => setQtyData({ ...qtyData, [o.id]: e.target.value })}/>
                                            </div>)}
                                        {department === 'pharmacy' && (<div className="qty-selector mr-md">
                                                <label>GST %:</label>
                                                <input type="number" min="0" className="form-control-qty" value={gstRateData[o.id] || 0} onChange={(e) => setGstRateData({ ...gstRateData, [o.id]: e.target.value })}/>
                                            </div>)}
                                        <div className="payment-checkbox ml-auto mr-md">
                                            <label className="flex items-center gap-sm cur-pointer">
                                                <input type="checkbox" checked={!!paidData[o.id]} onChange={(e) => setPaidData({ ...paidData, [o.id]: e.target.checked })}/>
                                                <span className="text-sm">Paid</span>
                                            </label>
                                        </div>
                                        <button className="btn btn-secondary btn-with-icon" onClick={() => window.print()}>
                                            <FiPrinter /> <span>Print Label</span>
                                        </button>
                                        <button className="btn btn-primary btn-with-icon" disabled={department === 'pharmacy' && (() => {
                const quantity = Number(qtyData[o.id] || 1);
                const stockItem = inventory.find(i => i.name.toLowerCase().includes(o.testName.toLowerCase()));
                return !stockItem || stockItem.quantity < quantity;
            })()} onClick={() => department === 'pharmacy' ? handleCompletePharmacy(o) : handleCompleteLab(o.id)}>
                                            <FiCheck /> <span>Complete</span>
                                        </button>
                                        {department === 'pharmacy' && (() => {
                const quantity = Number(qtyData[o.id] || 1);
                const stockItem = inventory.find(i => i.name.toLowerCase().includes(o.testName.toLowerCase()));
                if (!stockItem || stockItem.quantity < quantity) {
                    return <span className="text-danger text-sm ml-sm font-bold">(Out of Stock: {stockItem?.quantity || 0})</span>;
                }
            })()}
                                    </div>
                                </div>))) : (<div className="empty-state card p-xl text-center">
                                <FiInfo size={48} className="text-secondary mb-md"/>
                                <h3>No Pending Orders</h3>
                                <p>All orders have been processed.</p>
                            </div>)}
                    </div>
                </div>

                {department === 'pharmacy' && (<div className="inventory-section mt-xl">
                        <h2>Current Inventory</h2>
                        <div className="table-container mt-md">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>SKU</th>
                                        <th>Stock</th>
                                        <th>Price</th>
                                        <th>Expiry</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(item => (<tr key={item.id} className={item.quantity < 10 ? 'low-stock' : ''}>
                                            <td>{item.name}</td>
                                            <td>{item.sku}</td>
                                            <td>
                                                <strong className={item.quantity < 10 ? 'text-danger' : 'text-success'}>
                                                    {item.quantity}
                                                </strong>
                                            </td>
                                            <td>{formatMoney(item.unitPrice)}</td>
                                            <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>)}
            </div>

            {isDirectSaleOpen && (<div className="modal-overlay">
                    <div className="modal-content card pos-modal">
                        <div className="modal-header">
                            <h2>Pharmacy Direct Sale (POS)</h2>
                            <button className="btn-close" onClick={() => setIsDirectSaleOpen(false)}><FiX /></button>
                        </div>
                        <div className="pos-body mt-md">
                            <div className="pos-left">
                                <div className="pos-patient-search mb-md">
                                    <label>Search Patient</label>
                                    <div className="input-with-icon-simple">
                                        <FiSearch />
                                        <input type="text" className="form-control" placeholder="Name or Phone..." value={posSearchPatient} onChange={(e) => setPosSearchPatient(e.target.value)}/>
                                    </div>
                                    <div className="patient-results mt-sm">
                                        {posSearchPatient && patients.filter((p) => p.name?.toLowerCase().includes(posSearchPatient.toLowerCase()) ||
                p.phone?.includes(posSearchPatient)).slice(0, 5).map((p) => (<div key={p.id} className={`patient-item-row ${selectedPosPatient?.id === p.id ? 'selected' : ''}`} onClick={() => { setSelectedPosPatient(p); setPosSearchPatient(''); }}>
                                                <span>{p.name}</span>
                                                <span className="text-secondary text-sm">{p.phone}</span>
                                            </div>))}
                                    </div>
                                    {selectedPosPatient && (<div className="selected-patient-box mt-sm">
                                            <FiCheck className="text-success"/>
                                            <span>Selling to: <strong>{selectedPosPatient.name}</strong></span>
                                            <button className="btn-text-danger" onClick={() => setSelectedPosPatient(null)}>Change</button>
                                        </div>)}
                                </div>

                                <div className="pos-inventory">
                                    <div className="form-group">
                                        <label>Place of Supply</label>
                                        <input type="text" className="form-control" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="State/Location"/>
                                    </div>
                                    <label>Add Medicines</label>
                                    <div className="pos-inv-grid mt-sm">
                                        {inventory.filter((i) => i.quantity > 0).map((item) => (<div key={item.id} className="pos-inv-card" onClick={() => addToCart(item)}>
                                                <h4>{item.name}</h4>
                                                <p className="text-sm">Stock: {item.quantity}</p>
                                                <p className="price-tag">{formatMoney(item.unitPrice)}</p>
                                                <button className="btn-add-circle"><FiPlus /></button>
                                            </div>))}
                                    </div>
                                </div>
                            </div>

                            <div className="pos-right">
                                <h3>Cart Summary</h3>
                                <div className="cart-items mt-md">
                                    {cart.length === 0 ? (<p className="text-center text-secondary p-xl">Cart is empty</p>) : (cart.map((c) => (<div key={c.id} className="cart-item-row">
                                                <div className="cart-info">
                                                    <h4>{c.name}</h4>
                                                    <p>{formatMoney(c.unitPrice)} each</p>
                                                </div>
                                                <div className="cart-controls">
                                                    <button onClick={() => updateCartQty(c.id, c.quantity - 1)}><FiMinus /></button>
                                                    <span>{c.quantity}</span>
                                                    <button onClick={() => updateCartQty(c.id, c.quantity + 1)}><FiPlus /></button>
                                                </div>
                                                <button className="btn-remove-item" onClick={() => removeFromCart(c.id)}><FiX /></button>
                                            </div>)))}
                                </div>
                                <div className="cart-total mt-xl">
                                    <div className="total-row">
                                        <span>Total:</span>
                                        <strong>{formatMoney(cart.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0))}</strong>
                                    </div>
                                    <div className="pos-payment-toggle mt-md">
                                        <label className="flex items-center gap-sm cur-pointer">
                                            <input type="checkbox" checked={posPaid} onChange={(e) => setPosPaid(e.target.checked)}/>
                                            <span>Collect Payment Now</span>
                                        </label>
                                    </div>
                                    <button className="btn btn-primary btn-full mt-md" disabled={submittingPos || cart.length === 0 || !selectedPosPatient} onClick={handlePosSubmit}>
                                        {submittingPos ? 'Processing...' : 'Complete Sale & Bill'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>)}

            {isAddStockOpen && (<div className="modal-overlay">
                    <div className="modal-content card">
                        <div className="modal-header">
                            <h2>Purchase Stock</h2>
                            <button className="btn-close" onClick={() => setIsAddStockOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddStock} className="mt-md">
                            <div className="form-group mb-md">
                                <label>Medicine Name</label>
                                <input required className="form-control" type="text" value={stockForm.name} onChange={e => setStockForm({ ...stockForm, name: e.target.value })}/>
                            </div>
                            <div className="form-grid grid-2 mb-md">
                                <div className="form-group">
                                    <label>SKU (Optional)</label>
                                    <input className="form-control" type="text" value={stockForm.sku} onChange={e => setStockForm({ ...stockForm, sku: e.target.value })}/>
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input required className="form-control" type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}/>
                                </div>
                            </div>
                            <div className="form-grid grid-2 mb-md">
                                <div className="form-group">
                                    <label>Unit Price (Sale)</label>
                                    <input required className="form-control" type="number" value={stockForm.unitPrice} onChange={e => setStockForm({ ...stockForm, unitPrice: e.target.value })}/>
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input className="form-control" type="date" value={stockForm.expiryDate} onChange={e => setStockForm({ ...stockForm, expiryDate: e.target.value })}/>
                                </div>
                            </div>
                            <div className="modal-actions-refined mt-lg">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAddStockOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add to Inventory</button>
                            </div>
                        </form>
                    </div>
                </div>)}
        </div>);
};
export default DepartmentDashboard;
