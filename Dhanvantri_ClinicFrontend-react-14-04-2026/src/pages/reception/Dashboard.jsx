import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { receptionService } from '../../services/reception.service';
import { FiUsers, FiCalendar, FiActivity, FiClock, FiCheck, FiPlus, FiUserPlus, FiCreditCard, FiX, FiMonitor, FiCheckCircle } from 'react-icons/fi';
import Modal from '../../components/Modal';
import './Dashboard.css';
const ReceptionDashboard = () => {
    const navigate = useNavigate();
    const { bookings, patients, staff, addBooking, addPatient, approveBooking, rejectBooking, updateBookingStatus, refreshData, refreshTrigger } = useApp();
    const { selectedClinic } = useAuth();
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
    const [activities, setActivities] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const fetchDashboardStats = async () => {
        try {
            const activitiesRes = await receptionService.getActivities();
            setActivities(activitiesRes?.data ?? activitiesRes ?? []);
        }
        catch (error) {
            console.error('Failed to fetch reception dashboard data:', error);
        }
    };
    useEffect(() => {
        fetchDashboardStats();
    }, [refreshTrigger]);
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refreshData(),
                fetchDashboardStats()
            ]);
        }
        finally {
            setIsRefreshing(false);
        }
    };
    // Strict Data Isolation - Filter by active clinic
    const clinicBookings = bookings.filter(b => Number(b.clinicId) === Number(selectedClinic?.id));
    const clinicStaff = staff.filter((s) => (Number(s.clinicId) === Number(selectedClinic?.id) || (s.clinics || []).includes(selectedClinic?.id)) &&
        s.status === 'active');
    // Filter appointments for today
    const today = new Date().toISOString().split('T')[0];
    const todaysBookings = clinicBookings.filter((b) => {
        const bookingDate = new Date(b.date).toISOString().split('T')[0];
        return bookingDate === today;
    });
    // Also get recent pending requests (even if not for today)
    const pendingRequests = clinicBookings
        .filter((b) => b.status?.toLowerCase() === 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Calculate Active Queue (Confirmed & Checked-In patients today)
    const activeQueue = todaysBookings.filter((b) => {
        // Normalize status: lowercase and replace hyphens with spaces to match 'checked-in' with 'checked in'
        const s = (b.queueStatus || b.status || '').toLowerCase().replace(/-/g, ' ').trim();
        // Include all active pre-consultation and in-consultation statuses
        return ['confirmed', 'approved', 'checked in', 'in progress', 'scheduled', 'waiting'].includes(s);
    }).length;
    const stats = [
        { label: "Today's Appointments", value: todaysBookings.length, icon: <FiCalendar />, color: '#2D3BAE', path: '/reception/bookings' },
        { label: 'Total Patients', value: patients?.length || 0, icon: <FiUsers />, color: '#10B981', path: '/reception/patients' },
        { label: 'Pending Approvals', value: pendingRequests.length, icon: <FiActivity />, color: '#F59E0B', path: '/reception/bookings?status=pending' },
        { label: 'Token Queue', value: activeQueue, icon: <FiCheck />, color: '#7C3AED', path: '/reception/token-queue' },
    ];
    // Filter patients by active clinic
    const clinicPatients = (patients || []).filter((p) => Number(p.clinicId) === Number(selectedClinic?.id));
    const handleScheduleAppointment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patientId = formData.get('patientId');
        if (!patientId) {
            alert('Please select a patient');
            return;
        }
        await addBooking({
            patientId: Number(patientId),
            doctorId: Number(formData.get('doctorId')),
            date: formData.get('date'),
            time: formData.get('time'),
            service: formData.get('service'),
            notes: formData.get('notes'),
            status: 'Confirmed',
            source: 'Reception'
        });
        setIsAppointmentModalOpen(false);
        e.target.reset();
    };
    const handleWalkin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const patient = await addPatient({
                name: formData.get('name'),
                phone: `${formData.get('phoneCode')} ${formData.get('phoneNumber')}`,
                medicalHistory: formData.get('medicalHistory')
            });
            await addBooking({
                patientId: patient.id,
                doctorId: Number(formData.get('doctorId')),
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                service: 'Walk-in',
                status: 'Confirmed',
                source: 'Walk-in'
            });
            alert('Walk-in patient registered successfully!');
            setIsWalkinModalOpen(false);
        }
        catch (error) {
            console.error(error);
            alert('Failed to register walk-in.');
        }
    };
    return (<div className="reception-dashboard">
            <div className="dashboard-welcome">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {selectedClinic?.logo && (<div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid #E2E8F0', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={selectedClinic?.logo ? (selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${selectedClinic.logo}`) : "/sidebar-logo.jpg"} alt="Clinic Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}/>
                        </div>)}
                    <div>
                        <h1>{selectedClinic?.name || 'Reception Dashboard'}</h1>
                        <p>Manage appointments, patient check-ins, and daily operations</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button className={`btn btn-secondary ${isRefreshing ? 'loading' : ''}`} onClick={handleManualRefresh} style={{ minWidth: '120px' }}>
                        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    <button className="btn btn-secondary btn-with-icon" onClick={() => setIsWalkinModalOpen(true)}>
                        <FiPlus /> <span>Walk-in</span>
                    </button>
                    <button className="btn-new-appointment-static" onClick={() => setIsAppointmentModalOpen(true)}>
                        <FiPlus /> <span>New Appointment</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                {stats.map((stat, index) => (<div key={index} className={`stat-card fade-in-up ${index === 1 ? 'primary-border' : ''}`} style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }} onClick={() => navigate(stat.path)}>
                        <div className="stat-icon-square" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                        <p className="stat-label">{stat.label}</p>
                        <h3 className="stat-value">{stat.value}</h3>
                    </div>))}
            </div>

            <div className="dashboard-sections grid-2 mt-lg">
                <div className="section-card card">
                    <div className="section-header-centered">
                        <h3>Today's Schedule</h3>
                        <button className="text-link-blue" onClick={() => navigate('/reception/bookings')}>View All &rarr;</button>
                    </div>
                    <div className="schedule-list mt-md">
                        {todaysBookings.length === 0 ? (<p className="empty-msg">No appointments scheduled for today.</p>) : (todaysBookings.slice(0, 10).map((booking) => {
            const isPendingPayment = (booking.queueStatus || booking.status || '').toLowerCase().replace('-', ' ') === 'pending payment';
            return (<div key={booking.id} className={`schedule-row ${booking.queueStatus === 'Pending' ? 'row-pending' : ''} ${isPendingPayment ? 'row-clickable-payment' : ''}`} onClick={() => {
                    if (isPendingPayment && booking.patientId) {
                        navigate(`/reception/billing?focusedPatientId=${booking.patientId}`);
                    }
                }} style={isPendingPayment ? { cursor: 'pointer' } : {}}>
                                        <div className="schedule-token" style={{ minWidth: '40px', fontWeight: 'bold', color: '#3F46B8' }}>
                                            #{booking.tokenNumber || '---'}
                                        </div>

                                        <div className="schedule-time">
                                            <FiClock /> {booking.time}
                                        </div>
                                        <div className="schedule-patient">
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{booking.patient?.name || 'Unknown Patient'}</div>
                                            <div className="info-subtext" style={{ fontSize: '0.75rem' }}>
                                                {booking.patient?.phone || ''}
                                            </div>
                                        </div>
                                        <div className={`status-pill-mini ${booking.queueStatus?.toLowerCase() || booking.status.toLowerCase().replace(' ', '-')}`}>
                                            {booking.queueStatus || booking.status}
                                        </div>
                                        <div className="schedule-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                            {(booking.queueStatus === 'Pending' || booking.status === 'Pending') && (<>
                                                    <button className="btn-icon-circle success" onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'Confirmed'); }} title="Confirm">
                                                        <FiCheck />
                                                    </button>
                                                </>)}
                                            {(booking.queueStatus === 'Pending' || booking.status === 'Confirmed' || booking.status === 'Approved' || (booking.status === 'Pending' && booking.source === 'Reception')) && (<button className="btn-primary-mini" onClick={async (e) => {
                        e.stopPropagation();
                        try {
                            await receptionService.checkIn(booking.id);
                            alert(`Checked-in: ${booking.patient?.name}`);
                            refreshData();
                        }
                        catch (err) {
                            console.error(err);
                            alert('Check-in failed.');
                        }
                    }} title="Check In" style={{
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                        color: 'white',
                        border: 'none',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                                                    <FiCheckCircle size={14}/> CHECK IN
                                                </button>)}
                                        </div>
                                    </div>);
        }))}
                    </div>
                </div>

                <div className="section-card card">
                    <div className="section-header-centered">
                        <h3>
                            Pending Requests
                            {pendingRequests.length > 0 && <span className="badge-pill-inline">{pendingRequests.length}</span>}
                        </h3>
                        <button className="text-link-blue" onClick={() => navigate('/reception/bookings?status=pending')}>View All &rarr;</button>
                    </div>
                    <div className="schedule-list mt-md">
                        {pendingRequests.length === 0 ? (<p className="empty-msg">No pending appointment requests.</p>) : (pendingRequests.slice(0, 5).map((booking) => (<div key={booking.id} className="schedule-row highlight-pending">
                                    <div className="schedule-time">
                                        {new Date(booking.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="schedule-patient" style={{ minWidth: '150px' }}>
                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{booking.patient?.name || 'New Patient'}</div>
                                        <div className="info-subtext" style={{ fontSize: '0.75rem' }}>
                                            {booking.patient?.phone || 'No Phone'}
                                        </div>
                                    </div>
                                    <div className="schedule-time">
                                        <FiClock /> {booking.time}
                                    </div>
                                    <div className="info-subtext" style={{ fontSize: '0.75rem' }}>
                                        {booking.source || 'Portal'}
                                    </div>
                                    <div className="schedule-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                        <button className="btn-icon-circle success" onClick={() => approveBooking(booking.id)} title="Approve">
                                            <FiCheck />
                                        </button>
                                        <button className="btn-icon-circle danger" onClick={() => rejectBooking(booking.id)} title="Reject">
                                            <FiX />
                                        </button>
                                    </div>
                                </div>)))}
                    </div>
                </div>

                <div className="section-card card">
                    <div className="section-header-centered">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="activities-list mt-md">
                        {activities.length === 0 ? (<p className="empty-msg">No recent activity found.</p>) : (activities.map((activity) => (<div key={activity.id} className="activity-row-simple">
                                    <div className="activity-info">
                                        <p><strong>{activity.action}</strong></p>
                                        <span>{new Date(activity.time || activity.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`status-tag-mini ${(activity.status || 'info').toLowerCase()}`}>
                                        {activity.status || 'Info'}
                                    </div>
                                </div>)))}
                    </div>
                </div>

                <div className="section-card card">
                    <div className="section-header-centered">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="quick-actions-list mt-md">
                        <div className="action-row-block" onClick={() => setIsAppointmentModalOpen(true)}>
                            <div className="action-icon-dark"><FiCalendar /></div>
                            <div className="action-text">
                                <strong>Schedule Appointment</strong>
                                <span>Book new patient appointment</span>
                            </div>
                        </div>
                        <div className="action-row-block" onClick={() => navigate('/reception/patients')}>
                            <div className="action-icon-dark"><FiUserPlus /></div>
                            <div className="action-text">
                                <strong>Register Patient</strong>
                                <span>Add new patient to system</span>
                            </div>
                        </div>
                        <div className="action-row-block" onClick={() => setIsWalkinModalOpen(true)}>
                            <div className="action-icon-dark"><FiUsers /></div>
                            <div className="action-text">
                                <strong>Walk-in Patient</strong>
                                <span>Quick registration for walk-ins</span>
                            </div>
                        </div>
                        <div className="action-row-block" onClick={() => window.open(`/tokens/${selectedClinic?.subdomain || selectedClinic?.id}`, '_blank')}>
                            <div className="action-icon-dark"><FiMonitor /></div>
                            <div className="action-text">
                                <strong>Open Queue Display</strong>
                                <span>Launch TV waiting screen</span>
                            </div>
                        </div>
                        {(() => {
            const mods = typeof selectedClinic?.modules === 'string'
                ? (() => { try {
                    return JSON.parse(selectedClinic.modules);
                }
                catch {
                    return null;
                } })()
                : selectedClinic?.modules;
            return mods?.billing && (<div className="action-row-block" onClick={() => navigate('/reception/billing')}>
                                    <div className="action-icon-dark"><FiCreditCard /></div>
                                    <div className="action-text">
                                        <strong>Process Billing</strong>
                                        <span>Create invoice and payments</span>
                                    </div>
                                </div>);
        })()}
                    </div>
                </div>
            </div>

            {/* Schedule Appointment Modal */}
            <Modal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} title="Schedule Appointment">
                <form className="modal-form" onSubmit={handleScheduleAppointment}>
                    <div className="form-group">
                        <label>Patient *</label>
                        <select name="patientId" required className="form-control" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
                            <option value="">Select Patient</option>
                            {clinicPatients.map((p) => (<option key={p.id} value={p.id}>{p.id.toString().padStart(3, '0')}-{p.name}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Doctor *</label>
                        <select name="doctorId" required>
                            <option value="">Select Provider</option>
                            {clinicStaff.filter((s) => {
            const roles = (s.roles || [s.role]).map((r) => r.toUpperCase());
            return roles.includes('DOCTOR');
        }).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Date *</label>
                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required/>
                        </div>
                        <div className="form-group">
                            <label>Time *</label>
                            <select name="time" required>
                                <option value="09:00 AM">09:00 AM</option>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="11:00 AM">11:00 AM</option>
                                <option value="12:00 PM">12:00 PM</option>
                                <option value="01:00 PM">01:00 PM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="03:00 PM">03:00 PM</option>
                                <option value="04:00 PM">04:00 PM</option>
                                <option value="05:00 PM">05:00 PM</option>
                                <option value="06:00 PM">06:00 PM</option>
                                <option value="07:00 PM">07:00 PM</option>
                                <option value="08:00 PM">08:00 PM</option>
                                <option value="09:00 PM">09:00 PM</option>
                                <option value="10:00 PM">10:00 PM</option>
                                <option value="11:00 PM">11:00 PM</option>
                                <option value="12:00 AM">12:00 AM</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Service *</label>
                        <select name="service" required>
                            <option value="Consultation">Consultation</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea name="notes" placeholder="Additional notes..."></textarea>
                    </div>
                    <div className="modal-actions-refined">
                        <button type="button" className="btn-cancel" onClick={() => setIsAppointmentModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save">
                            <FiCheck /> Schedule
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Walk-in Modal */}
            <Modal isOpen={isWalkinModalOpen} onClose={() => setIsWalkinModalOpen(false)} title="Walk-in Patient">
                <form className="modal-form" onSubmit={handleWalkin}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input name="name" type="text" required/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>Code *</label>
                            <select name="phoneCode" defaultValue="+971" style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }} required>
                                <option value="+971">+971 (UAE)</option>
                                <option value="+966">+966 (KSA)</option>
                                <option value="+968">+968 (Oman)</option>
                                <option value="+974">+974 (Qatar)</option>
                                <option value="+965">+965 (Kuwait)</option>
                                <option value="+973">+973 (Bahrain)</option>
                                <option value="+91">+91 (India)</option>
                                <option value="+44">+44 (UK)</option>
                                <option value="+1">+1 (USA)</option>
                                <option value="+20">+20 (Egypt)</option>
                                <option value="+92">+92 (Pakistan)</option>
                                <option value="+63">+63 (Philippines)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Mobile Number *</label>
                            <input name="phoneNumber" type="text" required/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Doctor *</label>
                        <select name="doctorId" required>
                            <option value="">Select Provider</option>
                            {clinicStaff.filter((s) => {
            const roles = (s.roles || [s.role]).map((r) => r.toUpperCase());
            return roles.includes('DOCTOR');
        }).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <textarea name="medicalHistory" rows={3}></textarea>
                    </div>
                    <div className="modal-actions-refined">
                        <button type="button" className="btn-cancel" onClick={() => setIsWalkinModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save">Register</button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default ReceptionDashboard;
