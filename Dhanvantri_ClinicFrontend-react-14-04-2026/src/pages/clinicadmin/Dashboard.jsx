import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiCalendar, FiDollarSign, FiFileText, FiCopy, FiBookmark } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useCurrency } from '../../context/CurrencyContext';
import { dashboardService } from '../../services/dashboard.service';
import './Dashboard.css';
const ClinicAdminHome = () => {
    const navigate = useNavigate();
    const { selectedClinic } = useAuth();
    const { staff, clinics, refreshTrigger } = useApp();
    const { formatMoney } = useCurrency();
    const [copySuccess, setCopySuccess] = useState(false);
    const [clinicStats, setClinicStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        dashboardService.getStats('ADMIN')
            .then((res) => { if (!cancelled)
            setClinicStats(res?.data ?? res); })
            .catch(() => { if (!cancelled)
            setClinicStats({}); })
            .finally(() => { if (!cancelled)
            setLoading(false); });
        return () => { cancelled = true; };
    }, [selectedClinic?.id, refreshTrigger]);
    const currentClinic = clinics?.find((c) => c.id === selectedClinic?.id) || selectedClinic;
    const clinicStaffList = staff?.filter((s) => s.clinicId === currentClinic?.id || (s.clinics || []).includes(currentClinic?.id)) ?? [];
    const stats = [
        { label: 'Total Bookings', value: String(clinicStats?.totalAppointments ?? 0), icon: <FiBookmark />, color: '#6366F1' },
        { label: "Today's Appointments", value: String(clinicStats?.todayAppointments ?? 0), icon: <FiCalendar />, color: '#10B981' },
        { label: 'Today Revenue', value: formatMoney(clinicStats?.todayRevenue ?? 0), icon: <FiDollarSign />, color: '#3F46B8' },
        { label: 'Pending Bills', value: String(clinicStats?.pendingBills ?? 0), icon: <FiFileText />, color: '#F59E0B' },
        { label: 'Staff Count', value: String(clinicStats?.totalStaff ?? 0), icon: <FiUsers />, color: '#23286B' },
    ];
    const handleCopyBookingLink = () => {
        const url = `${window.location.origin}/walkin/book/${currentClinic?.id}`;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };
    if (loading && !clinicStats) {
        return (<div className="dashboard-home">
                <div className="page-header"><h2>{currentClinic?.name || 'Clinic'} Dashboard</h2></div>
                <div className="stats-grid" style={{ opacity: 0.7 }}>{[1, 2, 3, 4].map(i => <div key={i} className="stat-card"><p className="stat-label">—</p><h3 className="stat-value">...</h3></div>)}</div>
            </div>);
    }
    return (<div className="dashboard-home">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2>{currentClinic?.name || 'Clinic'} Center</h2>
                    <p style={{ color: '#64748B', fontWeight: 500, marginTop: '0.25rem' }}>
                        Clinic Management Portal · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleCopyBookingLink} className="btn btn-primary btn-sm" style={{
            borderRadius: '10px',
            padding: '0.6rem 1.2rem',
            background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
            color: 'white',
            border: 'none',
            fontWeight: 600
        }}>
                        {copySuccess ? 'Copied Link!' : 'Public Booking URL'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((s, i) => (<div key={i} className="stat-card" onClick={() => {
                if (s.label.includes('Staff'))
                    navigate('/clinic-admin/staff');
                else if (s.label.includes('Bookings') || s.label.includes('Appointments'))
                    navigate('/reception/bookings');
                else if (s.label.includes('Revenue') || s.label.includes('Bills'))
                    navigate('/reception/billing');
            }}>
                        <div className="stat-icon-square" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="stat-label">{s.label}</p>
                            <h3 className="stat-value">{s.value}</h3>
                        </div>
                    </div>))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
                    Essential Operations
                </h3>
                <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => navigate('/clinic-admin/staff')}>
                        <FiUsers />
                        <span>Manage Staff</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/clinic-admin/booking-link')}>
                        <FiCopy />
                        <span>Booking Link</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/clinic-admin/departments')}>
                        <FiBookmark />
                        <span>Departments</span>
                    </button>
                </div>
            </div>

            <div className="grid-2">
                {/* Recent Staff Activity */}
                <div className="dashboard-section-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Recent Staff</h3>
                        <button onClick={() => navigate('/clinic-admin/staff')} style={{ background: 'none', border: 'none', color: '#2D3BAE', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                            View Team
                        </button>
                    </div>

                    <div className="staff-list">
                        {clinicStaffList.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                                <p>No staff members found.</p>
                            </div>) : (clinicStaffList.slice(0, 5).map((s) => (<div key={s.id} className="list-item-minimal">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3F46B8, #6366F1)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
            }}>
                                            {s.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="item-name">{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.email}</div>
                                        </div>
                                    </div>
                                    <span className="info-subtext">{s.role || (s.roles && s.roles[0])}</span>
                                </div>)))}
                    </div>
                </div>

                {/* Performance / Capacity */}
                <div className="dashboard-section-card">
                    <h3>Performance Overview</h3>
                    <div className="stat-row">
                        <span>Staff Utilization</span>
                        <strong>{clinicStats?.utilization ?? 0}%</strong>
                    </div>
                    <div className="stat-row">
                        <span>Daily Booking Growth</span>
                        <strong style={{ color: (clinicStats?.growth ?? 0) >= 0 ? '#10B981' : '#EF4444' }}>
                            {clinicStats?.growth >= 0 ? '+' : ''}{clinicStats?.growth ?? 0}%
                        </strong>
                    </div>
                    <div className="stat-row">
                        <span>System Status</span>
                        <strong style={{ color: clinicStats?.systemStatus === 'Healthy' ? '#10B981' : '#F59E0B' }}>
                            {clinicStats?.systemStatus ?? 'Healthy'}
                        </strong>
                    </div>
                </div>
            </div>
        </div>);
};
export default ClinicAdminHome;
