import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiCalendar, FiClock, FiCheck, FiX, FiCheckCircle } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';
const Bookings = () => {
    const { bookings, patients, staff, approveBooking, rejectBooking, updateBookingStatus } = useApp();
    const { selectedClinic } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchParams] = useSearchParams();
    // Filter bookings by clinic (using Number to avoid ID mismatch)
    let clinicBookings = bookings.filter((b) => Number(b.clinicId) === Number(selectedClinic?.id));
    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam) {
            setStatusFilter(statusParam);
        }
    }, [searchParams]);
    // Apply search filter
    if (searchTerm) {
        clinicBookings = clinicBookings.filter((booking) => {
            const patient = booking.patient || patients.find((p) => p.id === parseInt(booking.patientId)) || { name: 'Unknown' };
            const provider = booking.doctor || { name: 'Unassigned' };
            const searchLower = searchTerm.toLowerCase();
            return (patient.name?.toLowerCase().includes(searchLower) ||
                provider.name?.toLowerCase().includes(searchLower) ||
                booking.time?.toLowerCase().includes(searchLower));
        });
    }
    // Apply status filter
    if (statusFilter !== 'all') {
        clinicBookings = clinicBookings.filter((booking) => booking.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    // Sort by date (most recent first)
    clinicBookings = clinicBookings.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt).getTime();
        const dateB = new Date(b.date || b.createdAt).getTime();
        return dateB - dateA;
    });
    const clinicStaff = staff.filter((s) => s.clinicId === selectedClinic?.id || (s.clinics || []).includes(selectedClinic?.id));
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (<div className="reception-dashboard">
            <div className="page-header">
                <div>
                    <h1>Appointment Management</h1>
                    <p>View and manage all scheduled visits for this facility.</p>
                </div>
            </div>

            <div className="section-card card mt-lg">
                <div className="section-header" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-box" style={{ flex: '1', minWidth: '250px' }}>
                        <FiSearch />
                        <input type="text" placeholder="Search by patient or provider..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.875rem', color: '#64748b' }}>Status:</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.875rem'
        }}>
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked in">Checked In</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="table-container mt-md">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Provider</th>
                                <th>Date/Time</th>
                                <th>Service & Notes</th>
                                <th>Status</th>
                                <th>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinicBookings.length > 0 ? clinicBookings.map((booking) => {
            // Prioritize patient data from booking.patient relation
            const patient = booking.patient || (patients || []).find((p) => p.id === parseInt(booking.patientId)) || { name: 'Unknown', phone: null };
            // Prioritize doctor data from booking.doctor relation (enriched by backend)
            const provider = booking.doctor || (clinicStaff || []).find((s) => s.id === parseInt(booking.doctorId)) || { name: 'Unassigned' };
            return (<tr key={booking.id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{patient.name || 'Unknown'}</div>
                                            <div className="info-subtext" style={{ fontSize: '0.8rem' }}>
                                                {patient.phone || 'No phone'}
                                                {patient.email ? ` • ${patient.email}` : ''}
                                            </div>
                                        </td>
                                        <td>{provider.name || 'Unassigned'}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <FiCalendar size={12} className="mr-xs"/> {formatDate(booking.date || booking.createdAt)}
                                                <FiClock size={12} className="ml-md mr-xs"/> {booking.time || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600', color: '#3F46B8' }}>{booking.service || 'General Visit'}</div>
                                            {booking.notes && (<div className="info-subtext" style={{
                        fontSize: '0.75rem',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#64748b'
                    }} title={booking.notes}>
                                                    "{booking.notes}"
                                                </div>)}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${booking.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column gap-xs">
                                                {booking.status === 'Pending' && (<div className="action-btns mb-xs">
                                                        <button className="btn-icon-sm success-btn" onClick={async () => {
                        try {
                            await approveBooking(booking.id);
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }} title="Approve">
                                                            <FiCheck />
                                                        </button>
                                                        <button className="btn-icon-sm danger-btn" onClick={async () => {
                        try {
                            await rejectBooking(booking.id);
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }} title="Reject">
                                                            <FiX />
                                                        </button>
                                                    </div>)}
                                                {(booking.status === 'Confirmed' || booking.status === 'Approved' || (booking.status === 'Pending' && booking.source === 'Reception')) && (<div className="action-btns mb-xs">
                                                        <button className="btn-primary-mini" onClick={async () => {
                        try {
                            await updateBookingStatus(booking.id, 'Checked In');
                            alert('Patient checked-in successfully!');
                        }
                        catch (err) {
                            console.error(err);
                            alert('Check-in failed.');
                        }
                    }} title="Check In" style={{
                        backgroundColor: '#3F46B8',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                                                            <FiCheckCircle size={14}/> CHECK IN
                                                        </button>
                                                    </div>)}
                                                <span className="info-subtext">{booking.source || 'Portal'}</span>
                                            </div>
                                        </td>
                                    </tr>);
        }) : (<tr>
                                    <td colSpan={5} className="text-center p-lg">No bookings found for this clinic.</td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
export default Bookings;
