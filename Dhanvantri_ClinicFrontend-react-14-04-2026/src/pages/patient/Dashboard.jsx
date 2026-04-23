import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { useCurrency } from '../../context/CurrencyContext';
import { FiCalendar, FiActivity, FiDollarSign, FiSettings, FiClock, FiCheckCircle, FiFileText, FiFile } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../SharedDashboard.css';
const PatientDashboard = () => {
    const navigate = useNavigate();
    const { user, selectedClinic } = useAuth();
    const { formatMoney } = useCurrency();
    const [bookings, setBookings] = useState([]);
    const [recordsCount, setRecordsCount] = useState(0);
    const [invoices, setInvoices] = useState([]);
    const [documentsCount, setDocumentsCount] = useState(0);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookingsRes, recordsRes, invoicesRes, activityRes, docRes, reportRes] = await Promise.all([
                    patientService.getMyAppointments(),
                    patientService.getMyMedicalRecords(),
                    patientService.getMyInvoices(),
                    patientService.getMyActivity(),
                    patientService.getMyDocuments(),
                    patientService.getMyReports()
                ]);
                const bookingsData = bookingsRes.data?.data || bookingsRes.data || [];
                const recordsData = recordsRes.data?.data || recordsRes.data || { assessments: [], serviceOrders: [], prescriptions: [], medical_reports: [], documents: [] };
                const docsData = docRes.data?.data || docRes.data || [];
                const reportsData = reportRes.data?.data || reportRes.data || [];
                setBookings(bookingsData);
                // Merge reports from both sources if necessary, though they should be largely redundant
                const allReports = [...(recordsData.medical_reports || [])];
                reportsData.forEach((r) => {
                    if (!allReports.find(ar => ar.id === r.id)) {
                        allReports.push(r);
                    }
                });
                setRecordsCount((recordsData.assessments?.length || 0) +
                    (recordsData.serviceOrders?.length || 0) +
                    (recordsData.prescriptions?.length || 0) +
                    (recordsData.documents?.length || 0) +
                    (allReports.length || 0));
                setInvoices(invoicesRes.data?.data || invoicesRes.data || []);
                setActivities(activityRes.data?.data || activityRes.data || []);
                setDocumentsCount((docsData.length || 0) + (recordsData.documents?.length || 0));
            }
            catch (error) {
                console.error('Failed to fetch patient data', error);
            }
            finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchData();
        }
    }, [user]);
    if (loading) {
        return <div className="p-20 text-center">Loading dashboard...</div>;
    }
    const upcomingAppointments = bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').slice(0, 3);
    return (<div className="p-6 fade-in" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div className="page-header" style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="patient-welcome-avatar" style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                        {user?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Welcome back, {user?.name || 'Patient'}!</h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>{selectedClinic?.name ? `You are connected with ${selectedClinic.name}` : 'Manage your health journey with ease.'}</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={() => navigate('/patient/book')} className="btn btn-primary" style={{
            background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(45, 59, 174, 0.2)'
        }}>
                        <FiCalendar style={{ marginRight: '8px' }}/> Book Appointment
                    </button>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card clickable hover-lift" onClick={() => navigate('/patient/status')} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                    <div className="stat-icon-v2" style={{ background: '#eff6ff', color: '#3b82f6', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}><FiCalendar /></div>
                    <div className="stat-info">
                        <small style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>Appointments</small>
                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{bookings.length}</h3>
                    </div>
                </div>

                <div className="stat-card clickable hover-lift" onClick={() => navigate('/patient/reports')} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                    <div className="stat-icon-v2" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}><FiActivity /></div>
                    <div className="stat-info">
                        <small style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>Medical Records</small>
                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{recordsCount}</h3>
                    </div>
                </div>

                <div className="stat-card clickable hover-lift" onClick={() => navigate('/patient/documents')} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                    <div className="stat-icon-v2" style={{ background: '#f0fdf4', color: '#10b981', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}><FiFile /></div>
                    <div className="stat-info">
                        <small style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>Documents</small>
                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{documentsCount}</h3>
                    </div>
                </div>

                <div className="stat-card clickable hover-lift" onClick={() => navigate('/patient/billing')} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                    <div className="stat-icon-v2" style={{ background: '#fff1f2', color: '#e11d48', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}><FiDollarSign /></div>
                    <div className="stat-info">
                        <small style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>Bills & Payments</small>
                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{invoices.length}</h3>
                    </div>
                </div>

                <div className="stat-card clickable hover-lift" onClick={() => navigate('/patient/settings')} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                    <div className="stat-icon-v2" style={{ background: '#f8fafc', color: '#475569', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}><FiSettings /></div>
                    <div className="stat-info">
                        <small style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>Personal Profile</small>
                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Settings</h3>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections mt-lg" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Unified Recent Activity Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="content-card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Recent Activity Timeline</h2>
                            <button className="btn btn-link" onClick={() => navigate('/patient/reports')}>View All Records</button>
                        </div>
                        <div className="activity-timeline-container" style={{ padding: '1rem 0' }}>
                            {activities.length > 0 ? (<div className="timeline">
                                    {activities.map((act, idx) => (<div key={idx} className="timeline-item" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                                            <div className="timeline-icon" style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: act.type === 'APPOINTMENT' ? '#3B82F6' :
                        act.type === 'RECORD' ? '#8B5CF6' :
                            act.type === 'REPORT' ? '#10B981' :
                                act.type === 'DOCUMENT' ? '#F59E0B' : '#EF4444'
                }}>
                                                {act.type === 'APPOINTMENT' ? <FiCalendar /> :
                    act.type === 'RECORD' || act.type === 'REPORT' ? <FiActivity /> :
                        act.type === 'DOCUMENT' ? <FiFileText /> : <FiDollarSign />}
                                            </div>
                                            <div className="timeline-content">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{act.title}</h4>
                                                    <small style={{ color: '#64748b' }}>{new Date(act.date || act.createdAt || Date.now()).toLocaleDateString()}</small>
                                                </div>
                                                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}>{act.description}</p>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Clinic: {act.clinic}</div>
                                            </div>
                                        </div>))}
                                </div>) : (<div className="text-center p-lg text-muted">No recent activity found.</div>)}
                        </div>
                    </div>

                    <div className="content-card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Quick Billing Overview</h2>
                            <button className="btn btn-link" onClick={() => navigate('/patient/billing')}>View Details</button>
                        </div>
                        <div className="table-responsive" style={{ padding: '0.5rem 0' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Bill #</th>
                                        <th>Service</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length > 0 ? invoices.slice(0, 3).map((inv) => (<tr key={inv.id}>
                                            <td style={{ fontWeight: 700 }}>#{inv.id.toString().padStart(4, '0')}</td>
                                            <td>{inv.service || 'Appointment'}</td>
                                            <td>{formatMoney(Number(inv.totalAmount || inv.amount || 0))}</td>
                                            <td>
                                                <span className={`status-pill ${inv.status.toLowerCase()}`}>{inv.status}</span>
                                            </td>
                                        </tr>)) : (<tr>
                                            <td colSpan={4} className="text-center p-md text-muted">No recent invoices.</td>
                                        </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column: Upcoming & Quick Actions */}
                <div className="sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="content-card">
                        <div className="card-header">
                            <h2>Upcoming</h2>
                        </div>
                        <div className="upcoming-list">
                            {upcomingAppointments.length > 0 ? upcomingAppointments.map((app, idx) => (<div key={idx} style={{
                padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '8px', marginBottom: '0.75rem',
                background: '#f8fafc'
            }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <FiClock style={{ color: '#3b82f6' }}/>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(app.date).toLocaleDateString()}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>at {app.time}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{app.service}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Status: {app.status}</div>
                                </div>)) : (<div className="text-center p-md text-sm text-muted">No upcoming appointments.</div>)}
                            <button className="btn btn-outline w-full mt-sm" onClick={() => navigate('/patient/book')}>
                                Find Doctors
                            </button>
                        </div>
                    </div>

                    <div className="content-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none' }}>
                        <div className="card-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiCheckCircle /> Health Summary
                            </h2>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '0.95rem', opacity: 0.9 }}>Total Consultations</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{recordsCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '0.95rem', opacity: 0.9 }}>Recent Payment</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{invoices[0] ? formatMoney(invoices[0].amount) : 'N/A'}</span>
                            </div>
                            <div style={{
            marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
                                <FiCheckCircle style={{ color: '#10B981' }}/> Correctly synced with EV Platform.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>);
};
export default PatientDashboard;
