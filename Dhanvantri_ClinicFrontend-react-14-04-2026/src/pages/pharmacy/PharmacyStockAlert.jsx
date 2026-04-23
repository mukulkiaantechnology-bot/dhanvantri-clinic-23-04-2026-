import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import '../SharedDashboard.css';
const LOW_STOCK_THRESHOLD = 10;
const PharmacyStockAlert = () => {
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fetchLowStock = async () => {
        try {
            setRefreshing(true);
            const res = await pharmacyService.getLowStock();
            const data = res?.data ?? res ?? [];
            setLowStock(Array.isArray(data) ? data : []);
        }
        catch (error) {
            try {
                const invRes = await pharmacyService.getInventory();
                const inv = invRes?.data ?? invRes ?? [];
                const list = Array.isArray(inv) ? inv : [];
                setLowStock(list.filter((i) => Number(i.quantity || 0) <= LOW_STOCK_THRESHOLD));
            }
            catch (e) {
                console.error('Failed to fetch low stock', error);
            }
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => { fetchLowStock(); }, []);
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Stock Alert</h1>
                    <p>Items with low stock (≤{LOW_STOCK_THRESHOLD} units).</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchLowStock} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>Refresh</span>
                </button>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiAlertTriangle /> Low Stock Alert (≤{LOW_STOCK_THRESHOLD})</h2>
                </div>
                <div className="table-responsive" style={{ padding: '1.5rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={4} className="text-center">Loading...</td></tr>) : lowStock.length > 0 ? lowStock.map((i) => (<tr key={i.id}>
                                    <td>{i.name}</td>
                                    <td>{i.sku || '-'}</td>
                                    <td><strong style={{ color: '#b91c1c' }}>{i.quantity}</strong></td>
                                    <td>{i.unitPrice ?? '-'}</td>
                                </tr>)) : (<tr><td colSpan={4} className="text-center p-lg text-muted">No low stock items.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
export default PharmacyStockAlert;
