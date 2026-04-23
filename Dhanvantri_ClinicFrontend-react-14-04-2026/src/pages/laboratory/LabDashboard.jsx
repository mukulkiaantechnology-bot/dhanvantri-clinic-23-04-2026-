import { useState, useEffect } from 'react';
import { FiActivity, FiCheckCircle, FiClock, FiCheck, FiUpload, FiPrinter, FiUser, FiX, FiPaperclip } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import { addClinicHeader } from '../../utils/pdfUtils';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
/** Page 1: Laboratory Dashboard – overview only, no tabs */
const LabDashboard = () => {
    const toast = useToast();
    const { user, selectedClinic } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pending: 0, collected: 0, uploadedToday: 0 });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(0);
    const [isPaid, setIsPaid] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await labService.getOrders('LAB');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data))
                data = response.data;
            else if (Array.isArray(response))
                data = response;
            else if (response?.data !== undefined)
                data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
            const today = new Date().toDateString();
            setStats({
                pending: data.filter((o) => (o.testStatus || o.status) === 'Pending').length,
                collected: data.filter((o) => (o.testStatus || o.status) === 'Sample Collected').length,
                uploadedToday: data.filter((o) => ((o.testStatus || o.status) === 'Published' || (o.testStatus || o.status) === 'Completed' || (o.testStatus || o.status) === 'Result Uploaded') &&
                    new Date(o.updatedAt || o.createdAt).toDateString() === today).length,
            });
        }
        catch (error) {
            console.error('Failed to fetch lab orders', error);
            toast.error('Failed to load lab requests');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCollectSample = async (orderId) => {
        try {
            await labService.collectSample(orderId);
            toast.success('Sample marked as collected');
            fetchOrders();
        }
        catch (error) {
            toast.error('Failed to update status');
        }
    };
    const handleOpenResultModal = (order) => {
        setSelectedOrder(order);
        setResultText('');
        setPrice(order.price || 0);
        setIsPaid(order.paymentStatus === 'Paid');
        setSelectedFile(null);
        setIsResultModalOpen(true);
    };
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                toast.error('Only PDF reports are allowed');
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
            setIsSubmitting(true);
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
            setIsResultModalOpen(false);
            fetchOrders();
        }
        catch (error) {
            toast.error('Failed to submit result');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handlePrintReport = async (order) => {
        try {
            const doc = new jsPDF();
            let details = {};
            try {
                details = JSON.parse(order.result || '{}');
            }
            catch (e) {
                details = { notes: order.result };
            }
            const startY = await addClinicHeader(doc, selectedClinic, 'Laboratory Test Report');
            // Patient & Test Info Box
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(15, startY + 5, 180, 30, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text('PATIENT NAME', 20, startY + 12);
            doc.text('TEST NAME', 85, startY + 12);
            doc.text('DATE', 150, startY + 12);
            doc.setTextColor(30);
            doc.setFont('helvetica', 'bold');
            doc.text(order.patient?.name || 'Unknown Patient', 20, startY + 18);
            doc.text(order.testName || 'Laboratory Test', 85, startY + 18);
            doc.text(new Date(order.updatedAt || order.createdAt).toLocaleDateString(), 150, startY + 18);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text('ORDER ID', 20, startY + 25);
            doc.text('STATUS', 85, startY + 25);
            doc.setTextColor(30);
            doc.setFont('helvetica', 'bold');
            doc.text(`#${order.id}`, 20, startY + 31);
            doc.text('FINAL REPORT', 85, startY + 31);
            // Findings Section
            doc.setFontSize(12);
            doc.setTextColor(45, 59, 174);
            doc.text('Examination Findings', 15, startY + 50);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, startY + 53, 195, startY + 53);
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.setFont('helvetica', 'normal');
            let findings = details.notes || order.result || 'No specific notes recorded.';
            if (details.type === 'pdf_attachment')
                findings = details.notes || 'Note: A PDF attachment was uploaded. Please refer to the attached document for full details.';
            const splitFindings = doc.splitTextToSize(findings, 170);
            doc.text(splitFindings, 15, startY + 62);
            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('This is a computer-generated medical report and does not require a physical signature.', 15, pageHeight - 20);
            doc.text(`Generated on: ${new Date().toLocaleString()} | Lab Technician: ${user?.name || 'Authorized Personnel'}`, 15, pageHeight - 15);
            doc.save(`Lab_Report_${order.id}.pdf`);
            toast.success('Report downloaded');
        }
        catch (error) {
            toast.error('Failed to generate PDF');
        }
    };
    useEffect(() => { fetchOrders(); }, []);
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Laboratory Dashboard</h1>
                    <p>Handle lab test results and reports.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="search-box">
                        <input type="text" className="form-control" placeholder="Search Patient or Test..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '1rem' }}/>
                    </div>
                </div>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={() => navigate('/lab/requests')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Pending Collection</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/lab/history')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon blue"><FiActivity /></div>
                    <div className="stat-info">
                        <h3>{stats.collected}</h3>
                        <p>Awaiting Results</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/lab/history')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.uploadedToday}</h3>
                        <p>Completed Today</p>
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2><FiActivity /> Active Technical Workflow</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/lab/requests')}>View Workflow Queue</button>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading workflow...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Details</th>
                                        <th>Payment</th>
                                        <th>Current Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders
                .filter((o) => ['Pending', 'Sample Collected'].includes(o.testStatus || o.status))
                .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
                .length > 0 ? (orders
                .filter((o) => ['Pending', 'Sample Collected'].includes(o.testStatus || o.status))
                .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 15).map((order) => {
                const status = order.testStatus || order.status;
                const isPaidStatus = order.paymentStatus === 'Paid';
                const isCollected = status === 'Sample Collected';
                return (<tr key={order.id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                                                    <FiUser size={16}/>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{order.patient?.name || 'Unknown'}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ID: #{order.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: '#2D3BAE' }}>{order.testName}</div>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Requested: {new Date(order.createdAt).toLocaleDateString()}</div>
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${isPaidStatus ? 'paid' : 'pending'}`} style={{ fontSize: '0.7rem' }}>
                                                                {isPaidStatus ? 'PAID' : 'AWAITING'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.7rem' }}>
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {!isCollected ? (<button className="btn btn-primary btn-xs btn-with-icon" onClick={() => handleCollectSample(order.id)} disabled={!isPaidStatus} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: isPaidStatus ? 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)' : '#CBD5E1', border: 'none', color: 'white' }}>
                                                                    <FiCheck /> Collect Sample
                                                                </button>) : (<button className="btn btn-primary btn-xs btn-with-icon" onClick={() => handleOpenResultModal(order)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#059669', border: 'none', color: 'white' }}>
                                                                    <FiUpload /> Enter Result
                                                                </button>)}
                                                        </td>
                                                    </tr>);
            })) : (<tr><td colSpan={5} className="text-center p-lg text-muted">No active lab requests.</td></tr>)}
                                </tbody>
                            </table>)}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Reports History</h2>
                    </div>
                    <div className="table-container mt-md">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Test Examined</th>
                                    <th>Completion Date</th>
                                    <th>Billing Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders
            .filter((o) => ['Published', 'Completed', 'Result Uploaded'].includes(o.testStatus || o.status))
            .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
            .length > 0 ? (orders
            .filter((o) => ['Published', 'Completed', 'Result Uploaded'].includes(o.testStatus || o.status))
            .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 15).map((order) => {
            let details = {};
            try {
                details = JSON.parse(order.result || '{}');
            }
            catch (e) { }
            const isPaidReport = details.paid || order.paymentStatus === 'Paid';
            return (<tr key={order.id}>
                                                    <td>{order.patient?.name || 'Unknown'}</td>
                                                    <td><strong>{order.testName}</strong></td>
                                                    <td>{new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`status-pill ${isPaidReport ? 'paid' : 'pending'}`} style={{ fontSize: '0.7rem' }}>
                                                            {isPaidReport ? 'PAID' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-secondary btn-xs btn-with-icon" onClick={() => handlePrintReport(order)}>
                                                            <FiPrinter /> Print Report
                                                        </button>
                                                    </td>
                                                </tr>);
        })) : (<tr><td colSpan={5} className="text-center p-md text-muted">No reports found in history.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Unified Result Entry Modal */}
            <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title="Submit Test Findings">
                <form onSubmit={submitResult} className="modal-form">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }}>
                            <FiActivity size={20}/>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Selected Test</p>
                            <h4 style={{ margin: 0, color: '#14532D', fontSize: '1rem' }}>{selectedOrder?.testName} (Patient: {selectedOrder?.patient?.name})</h4>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Normal/Final Findings (Notes)</label>
                        <textarea rows={4} className="form-control" placeholder="Enter test result findings or observations..." value={resultText} onChange={(e) => setResultText(e.target.value)} required={!selectedFile}/>
                    </div>

                    <div className="form-group mt-md">
                        <label>Attachment (PDF Lab Report)</label>
                        <div style={{ border: '2px dashed #E2E8F0', borderRadius: '10px', padding: '1rem', textAlign: 'center', background: '#F8FAFC', position: 'relative' }}>
                            {!selectedFile ? (<>
                                    <FiPaperclip size={20} style={{ color: '#94A3B8' }}/>
                                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '5px 0 0 0' }}>Upload PDF Copy</p>
                                    <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}/>
                                </>) : (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedFile.name}</span>
                                    <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}><FiX /></button>
                                </div>)}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mt-md">
                        <div className="form-group">
                            <label>Final Cost (₹)</label>
                            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(Number(e.target.value))}/>
                        </div>
                        <div className="form-group">
                            <label>Payment</label>
                            <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#fff', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0', margin: 0 }}>
                                <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)}/>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Received</span>
                            </label>
                        </div>
                    </div>

                    <div className="modal-actions mt-lg">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsResultModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none' }}>
                            {isSubmitting ? 'Processing...' : 'Verify & Publish Result'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default LabDashboard;
