import { useState, useEffect } from 'react';
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import '../SharedDashboard.css';
/** Page 5: Radiology History – completed scans only */
const RadiologyHistory = () => {
    const toast = useToast();
    const { formatMoney } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            const response = await labService.getOrders('RADIOLOGY');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data))
                data = response.data;
            else if (Array.isArray(response))
                data = response;
            else if (response?.data !== undefined)
                data = Array.isArray(response.data) ? response.data : [];
            const completedData = data.filter((o) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status));
            setOrders(completedData);
        }
        catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load history');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => { fetchOrders(); }, []);
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>History</h1>
                    <p>Completed radiology scans and reports.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Scans & Reports</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Scan Type</th>
                                        <th>Price</th>
                                        <th>Paid Status</th>
                                        <th>Invoice #</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map((order) => {
                let details = {};
                try {
                    details = JSON.parse(order.result || '{}');
                }
                catch (e) { }
                return (<tr key={order.id}>
                                                <td>{order.patient?.name || 'Unknown'}</td>
                                                <td>{order.testName}</td>
                                                <td>{details.amount ?? order.price ? formatMoney(details.amount ?? order.price) : '-'}</td>
                                                <td>
                                                    <span className={`status-pill ${details.paid ? 'paid' : 'pending'}`}>
                                                        {details.paid ? 'PAID' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>{details.invoiceId || 'N/A'}</td>
                                                <td>
                                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                                                        Print Inv
                                                    </button>
                                                </td>
                                            </tr>);
            }) : (<tr><td colSpan={6} className="text-center p-md text-muted">No completed scans.</td></tr>)}
                                </tbody>
                            </table>)}
                    </div>
                </div>
            </div>
        </div>);
};
export default RadiologyHistory;
