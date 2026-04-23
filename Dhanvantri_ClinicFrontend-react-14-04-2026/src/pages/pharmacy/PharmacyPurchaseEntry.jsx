import { useState } from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';
const PharmacyPurchaseEntry = () => {
    const toast = useToast();
    const [addItemForm, setAddItemForm] = useState({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '' });
    const [submitting, setSubmitting] = useState(false);
    const handleAddInventory = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await pharmacyService.addInventory({
                name: addItemForm.name,
                sku: addItemForm.sku || undefined,
                quantity: Number(addItemForm.quantity) || 0,
                unitPrice: Number(addItemForm.unitPrice) || 0,
                expiryDate: addItemForm.expiryDate || undefined,
            });
            toast.success('Item added to inventory');
            setAddItemForm({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '' });
        }
        catch (err) {
            console.error(err);
            toast.error('Failed to add item');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Purchase Entry</h1>
                    <p>Add new items to pharmacy inventory.</p>
                </div>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiShoppingCart /> Add to Inventory</h2>
                </div>
                <div style={{ padding: '2rem', maxWidth: '480px' }}>
                    <form onSubmit={handleAddInventory} className="modal-form">
                        <div className="form-group">
                            <label>Item Name *</label>
                            <input type="text" className="form-control" value={addItemForm.name} onChange={e => setAddItemForm(f => ({ ...f, name: e.target.value }))} required/>
                        </div>
                        <div className="form-group">
                            <label>SKU</label>
                            <input type="text" className="form-control" value={addItemForm.sku} onChange={e => setAddItemForm(f => ({ ...f, sku: e.target.value }))}/>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Quantity *</label>
                                <input type="number" min={0} className="form-control" value={addItemForm.quantity} onChange={e => setAddItemForm(f => ({ ...f, quantity: e.target.value }))} required/>
                            </div>
                            <div className="form-group">
                                <label>Unit Price *</label>
                                <input type="number" min={0} step={0.01} className="form-control" value={addItemForm.unitPrice} onChange={e => setAddItemForm(f => ({ ...f, unitPrice: e.target.value }))} required/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Expiry Date</label>
                            <input type="date" className="form-control" value={addItemForm.expiryDate} onChange={e => setAddItemForm(f => ({ ...f, expiryDate: e.target.value }))}/>
                        </div>
                        <div className="modal-actions mt-lg">
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Adding...' : 'Add to Inventory'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>);
};
export default PharmacyPurchaseEntry;
