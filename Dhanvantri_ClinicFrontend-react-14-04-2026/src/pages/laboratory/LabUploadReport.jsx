import { useState, useEffect } from 'react';
import { FiActivity, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
/** Page 5: Upload Report – pending list + upload report modal */
const LabUploadReport = () => {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(50);
    const [isPaid, setIsPaid] = useState(false);
    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            const response = await labService.getOrders('LAB');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data))
                data = response.data;
            else if (Array.isArray(response))
                data = response;
            else if (response?.data !== undefined)
                data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
        }
        catch (error) {
            console.error('Failed to fetch lab orders', error);
            toast.error('Failed to load');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => { fetchOrders(); }, []);
    const pending = orders.filter((o) => o.status === 'Pending');
    const handleOpenUpload = (order) => {
        setSelectedOrder(order);
        setResultText('');
        setPrice(50);
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
            fetchOrders();
        }
        catch (error) {
            toast.error('Failed to upload report');
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Upload Report</h1>
                    <p>Enter lab test results for pending requests and mark them complete.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Pending Lab Requests</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Name</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.length > 0 ? pending.map((order) => (<tr key={order.id}>
                                            <td>{order.patient?.name || 'Unknown'}</td>
                                            <td><strong>{order.testName}</strong></td>
                                            <td><span className={`status-pill ${(order.status || '').toLowerCase().replace(' ', '-')}`}>{order.status}</span></td>
                                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            <td>
                                                <button type="button" className="btn btn-upload-report btn-sm btn-with-icon" onClick={() => handleOpenUpload(order)}>
                                                    <FiUpload /> Upload Report
                                                </button>
                                            </td>
                                        </tr>)) : (<tr>
                                            <td colSpan={5} className="text-center p-lg text-muted">
                                                <p style={{ margin: 0, fontWeight: 600 }}>No pending requests.</p>
                                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Lab reports are uploaded for orders that appear here. New requests are created from the Doctor dashboard (Lab Test Orders).</p>
                                            </td>
                                        </tr>)}
                                </tbody>
                            </table>)}
                    </div>
                </div>
            </div>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Lab Report">
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Enter the test result below. This will mark the request as complete.</p>
                <form onSubmit={submitResult} className="modal-form">
                    <div className="form-group">
                        <label>Test Name</label>
                        <input type="text" value={selectedOrder?.testName || ''} disabled className="bg-gray-100"/>
                    </div>
                    <div className="form-group">
                        <label>Result / Report Details *</label>
                        <textarea rows={4} className="form-control" placeholder="Enter test results or report summary..." value={resultText} onChange={(e) => setResultText(e.target.value)} required/>
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
                        <button type="submit" className="btn btn-upload-report">Upload Report</button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default LabUploadReport;
