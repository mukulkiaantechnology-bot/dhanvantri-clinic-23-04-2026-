import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
const TokenQueue = () => {
    const { bookings, staff } = useApp();
    const { selectedClinic } = useAuth();
    // Filter bookings by active clinic
    const clinicBookings = bookings.filter((b) => Number(b.clinicId) === Number(selectedClinic?.id));
    // Only show today's bookings, sorted by tokenNumber / createdAt
    const today = new Date().toISOString().split('T')[0];
    const todayQueue = clinicBookings
        .filter((b) => {
        const bookingDate = new Date(b.date).toISOString().split('T')[0];
        return bookingDate === today;
    })
        .sort((a, b) => {
        // Sort by tokenNumber first, then by createdAt
        if (a.tokenNumber && b.tokenNumber)
            return Number(a.tokenNumber) - Number(b.tokenNumber);
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    const getDisplayStatus = (booking) => {
        const rawStatus = (booking.queueStatus || booking.status || '').toLowerCase().trim();
        if (rawStatus === 'walk-in' || booking.source?.toLowerCase() === 'walk-in') {
            return 'Walk-in';
        }
        if (rawStatus.includes('checked') || rawStatus === 'checked in' || rawStatus === 'checked-in') {
            return 'Checked-In';
        }
        return 'Pending';
    };
    const getStatusClass = (status) => {
        switch (status) {
            case 'Walk-in': return 'tq-status-walkin';
            case 'Checked-In': return 'tq-status-checkedin';
            default: return 'tq-status-pending';
        }
    };
    const getDoctorName = (booking) => {
        if (booking.doctor?.name)
            return `Dr. ${booking.doctor.name}`;
        if (booking.doctorId) {
            const doc = staff.find((s) => s.id === booking.doctorId);
            if (doc?.name)
                return `Dr. ${doc.name}`;
        }
        return '—';
    };
    return (<div className="reception-dashboard">
            <div className="dashboard-welcome">
                <div>
                    <h1>Token Queue</h1>
                    <p>Live view of today's patient queue — Patient Name, Doctor &amp; Status</p>
                </div>
            </div>

            <div className="section-card card" style={{ marginTop: '1.5rem' }}>
                <div className="section-header-centered">
                    <h3>
                        Today's Queue
                        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: '0.6rem', background: '#3F46B8', color: '#fff',
            borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
            padding: '2px 10px', verticalAlign: 'middle', minWidth: '28px'
        }}>
                            {todayQueue.length}
                        </span>
                    </h3>
                </div>

                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                                <th style={thStyle}>#</th>
                                <th style={thStyle}>Patient Name</th>
                                <th style={thStyle}>Doctor</th>
                                <th style={thStyle}>Source</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayQueue.length === 0 ? (<tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                        No patients in queue for today.
                                    </td>
                                </tr>) : (todayQueue.map((booking, index) => {
            const status = getDisplayStatus(booking);
            const source = booking.source || 'Online';
            const isWalkin = source.toLowerCase().includes('walk');
            return (<tr key={booking.id} style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: index % 2 === 0 ? '#fff' : '#F8FAFC'
                }}>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 700, color: '#3F46B8' }}>
                                                    {booking.tokenNumber ? `#${booking.tokenNumber}` : '—'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                                    {booking.patient?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ color: '#475569' }}>
                                                    {getDoctorName(booking)}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: 600,
                    background: isWalkin ? '#FEF9C3' : '#DBEAFE',
                    color: isWalkin ? '#854D0E' : '#1E40AF'
                }}>
                                                    {isWalkin ? 'Walk-in' : source}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span className={`status-pill-mini ${getStatusClass(status)}`} style={statusBadgeStyle(status)}>
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>);
        }))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);
};
const thStyle = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: 700,
    color: '#475569',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#F8FAFC',
};
const tdStyle = {
    padding: '0.85rem 1rem',
    verticalAlign: 'middle',
};
const statusBadgeStyle = (status) => {
    const base = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontWeight: 600,
    };
    if (status === 'Walk-in')
        return { ...base, background: '#FEF3C7', color: '#92400E' };
    if (status === 'Checked-In')
        return { ...base, background: '#D1FAE5', color: '#065F46' };
    return { ...base, background: '#EDE9FE', color: '#5B21B6' };
};
export default TokenQueue;
