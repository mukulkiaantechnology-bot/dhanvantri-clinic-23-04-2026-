import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { FiCalendar, FiClock, FiUser, FiSearch, FiFilter, FiCheckCircle, FiClock as FiPending, FiXCircle, FiInfo } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import './PatientBooking.css';
const AppointmentStatus = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const toast = useToast();
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await patientService.getMyAppointments();
            setBookings(res.data?.data || res.data || []);
        }
        catch (error) {
            console.error('Failed to fetch bookings', error);
            toast.error('Failed to load appointments');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);
    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?'))
            return;
        try {
            await patientService.cancelAppointment(id);
            toast.success('Appointment cancelled successfully');
            fetchBookings(); // Refresh list
        }
        catch (error) {
            toast.error('Failed to cancel appointment');
        }
    };
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'status-approved';
            case 'approved': return 'status-approved';
            case 'pending':
            case 'pending approval': return 'status-pending';
            case 'rejected':
            case 'cancelled': return 'status-rejected';
            case 'rescheduled': return 'status-rescheduled';
            default: return 'status-default';
        }
    };
    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return <FiCheckCircle />;
            case 'approved': return <FiCheckCircle />;
            case 'pending':
            case 'pending approval': return <FiPending />;
            case 'rejected':
            case 'cancelled': return <FiXCircle />;
            default: return <FiCalendar />;
        }
    };
    const filteredBookings = bookings.filter(b => {
        const matchesSearch = (b.clinic?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.service || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });
    const stats = {
        total: bookings.length,
        approved: bookings.filter(b => ['Approved', 'Confirmed'].includes(b.status)).length,
        pending: bookings.filter(b => b.status === 'Pending' || b.status === 'Pending Approval').length
    };
    if (loading) {
        return (<div className="p-20 text-center flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-modern mb-md"></div>
                <p className="text-muted">Loading your appointments...</p>
            </div>);
    }
    return (<div className="p-2 fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>My Appointments</h1>
                        <p>Keep track of your clinical visits and upcoming appointments.</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary Section */}
            <div className="appointment-stats-container mb-xl">
                <div className="stat-card-modern">
                    <div className="stat-icon-wrap blue">
                        <FiCalendar />
                    </div>
                    <div className="stat-data">
                        <span className="label">Total Bookings</span>
                        <div className="value">{stats.total}</div>
                    </div>
                </div>
                <div className="stat-card-modern">
                    <div className="stat-icon-wrap green">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-data">
                        <span className="label">Confirmed</span>
                        <div className="value">{stats.approved}</div>
                    </div>
                </div>
                <div className="stat-card-modern">
                    <div className="stat-icon-wrap yellow">
                        <FiClock />
                    </div>
                    <div className="stat-data">
                        <span className="label">Pending</span>
                        <div className="value">{stats.pending}</div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="appointment-controls no-print mb-lg">
                <div className="search-wrap">
                    <FiSearch />
                    <input type="text" placeholder="Search clinic, doctor or service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </div>
                <div className="filter-wrap">
                    <FiFilter />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {filteredBookings.length === 0 ? (<div className="empty-state-v2">
                    <div className="empty-icon">
                        <FiCalendar />
                    </div>
                    <h3>No appointments found</h3>
                    <p>Try adjusting your filters or book a new appointment to get started.</p>
                </div>) : (<div className="appointments-grid-v2">
                    {filteredBookings.map((booking) => (<div key={booking.id} className={`appointment-card-v2 ${getStatusClass(booking.status)}`}>
                            <div className="card-top">
                                <div className="doctor-info-mini">
                                    <div className="avatar-letter">
                                        {(booking.doctor?.name || 'D').charAt(0)}
                                    </div>
                                    <div>
                                        <h4>{booking.service || 'Medical Consultation'}</h4>
                                        <p>{booking.clinic?.name || 'EV Clinic'}</p>
                                    </div>
                                </div>
                                <div className={`status-pill-v2 ${getStatusClass(booking.status)}`}>
                                    {getStatusIcon(booking.status)}
                                    <span>{booking.status}</span>
                                </div>
                            </div>

                            <div className="card-middle">
                                <div className="schedule-info">
                                    <div className="info-bit">
                                        <FiCalendar />
                                        <span>{new Date(booking.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="info-bit">
                                        <FiClock />
                                        <span>{booking.time}</span>
                                    </div>
                                </div>
                                {booking.doctor?.name && (<div className="attending-info">
                                        <FiUser />
                                        <span>Dr. {booking.doctor.name}</span>
                                    </div>)}
                            </div>

                            <div className="card-bottom">
                                <div className="ref-tag">
                                    Ref: {booking.referenceId || `EV-${booking.id.toString().padStart(5, '0')}`}
                                </div>
                                {['Approved', 'Confirmed'].includes(booking.status) ? (<button className="btn btn-primary btn-sm" style={{
                        background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }} onClick={() => toast.info('Detailed view coming soon!')}>
                                        <FiInfo /> Details
                                    </button>) : (booking.status !== 'Cancelled' && (<button className="btn btn-sm btn-link-danger" onClick={() => handleCancel(booking.id)}>
                                            Cancel
                                        </button>))}
                            </div>
                        </div>))}
                </div>)}
        </div>);
};
export default AppointmentStatus;
