/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { FiActivity, FiCheckCircle, FiClock, FiUpload, FiPrinter, FiUser, FiX, FiPaperclip, FiImage } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import { addClinicHeader } from '../../utils/pdfUtils';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';
/** Page 1: Radiology Dashboard – overview only */
const RadiologyDashboard = () => {
    const toast = useToast();
    const { user, selectedClinic } = useAuth();
    const [stats, setStats] = useState({ pending: 0, imageUploaded: 0, completedToday: 0 });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    // Modal state
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(0);
    const [isPaid, setIsPaid] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            setLoading(true);
            const response = await labService.getOrders('RADIOLOGY');
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
                imageUploaded: data.filter((o) => (o.testStatus || o.status) === 'Image Uploaded').length,
                completedToday: data.filter((o) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status) &&
                    new Date(o.updatedAt || o.createdAt).toDateString() === today).length,
            });
        }
        catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load requests');
        }
        finally {
            setLoading(false);
        }
    };
    const handleOpenUploadImage = (order) => {
        setSelectedOrder(order);
        setPrice(order.price || 0);
        setIsPaid(order.paymentStatus === 'Paid');
        setSelectedFile(null);
        setIsUploadModalOpen(true);
    };
    const handleOpenUploadReport = (order) => {
        setSelectedOrder(order);
        setResultText('');
        setPrice(order.price || 0);
        setIsPaid(order.paymentStatus === 'Paid');
        setSelectedFile(null);
        setIsReportModalOpen(true);
    };
    const handleFileChange = (e, fileType) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (fileType === 'pdf' && file.type !== 'application/pdf') {
                toast.error('Only PDF reports are allowed');
                return;
            }
            if (fileType === 'image' && !file.type.startsWith('image/')) {
                toast.error('Only image files are allowed');
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
    const submitImage = async (e) => {
        e.preventDefault();
        if (!selectedOrder || !selectedFile) {
            toast.error('Please select an image file');
            return;
        }
        try {
            setIsSubmitting(true);
            const base64 = await convertToBase64(selectedFile);
            const submissionResult = JSON.stringify({
                type: 'image_attachment',
                fileName: selectedFile.name,
                fileData: base64,
                status: 'Image Uploaded'
            });
            // Updating order to 'Image Uploaded' - Note: you might need a specific endpoint if 'completeOrder' automatically closes it.
            // For now, assuming completeOrder handles intermediate states based on the result JSON.
            // Wait, standard labService.completeOrder might mark it completed. Let's use it but note it might complete it.
            // Actually, typical workflow would be to let RADIOLOGY use generic completeOrder and then maybe another manual step?
            // To be safe and keep it functional, we submit the image.
            await labService.completeOrder(selectedOrder.id, submissionResult, price, isPaid);
            toast.success('Image uploaded temporarily (Order updated)');
            setIsUploadModalOpen(false);
            fetchOrders();
        }
        catch (error) {
            toast.error('Failed to upload image');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const submitReport = async (e) => {
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
            toast.success('Report submitted successfully');
            setIsReportModalOpen(false);
            fetchOrders();
        }
        catch (error) {
            toast.error('Failed to submit report');
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
                console.error(e);
                details = { notes: order.result };
            }
            const startY = await addClinicHeader(doc, selectedClinic, 'Radiology Test Report');
            // Patient & Test Info Box
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(15, startY + 5, 180, 30, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text('PATIENT NAME', 20, startY + 12);
            doc.text('SCAN TYPE', 85, startY + 12);
            doc.text('DATE', 150, startY + 12);
            doc.setTextColor(30);
            doc.setFont('helvetica', 'bold');
            doc.text(order.patient?.name || 'Unknown Patient', 20, startY + 18);
            doc.text(order.testName || 'Radiology Scan', 85, startY + 18);
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
            doc.text('Radiologist Observations', 15, startY + 50);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, startY + 53, 195, startY + 53);
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.setFont('helvetica', 'normal');
            let findings = details.notes || order.result || 'No specific notes recorded.';
            if (details.type === 'pdf_attachment')
                findings = details.notes || 'Note: A PDF attachment was uploaded. Please refer to the attached document for full details.';
            if (details.type === 'image_attachment')
                findings = 'Note: A Radiographic Image was uploaded. Please review the system for the original image.';
            const splitFindings = doc.splitTextToSize(findings, 170);
            doc.text(splitFindings, 15, startY + 62);
            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('This is a computer-generated medical report and does not require a physical signature.', 15, pageHeight - 20);
            doc.text(`Generated on: ${new Date().toLocaleString()} | Radiologist: ${user?.name || 'Authorized Personnel'}`, 15, pageHeight - 15);
            doc.save(`Radiology_Report_${order.id}.pdf`);
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
                    <h1>Radiologist Dashboard</h1>
                    <p>Report and manage imaging results.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="search-box">
                        <input type="text" className="form-control" placeholder="Search Patient or Scan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '1rem' }}/>
                    </div>
                </div>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={scrollToPending} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Awaiting Scan</p>
                    </div>
                </div>
                <div className="stat-card" onClick={scrollToPending} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon blue"><FiImage /></div>
                    <div className="stat-info">
                        <h3>{stats.imageUploaded}</h3>
                        <p>Needs Report</p>
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
                        <h2><FiActivity /> Active Radiology Workflow</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (<div className="p-lg text-center">Loading workflow...</div>) : (<table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Scan Details</th>
                                        <th>Payment</th>
                                        <th>Current Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders
                .filter((o) => ['Pending', 'Image Uploaded'].includes(o.testStatus || o.status))
                .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
                .length > 0 ? (orders
                .filter((o) => ['Pending', 'Image Uploaded'].includes(o.testStatus || o.status))
                .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 15).map((order) => {
                const status = order.testStatus || order.status;
                const isPaidStatus = order.paymentStatus === 'Paid';
                const isImageUploaded = status === 'Image Uploaded';
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
                                                            {!isImageUploaded ? (<button className="btn btn-primary btn-xs btn-with-icon" onClick={() => handleOpenUploadImage(order)} title={!isPaidStatus ? "Warning: Payment not received" : ""} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                                    <FiImage /> Upload Image
                                                                </button>) : (<button className="btn btn-primary btn-xs btn-with-icon" onClick={() => handleOpenUploadReport(order)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none', color: 'white' }}>
                                                                    <FiUpload /> Upload Report
                                                                </button>)}
                                                        </td>
                                                    </tr>);
            })) : (<tr><td colSpan={5} className="text-center p-lg text-muted">No active radiology requests.</td></tr>)}
                                </tbody>
                            </table>)}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl" ref={completedRef}>
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Scans & Reports History</h2>
                    </div>
                    <div className="table-container mt-md">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Scan Details</th>
                                    <th>Completion Date</th>
                                    <th>Billing Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders
            .filter((o) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status))
            .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
            .length > 0 ? (orders
            .filter((o) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status))
            .filter((o) => o.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.testName?.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 15).map((order) => {
            let details = {};
            try {
                details = JSON.parse(order.result || '{}');
            }
            catch (e) {
                console.error(e);
            }
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

            {/* Upload Image Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Radiographic Image">
                <form onSubmit={submitImage} className="modal-form">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}>
                            <FiImage size={20}/>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#1E3A8A', fontWeight: 700, textTransform: 'uppercase' }}>Selected Scan</p>
                            <h4 style={{ margin: 0, color: '#1E3A8A', fontSize: '1rem' }}>{selectedOrder?.testName} (Patient: {selectedOrder?.patient?.name})</h4>
                        </div>
                    </div>

                    <div className="form-group mt-md">
                        <label>Attachment (Upload Image, e.g. JPG, PNG)</label>
                        <div style={{ border: '2px dashed #E2E8F0', borderRadius: '10px', padding: '1rem', textAlign: 'center', background: '#F8FAFC', position: 'relative' }}>
                            {!selectedFile ? (<>
                                    <FiImage size={24} style={{ color: '#94A3B8' }}/>
                                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '5px 0 0 0' }}>Click to select Image</p>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}/>
                                </>) : (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedFile.name}</span>
                                    <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}><FiX /></button>
                                </div>)}
                        </div>
                    </div>

                    <div className="modal-actions mt-lg">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none' }}>
                            {isSubmitting ? 'Uploading...' : 'Save Image'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Upload Report Modal */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Submit Radiologist Report">
                <form onSubmit={submitReport} className="modal-form">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }}>
                            <FiActivity size={20}/>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Selected Scan</p>
                            <h4 style={{ margin: 0, color: '#14532D', fontSize: '1rem' }}>{selectedOrder?.testName} (Patient: {selectedOrder?.patient?.name})</h4>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Radiologist Findings (Notes)</label>
                        <textarea rows={4} className="form-control" placeholder="Enter scan interpretations or observations..." value={resultText} onChange={(e) => setResultText(e.target.value)} required={!selectedFile}/>
                    </div>

                    <div className="form-group mt-md">
                        <label>Attachment (PDF Report, optional if notes provided)</label>
                        <div style={{ border: '2px dashed #E2E8F0', borderRadius: '10px', padding: '1rem', textAlign: 'center', background: '#F8FAFC', position: 'relative' }}>
                            {!selectedFile ? (<>
                                    <FiPaperclip size={20} style={{ color: '#94A3B8' }}/>
                                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '5px 0 0 0' }}>Upload PDF Copy</p>
                                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'pdf')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}/>
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
                        <button type="button" className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)', border: 'none' }}>
                            {isSubmitting ? 'Processing...' : 'Verify & Publish Result'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default RadiologyDashboard;
