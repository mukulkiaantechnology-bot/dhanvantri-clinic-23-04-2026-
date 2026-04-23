import { useState, useEffect } from 'react';
import { FiSave, FiClock, FiSettings as FiSettingsIcon, FiFileText, FiPlus, FiTrash2, FiDollarSign, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { clinicService } from '../../services/clinic.service';
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';
import './ClinicSettings.css';
const ClinicSettings = () => {
    const { selectedClinic } = useAuth();
    const { clinics } = useApp();
    const { currency, setCurrencyCode, formatMoney } = useCurrency();
    // Get current clinic
    const currentClinic = clinics.find((c) => c.id === selectedClinic?.id) || selectedClinic;
    const [settings, setSettings] = useState({
        // Clinic Profile
        clinicName: currentClinic?.name || '',
        address: currentClinic?.location || '',
        phone: currentClinic?.contact || '',
        email: currentClinic?.email || '',
        country: currentClinic?.country || '',
        currency: currentClinic?.currency || '',
        // Working Hours
        workingHours: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '13:00', enabled: true },
            sunday: { start: '09:00', end: '17:00', enabled: false }
        },
        // Notifications
        emailNotifications: true,
        smsNotifications: false,
        bookingConfirmations: true,
        // Booking Rules
        advanceBookingDays: 30,
        cancellationHours: 24,
        slotDuration: 30,
        // Document Types
        documentTypes: currentClinic?.documentTypes || []
    });
    const [newDocType, setNewDocType] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await clinicService.getClinicDetails();
                const clinicData = res.data?.data || res.data;
                if (clinicData) {
                    setSettings(prev => ({
                        ...prev,
                        clinicName: clinicData.name || prev.clinicName,
                        address: clinicData.location || prev.address,
                        phone: clinicData.contact || prev.phone,
                        email: clinicData.email || prev.email,
                        documentTypes: clinicData.documentTypes || []
                    }));
                }
            }
            catch (err) {
                console.error('Failed to fetch clinic details:', err);
            }
        };
        fetchDetails();
    }, []);
    const handleSave = async () => {
        setLoading(true);
        try {
            await clinicService.updateClinicDetails({
                name: settings.clinicName,
                location: settings.address,
                contact: settings.phone,
                email: settings.email,
                documentTypes: settings.documentTypes
            });
            alert('Settings saved successfully!');
        }
        catch (err) {
            console.error('Failed to save settings:', err);
            alert(err?.response?.data?.message || 'Failed to save settings');
        }
        finally {
            setLoading(false);
        }
    };
    const addDocType = () => {
        if (!newDocType.trim())
            return;
        if (settings.documentTypes.includes(newDocType.trim())) {
            alert('This document type already exists');
            return;
        }
        setSettings({
            ...settings,
            documentTypes: [...settings.documentTypes, newDocType.trim()]
        });
        setNewDocType('');
    };
    const removeDocType = (type) => {
        setSettings({
            ...settings,
            documentTypes: settings.documentTypes.filter((t) => t !== type)
        });
    };
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return (<div className="clinic-settings-page">
            <div className="page-header">
                <div>
                    <h1>Clinic Settings</h1>
                    <p>Configure your clinic profile, working hours, and preferences</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={handleSave} disabled={loading}>
                    <FiSave />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            <div className="settings-grid">
                {/* Clinic Profile */}
                <div className="settings-card card">
                    <div className="settings-header">
                        <FiSettingsIcon />
                        <h3>Clinic Profile</h3>
                    </div>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Clinic Name</label>
                            <input type="text" value={settings.clinicName} onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input type="text" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem' }}>
                                <select value={settings.phone.includes(' ') ? settings.phone.split(' ')[0] : '+91'} onChange={e => {
            const currentNumber = settings.phone.includes(' ')
                ? settings.phone.split(' ').slice(1).join(' ')
                : settings.phone;
            setSettings({ ...settings, phone: `${e.target.value} ${currentNumber}` });
        }} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.9rem' }}>
                                    {[
            { code: '+1', country: 'USA / Canada' },
            { code: '+7', country: 'Russia' },
            { code: '+20', country: 'Egypt' },
            { code: '+27', country: 'South Africa' },
            { code: '+30', country: 'Greece' },
            { code: '+31', country: 'Netherlands' },
            { code: '+32', country: 'Belgium' },
            { code: '+33', country: 'France' },
            { code: '+34', country: 'Spain' },
            { code: '+36', country: 'Hungary' },
            { code: '+39', country: 'Italy' },
            { code: '+40', country: 'Romania' },
            { code: '+41', country: 'Switzerland' },
            { code: '+43', country: 'Austria' },
            { code: '+44', country: 'UK' },
            { code: '+45', country: 'Denmark' },
            { code: '+46', country: 'Sweden' },
            { code: '+47', country: 'Norway' },
            { code: '+48', country: 'Poland' },
            { code: '+49', country: 'Germany' },
            { code: '+51', country: 'Peru' },
            { code: '+52', country: 'Mexico' },
            { code: '+53', country: 'Cuba' },
            { code: '+54', country: 'Argentina' },
            { code: '+55', country: 'Brazil' },
            { code: '+56', country: 'Chile' },
            { code: '+57', country: 'Colombia' },
            { code: '+58', country: 'Venezuela' },
            { code: '+60', country: 'Malaysia' },
            { code: '+61', country: 'Australia' },
            { code: '+62', country: 'Indonesia' },
            { code: '+63', country: 'Philippines' },
            { code: '+64', country: 'New Zealand' },
            { code: '+65', country: 'Singapore' },
            { code: '+66', country: 'Thailand' },
            { code: '+81', country: 'Japan' },
            { code: '+82', country: 'South Korea' },
            { code: '+84', country: 'Vietnam' },
            { code: '+86', country: 'China' },
            { code: '+90', country: 'Turkey' },
            { code: '+91', country: 'India' },
            { code: '+92', country: 'Pakistan' },
            { code: '+93', country: 'Afghanistan' },
            { code: '+94', country: 'Sri Lanka' },
            { code: '+95', country: 'Myanmar' },
            { code: '+98', country: 'Iran' },
            { code: '+212', country: 'Morocco' },
            { code: '+213', country: 'Algeria' },
            { code: '+216', country: 'Tunisia' },
            { code: '+218', country: 'Libya' },
            { code: '+220', country: 'Gambia' },
            { code: '+221', country: 'Senegal' },
            { code: '+234', country: 'Nigeria' },
            { code: '+254', country: 'Kenya' },
            { code: '+256', country: 'Uganda' },
            { code: '+260', country: 'Zambia' },
            { code: '+263', country: 'Zimbabwe' },
            { code: '+351', country: 'Portugal' },
            { code: '+352', country: 'Luxembourg' },
            { code: '+353', country: 'Ireland' },
            { code: '+355', country: 'Albania' },
            { code: '+358', country: 'Finland' },
            { code: '+370', country: 'Lithuania' },
            { code: '+371', country: 'Latvia' },
            { code: '+372', country: 'Estonia' },
            { code: '+374', country: 'Armenia' },
            { code: '+375', country: 'Belarus' },
            { code: '+380', country: 'Ukraine' },
            { code: '+381', country: 'Serbia' },
            { code: '+385', country: 'Croatia' },
            { code: '+386', country: 'Slovenia' },
            { code: '+387', country: 'Bosnia' },
            { code: '+389', country: 'North Macedonia' },
            { code: '+420', country: 'Czech Republic' },
            { code: '+421', country: 'Slovakia' },
            { code: '+423', country: 'Liechtenstein' },
            { code: '+500', country: 'Falkland Islands' },
            { code: '+502', country: 'Guatemala' },
            { code: '+503', country: 'El Salvador' },
            { code: '+504', country: 'Honduras' },
            { code: '+505', country: 'Nicaragua' },
            { code: '+506', country: 'Costa Rica' },
            { code: '+507', country: 'Panama' },
            { code: '+509', country: 'Haiti' },
            { code: '+591', country: 'Bolivia' },
            { code: '+593', country: 'Ecuador' },
            { code: '+595', country: 'Paraguay' },
            { code: '+598', country: 'Uruguay' },
            { code: '+670', country: 'East Timor' },
            { code: '+673', country: 'Brunei' },
            { code: '+675', country: 'Papua New Guinea' },
            { code: '+676', country: 'Tonga' },
            { code: '+677', country: 'Solomon Islands' },
            { code: '+679', country: 'Fiji' },
            { code: '+685', country: 'Samoa' },
            { code: '+686', country: 'Kiribati' },
            { code: '+689', country: 'French Polynesia' },
            { code: '+880', country: 'Bangladesh' },
            { code: '+886', country: 'Taiwan' },
            { code: '+960', country: 'Maldives' },
            { code: '+961', country: 'Lebanon' },
            { code: '+962', country: 'Jordan' },
            { code: '+963', country: 'Syria' },
            { code: '+964', country: 'Iraq' },
            { code: '+965', country: 'Kuwait' },
            { code: '+966', country: 'Saudi Arabia' },
            { code: '+967', country: 'Yemen' },
            { code: '+968', country: 'Oman' },
            { code: '+970', country: 'Palestine' },
            { code: '+971', country: 'UAE' },
            { code: '+972', country: 'Israel' },
            { code: '+973', country: 'Bahrain' },
            { code: '+974', country: 'Qatar' },
            { code: '+975', country: 'Bhutan' },
            { code: '+976', country: 'Mongolia' },
            { code: '+977', country: 'Nepal' },
            { code: '+992', country: 'Tajikistan' },
            { code: '+993', country: 'Turkmenistan' },
            { code: '+994', country: 'Azerbaijan' },
            { code: '+995', country: 'Georgia' },
            { code: '+996', country: 'Kyrgyzstan' },
            { code: '+998', country: 'Uzbekistan' },
        ].map(({ code, country }) => (<option key={code} value={code}>{code} ({country})</option>))}
                                </select>
                                <input type="tel" placeholder="Enter phone number" value={settings.phone.includes(' ') ? settings.phone.split(' ').slice(1).join(' ') : settings.phone} onChange={e => {
            const currentCode = settings.phone.includes(' ')
                ? settings.phone.split(' ')[0]
                : '+91';
            setSettings({ ...settings, phone: `${currentCode} ${e.target.value}` });
        }}/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })}/>
                        </div>

                    </div>
                </div>

                {/* Working Hours */}
                <div className="settings-card card full-width">
                    <div className="settings-header">
                        <FiClock />
                        <h3>Working Hours</h3>
                    </div>
                    <div className="working-hours-grid">
                        {days.map(day => (<div key={day} className="day-schedule">
                                <label className="day-toggle">
                                    <input type="checkbox" checked={settings.workingHours[day].enabled} onChange={(e) => setSettings({
                ...settings,
                workingHours: {
                    ...settings.workingHours,
                    [day]: { ...settings.workingHours[day], enabled: e.target.checked }
                }
            })}/>
                                    <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                </label>
                                {settings.workingHours[day].enabled && (<div className="time-inputs">
                                        <input type="time" value={settings.workingHours[day].start} onChange={(e) => setSettings({
                    ...settings,
                    workingHours: {
                        ...settings.workingHours,
                        [day]: { ...settings.workingHours[day], start: e.target.value }
                    }
                })}/>
                                        <span>to</span>
                                        <input type="time" value={settings.workingHours[day].end} onChange={(e) => setSettings({
                    ...settings,
                    workingHours: {
                        ...settings.workingHours,
                        [day]: { ...settings.workingHours[day], end: e.target.value }
                    }
                })}/>
                                    </div>)}
                            </div>))}
                    </div>
                </div>

                {/* Notifications */}
                {/* <div className="settings-card card">
            <div className="settings-header">
                <FiBell />
                <h3>Notification Preferences</h3>
            </div>
            <div className="settings-form">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    />
                    <div>
                        <strong>Email Notifications</strong>
                        <p>Receive updates via email</p>
                    </div>
                </label>
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    />
                    <div>
                        <strong>SMS Notifications</strong>
                        <p>Receive updates via SMS</p>
                    </div>
                </label>
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={settings.bookingConfirmations}
                        onChange={(e) => setSettings({ ...settings, bookingConfirmations: e.target.checked })}
                    />
                    <div>
                        <strong>Booking Confirmations</strong>
                        <p>Send confirmation to patients</p>
                    </div>
                </label>
            </div>
        </div> */}

                {/* Booking Rules */}
                {/* <div className="settings-card card">
            <div className="settings-header">
                <FiCalendar />
                <h3>Booking Rules</h3>
            </div>
            <div className="settings-form">
                <div className="form-group">
                    <label>Advance Booking (Days)</label>
                    <input
                        type="number"
                        value={settings.advanceBookingDays}
                        onChange={(e) => setSettings({ ...settings, advanceBookingDays: parseInt(e.target.value) })}
                        min="1"
                        max="90"
                    />
                    <small>Maximum days in advance patients can book</small>
                </div>
                <div className="form-group">
                    <label>Cancellation Notice (Hours)</label>
                    <input
                        type="number"
                        value={settings.cancellationHours}
                        onChange={(e) => setSettings({ ...settings, cancellationHours: parseInt(e.target.value) })}
                        min="1"
                        max="72"
                    />
                    <small>Minimum hours before appointment to cancel</small>
                </div>
                <div className="form-group">
                    <label>Slot Duration (Minutes)</label>
                    <select
                        value={settings.slotDuration}
                        onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) })}
                    >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                    </select>
                </div>
            </div>
        </div> */}

                {/* Document Types */}
                <div className="settings-card card full-width">
                    <div className="settings-header">
                        <FiFileText />
                        <h3>Document Management</h3>
                    </div>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Configure Patient/Staff Document Types</label>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                Add or remove document types that will be available in the upload dropdowns.
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <input type="text" placeholder="e.g. Vaccination Record, Lab Report" value={newDocType} onChange={(e) => setNewDocType(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addDocType()}/>
                                <button className="btn btn-primary btn-no-hover" onClick={addDocType}>
                                    <FiPlus /> Add
                                </button>
                            </div>

                            <div className="doc-types-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {settings.documentTypes.length > 0 ? (settings.documentTypes.map((type) => (<div key={type} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
            }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{type}</span>
                                            <button onClick={() => removeDocType(type)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                                                <FiTrash2 size={16}/>
                                            </button>
                                        </div>))) : (<div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        No custom document types added yet. Default types will be used.
                                    </div>)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Currency Preferences ─────────────────────────────── */}
                <div className="settings-card card full-width">
                    <div className="settings-header">
                        <FiDollarSign />
                        <div>
                            <h3>Currency Preferences</h3>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 500 }}>
                                Select the currency for all billing, invoices and financial displays across the clinic.
                                Currently active: <strong style={{ color: '#2D3BAE' }}>{currency.code} — {formatMoney(1234.5)}</strong>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem', padding: '1.5rem 0 0.5rem' }}>
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
export default ClinicSettings;
