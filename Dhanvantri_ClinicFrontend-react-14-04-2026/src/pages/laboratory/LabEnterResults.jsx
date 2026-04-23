import { useState, useEffect } from 'react';
import { FiActivity, FiUpload, FiRefreshCw, FiPaperclip, FiX, FiFileText } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
/** Page 4: Enter Results – pending list + enter result modal */
const LabEnterResults = () => {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(50);
    const [isPaid, setIsPaid] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            // Enter Result page should only show sample-collected requests
            const collectedRes = await labService.getOrders('LAB', 'Sample Collected');
            const parseRes = (response) => {
                const payload = response?.data ?? response;
                if (payload?.success && Array.isArray(payload.data))
                    return payload.data;
                if (Array.isArray(payload))
                    return payload;
                if (payload?.data !== undefined)
                    return Array.isArray(payload.data) ? payload.data : [];
                return [];
            };
            const data = parseRes(collectedRes);
            setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
        catch (error) {
            console.error('Failed to fetch lab orders', error);
            toast.error('Failed to load requests');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                toast.error('Only PDF files are allowed');
                return;
            }
            setSelectedFile(file);
        }
    };
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };
    useEffect(() => { fetchOrders(); }, []);
    const handleOpenUpload = (order) => {
        setSelectedOrder(order);
        setResultText('');
        setPrice(order.price || 50);
        setIsPaid(order.paymentStatus === 'Paid');
        setSelectedFile(null);
        setIsUploadModalOpen(true);
    };
    const submitResult = async (e) => {
        e.preventDefault();
        if (!selectedOrder)
            return;
        try {
            setIsUploading(true);
            let submissionResult = resultText;
            if (selectedFile) {
                const base64 = await convertToBase64(selectedFile);
                submissionResult = JSON.stringify({
                    type: 'pdf_attachment',
                    fileName: selectedFile.name,
                    fileData: base64,
                    notes: resultText
                });
            }
            await labService.completeOrder(selectedOrder.id, submissionResult, price, isPaid);
            toast.success('Result submitted successfully');
            setIsUploadModalOpen(false);
            fetchOrders();
        }
        catch (error) {
            console.error('Submission failed:', error);
            toast.error('Failed to submit result');
        }
        finally {
            setIsUploading(false);
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Enter Results</h1>
                    <p>Enter lab test results for pending requests.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Pending Lab Technical Workflow</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Name</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map((order) => {
                const isPaidStatus = order.paymentStatus === 'Paid';
                return (<tr key={order.id}>
                                                <td>{order.patient?.name || 'Unknown'}</td>
                                                <td><strong>{order.testName}</strong></td>
                                                <td>
                                                    <span className={`status-pill ${isPaidStatus ? 'paid' : 'pending'}`}>
                                                        {isPaidStatus ? 'PAID' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase().replace(' ', '-')}`}>
                                                        {order.testStatus || order.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <button type="button" className="btn btn-upload-report btn-sm btn-with-icon btn-no-hover" onClick={() => handleOpenUpload(order)}>
                                                        <FiUpload /> Enter Result
                                                    </button>
                                                </td>
                                            </tr>);
            }) : (<tr><td colSpan={6} className="text-center p-lg text-muted">No sample-collected requests. First mark sample as collected in Requests/Collection.</td></tr>)}
                                </tbody>
                            </table>)}
                    </div>
                </div>
            </div>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Enter Lab Result">
                <form onSubmit={submitResult} className="modal-form">
                    <div className="form-group">
                        <label>Test Name</label>
                        <input type="text" value={selectedOrder?.testName || ''} disabled className="bg-gray-100"/>
                    </div>
                    <div className="form-group">
                        <label>Result / Report Details</label>
                        <textarea rows={3} className="form-control" placeholder="Enter findings or notes..." value={resultText} onChange={(e) => setResultText(e.target.value)} required={!selectedFile}/>
                    </div>

                    <div className="form-group">
                        <label>Attachment (PDF Lab Report)</label>
                        <div style={{
            border: '2px dashed #E2E8F0',
            borderRadius: '10px',
            padding: '1.5rem',
            textAlign: 'center',
            background: '#F8FAFC',
            position: 'relative',
            transition: 'all 0.2s',
            marginBottom: '1rem'
        }}>
                            {!selectedFile ? (<>
                                    <FiPaperclip size={24} style={{ color: '#94A3B8', marginBottom: '0.5rem' }}/>
                                    <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                                        Click to browse or drag and drop PDF report
                                    </p>
                                    <input type="file" accept=".pdf" onChange={handleFileChange} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
            }}/>
                                </>) : (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: '#FEE2E2', color: '#DC2626', width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiFileText />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>{selectedFile.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                                        <FiX size={18}/>
                                    </button>
                                </div>)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Cost</label>
                        <input type="number" className="form-control" value={price} onChange={(e) => setPrice(Number(e.target.value))}/>
                    </div>
                    <div className="form-group mt-md">
                        <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} style={{ width: '18px', height: '18px' }}/>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Payment Received (Mark as Paid)</span>
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-no-hover" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Submit Result'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default LabEnterResults;
