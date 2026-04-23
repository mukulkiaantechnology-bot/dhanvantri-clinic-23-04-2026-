import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiEdit2, FiSave, FiX, FiShield, FiDollarSign, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';
import './Invoices.css';
const Settings = () => {
    const toast = useToast();
    const { currency, setCurrencyCode, formatMoney } = useCurrency();
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('ev_token');
            const res = await api.get('/super/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 'success') {
                const p = res.data;
                setProfile(p);
                setForm(f => ({ ...f, name: p.name || '', email: p.email || '' }));
            }
        }
        catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, []);
    const handleSave = async () => {
        if (form.newPassword && form.newPassword !== form.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (form.newPassword && form.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem('ev_token');
            const payload = { name: form.name, email: form.email };
            if (form.newPassword) {
                payload.currentPassword = form.currentPassword;
                payload.newPassword = form.newPassword;
            }
            const res = await api.patch('/super/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 'success') {
                toast.success('Profile updated successfully!');
                setProfile(res.data);
                setIsEditing(false);
                setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
                // Update stored user name
                const storedUser = localStorage.getItem('ev_user');
                if (storedUser) {
                    const u = JSON.parse(storedUser);
                    u.name = res.data.name;
                    u.email = res.data.email;
                    localStorage.setItem('ev_user', JSON.stringify(u));
                }
            }
        }
        catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleCancel = () => {
        setIsEditing(false);
        if (profile) {
            setForm(f => ({ ...f, name: profile.name, email: profile.email, currentPassword: '', newPassword: '', confirmPassword: '' }));
        }
    };
    const getInitials = (name) => {
        if (!name)
            return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };
    return (<div className="invoices-page fade-in">
            <div className="page-header">
                <div>
                    <h2>My Profile</h2>
                    <p>Manage your account information and password</p>
                </div>
            </div>

            <div style={{ maxWidth: '680px' }}>
                {/* Avatar & Name Card */}
                <div className="stat-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '2rem', marginBottom: '1.5rem' }}>
                    <div className="d-flex align-items-center gap-md" style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #F1F5F9' }}>
                        {/* Avatar Circle */}
                        <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2D3BAE, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.75rem', fontWeight: 800, flexShrink: 0
        }}>
                            {getInitials(profile?.name || '')}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#1E1B4B' }}>{profile?.name || '—'}</h3>
                            <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.9375rem' }}>{profile?.email}</p>
                            <span className="status-pill paid" style={{ marginTop: '0.5rem', display: 'inline-flex', fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
                                <FiShield size={11} style={{ marginRight: '4px' }}/> {profile?.role?.replace('_', ' ') || 'SUPER ADMIN'}
                            </span>
                        </div>
                        {!isEditing && (<button onClick={() => setIsEditing(true)} className="action-btn-mini btn-view-invoice" title="Edit Profile" style={{ alignSelf: 'flex-start' }}>
                                <FiEdit2 size={18}/>
                            </button>)}
                    </div>

                    {/* Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Name */}
                        <div>
                            <label className="text-xs font-bold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                                <FiUser size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }}/>Full Name
                            </label>
                            {isEditing ? (<div className="search-box-wrap" style={{ padding: '0.75rem 1rem' }}>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" style={{ width: '100%', fontSize: '1rem', color: '#1E1B4B', fontWeight: 600 }}/>
                                </div>) : (<div className="settings-item" style={{ padding: '0.75rem 0', borderBottom: 'none' }}>
                                    <span style={{ fontSize: '1rem', color: '#334155', fontWeight: 600 }}>{profile?.name || '—'}</span>
                                </div>)}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs font-bold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                                <FiMail size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }}/>Email Address
                            </label>
                            {isEditing ? (<div className="search-box-wrap" style={{ padding: '0.75rem 1rem' }}>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter email address" style={{ width: '100%', fontSize: '1rem', color: '#1E1B4B', fontWeight: 600 }}/>
                                </div>) : (<div className="settings-item" style={{ padding: '0.75rem 0', borderBottom: 'none' }}>
                                    <span style={{ fontSize: '1rem', color: '#334155', fontWeight: 600 }}>{profile?.email || '—'}</span>
                                </div>)}
                        </div>
                    </div>
                </div>

                {/* Change Password Card — only in edit mode */}
                {isEditing && (<div className="stat-card fade-in" style={{ alignItems: 'stretch', textAlign: 'left', padding: '2rem', marginBottom: '1.5rem' }}>
                        <div className="d-flex align-items-center gap-sm" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
                            <div className="stat-icon-square" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF2FF', color: '#2D3BAE', fontSize: '1.1rem' }}>
                                <FiLock />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E1B4B' }}>Change Password</h3>
                                <p className="text-xs text-muted" style={{ margin: 0 }}>Leave blank to keep current password</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="text-xs font-bold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
                                <div className="search-box-wrap" style={{ padding: '0.75rem 1rem' }}>
                                    <FiLock size={16} style={{ color: '#94A3B8', marginRight: '8px', flexShrink: 0 }}/>
                                    <input type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} placeholder="Enter current password" style={{ width: '100%', fontSize: '1rem' }}/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                                <div className="search-box-wrap" style={{ padding: '0.75rem 1rem' }}>
                                    <FiLock size={16} style={{ color: '#94A3B8', marginRight: '8px', flexShrink: 0 }}/>
                                    <input type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} placeholder="Enter new password" style={{ width: '100%', fontSize: '1rem' }}/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                                <div className="search-box-wrap" style={{ padding: '0.75rem 1rem' }}>
                                    <FiLock size={16} style={{ color: '#94A3B8', marginRight: '8px', flexShrink: 0 }}/>
                                    <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm new password" style={{ width: '100%', fontSize: '1rem' }}/>
                                </div>
                            </div>
                        </div>
                    </div>)}

                {/* Action Buttons */}
                {isEditing && (<div className="d-flex gap-md fade-in">
                        <button onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.875rem' }} disabled={isSaving}>
                            <FiX /> Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary btn-no-hover" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.875rem' }} disabled={isSaving}>
                            <FiSave /> {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>)}
            </div>

            {/* ── Currency Preferences ─────────────────────────────── */}
            <div style={{ maxWidth: '900px', marginTop: '2rem' }}>
                <div className="stat-card" style={{ alignItems: 'stretch', textAlign: 'left', padding: '2rem' }}>
                    <div className="d-flex align-items-center gap-md" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
                        <div className="stat-icon-square" style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', color: '#2D3BAE', fontSize: '1.2rem' }}>
                            <FiDollarSign />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E1B4B' }}>Currency Preferences</h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500 }}>
                                Select the currency for all billing, invoices and financial displays.
                                Currently active: <strong style={{ color: '#2D3BAE' }}>{currency.code} — {formatMoney(1234.5)}</strong>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem', padding: '0.5rem 0' }}>
                        {CURRENCIES.map(cur => {
            const isActive = cur.code === currency.code;
            return (<button key={cur.code} onClick={() => setCurrencyCode(cur.code)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem', border: isActive ? '2px solid #2D3BAE' : '1.5px solid #F1F5F9',
                    borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#FAFBFF',
                    transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
                }} onMouseEnter={e => { if (!isActive)
                e.currentTarget.style.borderColor = '#A5B4FC'; }} onMouseLeave={e => { if (!isActive)
                e.currentTarget.style.borderColor = '#F1F5F9'; }}>
                                    {/* Symbol badge */}
                                    <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: isActive ? '#2D3BAE' : '#E2E8F0',
                    color: isActive ? '#ffffff' : '#475569',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cur.symbol.length > 2 ? '0.75rem' : '1.125rem',
                    fontWeight: 800, letterSpacing: '0'
                }}>
                                        {cur.symbol}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: isActive ? '#2D3BAE' : '#1E1B4B', fontSize: '0.9375rem', lineHeight: 1.2 }}>
                                            {cur.code}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {cur.name}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '1px' }}>{cur.country}</div>
                                    </div>
                                    {isActive && (<div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: '#2D3BAE', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem'
                    }}>
                                            <FiCheck strokeWidth={3}/>
                                        </div>)}
                                </button>);
        })}
                    </div>

                    {/* Live preview */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview:</span>
                        {[99, 1234.5, 99999, 1250000].map(n => (<span key={n} style={{ background: '#EEF2FF', color: '#2D3BAE', padding: '0.3rem 0.875rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
                                {formatMoney(n)}
                            </span>))}
                    </div>
                </div>
            </div>
        </div>);
};
export default Settings;
