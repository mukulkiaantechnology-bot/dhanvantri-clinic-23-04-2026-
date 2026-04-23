import { useState, useEffect, useRef } from 'react';
import { FiActivity, FiUpload, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
const RadiologistDashboard = () => {
    const toast = useToast();
    const { formatMoney } = useCurrency();
    const [stats, setStats] = useState({
        pending: 0,
        completedToday: 0
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Upload Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(150); // Higher default for Radiology
    const [isPaid, setIsPaid] = useState(false);
    const pendingRef = useRef(null);
    const completedRef = useRef(null);
    const scrollToPending = () => {
        pendingRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const scrollToCompleted = () => {
        completedRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            const response = await labService.getOrders('RADIOLOGY');
            // Handle both { status: 'success', data: [] } and direct []
            let data = [];
            if (response && response.status === 'success' && Array.isArray(response.data)) {
                data = response.data;
            }
            else if (Array.isArray(response)) {
                data = response;
            }
            else if (response && Array.isArray(response.data)) {
                data = response.data;
            }
            setOrders(data);
            // Calculate stats
            const pending = data.filter((o) => o.status === 'Pending').length;
            const completed = data.filter((o) => o.status === 'Completed').length;
            setStats({ pending, completedToday: completed });
        }
        catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load requests');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        fetchOrders();
    }, []);
    const handleOpenUpload = (order) => {
        setSelectedOrder(order);
        setResultText('');
        setIsPaid(false);
        setIsUploadModalOpen(true);
    };
    const submitResult = async (e) => {
        e.preventDefault();
        if (!selectedOrder)
            return;
        try {
            await labService.completeOrder(selectedOrder.id, resultText, price, isPaid);
            toast.success('Report uploaded successfully');
            setIsUploadModalOpen(false);
            fetchOrders(); // Refresh list
        }
        catch (error) {
            console.error('Failed to upload report', error);
            toast.error('Failed to submit report');
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Radiologist Dashboard</h1>
                    <p>Report and manage imaging results.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={scrollToPending} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Pending Reports</p>
                    </div>
                </div>
                <div className="stat-card" onClick={scrollToCompleted} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.completedToday}</h3>
                        <p>Completed Today</p>
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl" ref={pendingRef}>
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Pending Radiology Requests</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading requests...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Type</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map(order => (<tr key={order.id}>
                                            <td>{order.patient?.name || 'Unknown'}</td>
                                            <td><strong>{order.testName}</strong></td>
                                            <td>
                                                <span className={`status-pill ${order.status?.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            <td>
                                                {order.status === 'Pending' && (<button className="btn btn-primary btn-sm btn-with-icon" onClick={() => handleOpenUpload(order)}>
                                                        <FiUpload /> <span>Upload Report</span>
                                                    </button>)}
                                            </td>
                                        </tr>)) : (<tr>
                                            <td colSpan={5} className="text-center p-lg text-muted">No pending radiology requests found.</td>
                                        </tr>)}
                                </tbody>
                            </table>)}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl" ref={completedRef}>
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Scans & Reports</h2>
                    </div>
                    <div className="table-container mt-md">
                        <table className="data-table">
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
                                {orders.filter(o => o.status === 'Completed').length > 0 ? (orders.filter(o => o.status === 'Completed').map(order => {
            let details = {};
            try {
                details = JSON.parse(order.result || '{}');
            }
            catch (e) {
                details = { findings: order.result };
            }
            return (<tr key={order.id}>
                                                <td>{order.patient?.name || 'Unknown'}</td>
                                                <td>{order.testName}</td>
                                                <td>{details.amount || order.price ? formatMoney(details.amount || order.price) : '-'}</td>
                                                <td>
                                                    <span className={`status-pill ${details.paid ? 'paid' : 'pending'}`}>
                                                        {details.paid ? 'PAID' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>{details.invoiceId || 'N/A'}</td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                                                        Print Inv
                                                    </button>
                                                </td>
                                            </tr>);
        })) : (<tr><td colSpan={6} className="text-center p-md text-muted">No completed scans today.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Radiology Report">
                <form onSubmit={submitResult} className="modal-form">
                    <div className="form-group">
                        <label>Test Type</label>
                        <input type="text" value={selectedOrder?.testName || ''} disabled className="bg-gray-100"/>
                    </div>
                    <div className="form-group">
                        <label>Findings / Report URL</label>
                        <textarea rows={4} className="form-control" placeholder="Enter detailed findings from the scan..." value={resultText} onChange={(e) => setResultText(e.target.value)} required></textarea>
                    </div>
                    <div className="form-group">
                        <label>Cost</label>
                        <input type="number" className="form-control" value={price} onChange={(e) => setPrice(Number(e.target.value))}/>
                    </div>
                    <div className="form-group mt-md">
                        <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)}/>
                            <span>Payment Received (Mark as Paid)</span>
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-no-hover">Submit Report</button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default RadiologistDashboard;
