import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiCheckCircle, FiDollarSign, FiActivity, FiClock, FiTrendingUp, FiAlertCircle, FiArrowRight, FiGrid, FiUserPlus, FiFileText, FiPackage, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import './Dashboard.css';
const SuperAdminHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentClinics, setRecentClinics] = useState([]);
    const [recentRegistrations, setRecentRegistrations] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fetchDashboard = async () => {
        const token = localStorage.getItem('ev_token');
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [statsRes, clinicsRes, regsRes, alertsRes] = await Promise.allSettled([
                api.get('/super/dashboard/stats', { headers }),
                api.get('/super/clinics', { headers }),
                api.get('/super/registrations', { headers }),
                api.get('/super/alerts', { headers }),
            ]);
            if (statsRes.status === 'fulfilled')
                setStats(statsRes.value.data);
            if (clinicsRes.status === 'fulfilled') {
                const clinics = clinicsRes.value.data || [];
                setRecentClinics(clinics.slice(0, 5));
            }
            if (regsRes.status === 'fulfilled') {
                const regs = regsRes.value.data || [];
                setRecentRegistrations(regs.slice(0, 5));
            }
            if (alertsRes.status === 'fulfilled') {
                setAlerts(alertsRes.value.data || []);
            }
        }
        catch (e) {
            console.error('Dashboard fetch error', e);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => { fetchDashboard(); }, []);
    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };
    const statCards = [
        {
            label: 'Total Clinics', value: stats?.totalClinics ?? '—', icon: <FiGrid />,
            color: '#2D3BAE', bg: '#EEF2FF', sub: 'All registered', path: '/super-admin/clinics'
        },
        {
            label: 'Active Clinics', value: stats?.activeClinics ?? '—', icon: <FiCheckCircle />,
            color: '#10B981', bg: '#ECFDF5', sub: 'Currently running', path: '/super-admin/clinics'
        },
        {
            label: 'Total Users', value: stats?.totalUsers ?? '—', icon: <FiUsers />,
            color: '#6366F1', bg: '#EEF2FF', sub: 'Across all clinics', path: '/super-admin/admins'
        },
        {
            label: 'Pending Requests', value: recentRegistrations.filter(r => r.status === 'PENDING').length, icon: <FiUserPlus />,
            color: '#F59E0B', bg: '#FFFBEB', sub: 'Awaiting approval', path: '/super-admin/registrations'
        },
    ];
    const getStatusBg = (status) => {
        if (status === 'active')
            return { bg: '#ECFDF5', color: '#065F46' };
        if (status === 'inactive')
            return { bg: '#FEF2F2', color: '#991B1B' };
        return { bg: '#F1F5F9', color: '#475569' };
    };
    const getRegStatusStyle = (status) => {
        if (status === 'PENDING')
            return { background: '#FEF3C7', color: '#92400E' };
        if (status === 'APPROVED')
            return { background: '#ECFDF5', color: '#065F46' };
        if (status === 'REJECTED')
            return { background: '#FEF2F2', color: '#991B1B' };
        return {};
    };
    const formatDate = (d) => {
        if (!d)
            return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const quickActions = [
        { label: 'Add Clinic', icon: <FiHome />, path: '/super-admin/clinics', color: '#2D3BAE' },
        { label: 'Registrations', icon: <FiUserPlus />, path: '/super-admin/registrations', color: '#10B981' },
        { label: 'Plans & Pricing', icon: <FiDollarSign />, path: '/super-admin/plans', color: '#6366F1' },
        { label: 'Invoices', icon: <FiFileText />, path: '/super-admin/invoices', color: '#F59E0B' },
        { label: 'Admins', icon: <FiUsers />, path: '/super-admin/admins', color: '#EF4444' },
        { label: 'Modules', icon: <FiPackage />, path: '/super-admin/modules', color: '#8B5CF6' },
    ];
    return (<div className="dashboard-home">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Command Center</h2>
                    <p style={{ color: '#64748B', fontWeight: 500, marginTop: '0.25rem' }}>
                        Welcome back, Super Admin · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button onClick={handleRefresh} className="action-btn-mini btn-view-invoice" title="Refresh Dashboard" style={{ width: 44, height: 44 }}>
                    <FiRefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}/>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {statCards.map((c, i) => (<div key={i} className="stat-card" onClick={() => navigate(c.path)} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon-square" style={{ background: c.bg, color: c.color }}>
                            {c.icon}
                        </div>
                        <div>
                            <p className="stat-label">{c.label}</p>
                            <h3 className="stat-value" style={{ color: loading ? '#CBD5E1' : '#1E1B4B' }}>
                                {loading ? '...' : c.value}
                            </h3>
                            <span className="stat-sub">{c.sub}</span>
                        </div>
                    </div>))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
                    Quick Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
                    {quickActions.map((a, i) => (<button key={i} onClick={() => navigate(a.path)} style={{
                background: '#FFFFFF', border: `1.5px solid #F1F5F9`, borderRadius: '16px',
                padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.625rem', cursor: 'pointer', transition: 'all 0.25s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }} onMouseEnter={e => {
                e.currentTarget.style.borderColor = a.color;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${a.color}20`;
            }} onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#F1F5F9';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
            }}>
                            <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${a.color}15`, color: a.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
            }}>
                                {a.icon}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
                        </button>))}
                </div>
            </div>

            {/* Two Column Layout: Recent Clinics + Recent Registrations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Recent Clinics */}
                <div style={{ background: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                        <div className="d-flex align-items-center gap-sm">
                            <FiActivity style={{ color: '#2D3BAE', fontSize: '1.25rem' }}/>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>Recent Clinics</h3>
                        </div>
                        <button onClick={() => navigate('/super-admin/clinics')} style={{ background: 'none', border: 'none', color: '#2D3BAE', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View All <FiArrowRight size={14}/>
                        </button>
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                        {loading ? (<div className="loading-state" style={{ padding: '2rem' }}>
                                <div className="loader"></div>
                            </div>) : recentClinics.length === 0 ? (<div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                                <FiHome size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }}/>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>No clinics added yet</p>
                            </div>) : recentClinics.map(clinic => {
            const s = getStatusBg(clinic.status);
            return (<div key={clinic.id} onClick={() => navigate('/super-admin/clinics')} style={{
                    padding: '1rem 2rem', display: 'flex', alignItems: 'center',
                    gap: '1rem', borderBottom: '1px solid #F8FAFC',
                    cursor: 'pointer', transition: 'background 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2D3BAE, #6366F1)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.875rem', flexShrink: 0
                }}>
                                        {clinic.name?.[0]?.toUpperCase() || 'C'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: '#1E1B4B', fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {clinic.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                                            {clinic.email} · {clinic.subscriptionPlan}
                                        </div>
                                    </div>
                                    <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '0.3rem 0.75rem',
                    borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: s.bg, color: s.color, flexShrink: 0
                }}>
                                        {clinic.status}
                                    </span>
                                </div>);
        })}
                    </div>
                </div>

                {/* Recent Registrations */}
                <div style={{ background: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                        <div className="d-flex align-items-center gap-sm">
                            <FiTrendingUp style={{ color: '#10B981', fontSize: '1.25rem' }}/>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>Recent Registrations</h3>
                        </div>
                        <button onClick={() => navigate('/super-admin/registrations')} style={{ background: 'none', border: 'none', color: '#2D3BAE', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Manage <FiArrowRight size={14}/>
                        </button>
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                        {loading ? (<div className="loading-state" style={{ padding: '2rem' }}>
                                <div className="loader"></div>
                            </div>) : recentRegistrations.length === 0 ? (<div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8' }}>
                                <FiUserPlus size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }}/>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>No registrations yet</p>
                            </div>) : recentRegistrations.map(reg => (<div key={reg.id} onClick={() => navigate('/super-admin/registrations')} style={{
                padding: '1rem 2rem', display: 'flex', alignItems: 'center',
                gap: '1rem', borderBottom: '1px solid #F8FAFC',
                cursor: 'pointer', transition: 'background 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.875rem', flexShrink: 0
            }}>
                                    {reg.firstName?.[0]?.toUpperCase() || 'R'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: '#1E1B4B', fontSize: '0.9375rem' }}>
                                        {reg.firstName} {reg.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {reg.email} · {formatDate(reg.createdAt)}
                                    </div>
                                </div>
                                <span style={{
                fontSize: '0.65rem', fontWeight: 800, padding: '0.3rem 0.75rem',
                borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '0.06em',
                flexShrink: 0, ...getRegStatusStyle(reg.status)
            }}>
                                    {reg.status}
                                </span>
                            </div>))}
                    </div>
                </div>
            </div>

            {/* System Alerts */}
            {alerts.length > 0 && (<div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '1rem' }}>
                        <FiAlertCircle style={{ marginRight: '8px', color: '#F59E0B', verticalAlign: 'middle' }}/>
                        System Alerts
                    </h3>
                    <div className="alert-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {alerts.slice(0, 4).map((alert, i) => {
                // The message field is often a raw JSON string — parse it to get human-readable text
                let parsed = {};
                try {
                    const raw = alert.message || alert.title || '';
                    parsed = typeof raw === 'string' && raw.trim().startsWith('{')
                        ? JSON.parse(raw)
                        : { text: raw };
                }
                catch {
                    parsed = { text: alert.message || alert.title || 'System alert' };
                }
                const alertText = parsed.text || parsed.message || alert.title || 'System alert';
                const alertTypeRaw = (parsed.type || alert.type || '').toUpperCase();
                const isCrit = alertTypeRaw.includes('CRIT') || alertTypeRaw.includes('ERROR');
                const isWarn = alertTypeRaw.includes('EXPIR') || alertTypeRaw.includes('WARN');
                const iconBg = isCrit ? '#FEF2F2' : isWarn ? '#FFFBEB' : '#EEF2FF';
                const iconColor = isCrit ? '#EF4444' : isWarn ? '#F59E0B' : '#2D3BAE';
                return (<div key={i} className="alert-item">
                                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                        background: iconBg, color: iconColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                    }}>
                                        <FiAlertCircle />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#1E1B4B', fontSize: '0.9375rem' }}>{alertText}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {alertTypeRaw && (<span style={{ background: iconBg, color: iconColor, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                                                    {alertTypeRaw}
                                                </span>)}
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <FiClock size={11}/> {formatDate(alert.createdAt || alert.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>);
            })}
                    </div>
                </div>)}
        </div>);
};
export default SuperAdminHome;
