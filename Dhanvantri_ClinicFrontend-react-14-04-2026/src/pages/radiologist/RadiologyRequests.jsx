import { useState, useEffect } from 'react';
import { FiActivity, FiUpload, FiCheckCircle, FiPaperclip, FiX, FiFileText } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
/** Page 2: Scan Requests – pending only, with Upload Report / Reject */
const RadiologyRequests = () => {
    const { selectedClinic } = useAuth();
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fetchOrders = async () => {
        try {
            // Fetch both Pending and Sample Collected orders
            const [pendingRes, collectedRes] = await Promise.all([
                labService.getOrders('RADIOLOGY', 'Pending'),
                labService.getOrders('RADIOLOGY', 'Sample Collected')
            ]);
            const parseRes = (response) => {
                if (response?.status === 'success' && Array.isArray(response.data))
                    return response.data;
                if (Array.isArray(response))
                    return response;
                if (response?.data !== undefined)
                    return Array.isArray(response.data) ? response.data : [];
                return [];
            };
            const data = [...parseRes(pendingRes), ...parseRes(collectedRes)];
            setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
        catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load requests');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchOrders(); }, []);
    const handleOpenUpload = (order) => {
        setSelectedOrder(order);
        setResultText('');
        setSelectedFile(null);
        setIsUploadModalOpen(true);
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
            await labService.completeOrder(selectedOrder.id, submissionResult);
            toast.success('Report uploaded successfully');
            setIsUploadModalOpen(false);
            fetchOrders();
        }
        catch (error) {
            console.error('Submission failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to submit report');
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleCollectSample = async (orderId) => {
        try {
            await labService.collectSample(orderId);
            toast.success('Patient marked as collected');
            fetchOrders();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update');
        }
    };
    const handleRejectOrder = async (orderId) => {
        if (!window.confirm('Reject this radiology request?'))
            return;
        try {
            await labService.rejectOrder(orderId);
            toast.success('Request rejected');
            fetchOrders();
        }
        catch (error) {
            toast.error('Failed to reject');
        }
    };
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {selectedClinic?.logo && (<div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid #E2E8F0', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${selectedClinic.logo}`} alt="Clinic Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/>
                        </div>)}
                    <div>
                        <h1>{selectedClinic?.name || 'Scan Requests'}</h1>
                        <p>View and manage pending radiology scan requests.</p>
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Radiology Technical Workflow</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Type</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map((order) => {
                const isPaid = order.paymentStatus === 'Paid';
                const isCollected = order.testStatus === 'Sample Collected';
                return (<tr key={order.id}>
                                                <td>{order.patient?.name || 'Unknown'}</td>
                                                <td><strong>{order.testName}</strong></td>
                                                <td>
                                                    <span className={`status-pill ${isPaid ? 'paid' : 'pending'}`}>
                                                        {isPaid ? 'PAID' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${(order.testStatus || '').toLowerCase().replace(' ', '-')}`}>
                                                        {order.testStatus}
                                                    </span>
                                                </td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button type="button" className="btn btn-primary btn-sm btn-with-icon" onClick={() => handleCollectSample(order.id)} disabled={!isPaid || isCollected} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }} title={!isPaid ? "Payment required before collection" : ""}>
                                                        <FiCheckCircle /> {isCollected ? 'Collected' : 'Mark Collected'}
                                                    </button>
                                                    <button type="button" className="btn btn-upload-report btn-sm btn-with-icon" onClick={() => handleOpenUpload(order)} disabled={!isCollected} title={!isCollected ? "Sample must be collected before uploading result" : ""}>
                                                        <FiUpload /> Upload Report
                                                    </button>
                                                    {!isCollected && (<button type="button" className="btn btn-secondary btn-sm" style={{ borderColor: '#fecaca', color: '#b91c1c' }} onClick={() => handleRejectOrder(order.id)}>
                                                            Reject
                                                        </button>)}
                                                </td>
                                            </tr>);
            }) : (<tr><td colSpan={6} className="text-center p-lg text-muted">No pending radiology requests.</td></tr>)}
                                </tbody>
                            </table>)}
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
                        <label>Attachment (PDF Radiology Report)</label>
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
                        <label>Findings / Report Details</label>
                        <textarea rows={4} className="form-control" placeholder="Enter scan findings or notes..." value={resultText} onChange={(e) => setResultText(e.target.value)} required={!selectedFile}/>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-no-hover" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default RadiologyRequests;
