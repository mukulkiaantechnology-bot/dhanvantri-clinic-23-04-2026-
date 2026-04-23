import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { useToast } from '../../context/ToastContext';
import { FiCalendar, FiClock, FiUser, FiActivity, FiCheckCircle, FiPhone, FiMail, FiHeart, FiLogIn } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import './PatientBooking.css';
const BookAppointment = () => {
    const { user } = useAuth();
    const { clinicId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isWalkinRoute = window.location.pathname.includes('/walkin/');
    // Always start at step 0 (landing page) to show all steps
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [clinics, setClinics] = useState([]);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [selectedClinicId, setSelectedClinicId] = useState(clinicId ? Number(clinicId) : null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        doctorId: '',
        service: '',
        date: '',
        time: '',
        notes: ''
    });
    // Fetch clinics user is registered in (or all clinics for simplicity if they can book anywhere)
    // For now, let's assume we need to know which clinic to book in.
    // In a real app, we might get this from the patient's records.
    const fetchPublicClinics = async () => {
        setLoading(true);
        try {
            const res = await patientService.getPublicClinics();
            setClinics(res.data || []);
        }
        catch (error) {
            console.error('Failed to fetch public clinics', error);
            toast.error('Could not load available clinics.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const initBooking = async () => {
            // Always fetch public clinics for clinic selection dropdown
            await fetchPublicClinics();
            // If clinicId is provided in URL, pre-load clinic details (but still show all steps)
            if (clinicId) {
                try {
                    const res = await patientService.getClinicBookingDetails(Number(clinicId));
                    setBookingDetails(res.data);
                    setSelectedClinicId(Number(clinicId));
                    // Don't change step - keep it at 0 to show all steps
                }
                catch (error) {
                    console.error('Failed to pre-fetch clinic details', error);
                    toast.error('Failed to load clinic details');
                }
            }
        };
        initBooking();
    }, [clinicId]);
    // Pre-fill user data when logged in and on booking form (except for walk-in route)
    useEffect(() => {
        if (user && step === 2 && !formData.name && !isWalkinRoute) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user, step, isWalkinRoute]);
    // Fetch time slots when doctor and date are selected
    useEffect(() => {
        const fetchTimeSlots = async () => {
            if (formData.doctorId && formData.date && selectedClinicId && bookingDetails) {
                // Time slots are already in bookingDetails, but we can refresh if needed
                // For now, time slots are static from booking config
            }
        };
        fetchTimeSlots();
    }, [formData.doctorId, formData.date, selectedClinicId, bookingDetails]);
    const handleClinicChange = async (clinicId) => {
        if (!clinicId) {
            setBookingDetails(null);
            setSelectedClinicId(null);
            setFormData(prev => ({ ...prev, doctorId: '', time: '', date: '' }));
            return;
        }
        setLoading(true);
        setSelectedClinicId(clinicId);
        try {
            const res = await patientService.getClinicBookingDetails(clinicId);
            setBookingDetails(res.data);
            // Reset doctor and time when clinic changes
            setFormData(prev => ({ ...prev, doctorId: '', time: '' }));
        }
        catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch clinic details');
            setBookingDetails(null);
        }
        finally {
            setLoading(false);
        }
    };
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        // Validate clinic selection
        if (!selectedClinicId) {
            toast.error('Please select a clinic');
            return;
        }
        // Validation - If walk-in route, always require full data even if someone is logged in
        const requiredFields = (user && !isWalkinRoute)
            ? ['doctorId', 'date', 'time']
            : ['name', 'email', 'phone', 'doctorId', 'date', 'time'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                toast.error(`Please fill the ${field} field`);
                return;
            }
        }
        setLoading(true);
        try {
            if (user && !isWalkinRoute) {
                // Logged in booking (regular portal flow)
                await patientService.bookAppointment({
                    clinicId: selectedClinicId,
                    ...formData,
                    doctorId: Number(formData.doctorId),
                    source: 'Booking Link'
                });
            }
            else {
                // Public booking or Walk-in specific route (Quick Registration)
                await patientService.publicBookAppointment({
                    clinicId: selectedClinicId,
                    ...formData,
                    doctorId: Number(formData.doctorId),
                    source: isWalkinRoute ? 'Walk-in' : 'Booking Link'
                });
            }
            setStep(3);
            toast.success('Appointment booked successfully!');
        }
        catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
        finally {
            setLoading(false);
        }
    };
    if (step === 0) {
        return (<div className="booking-landing-wrapper fade-in">
                <div className="landing-content text-center">
                    <h1 className="booking-title">Appointment Booking</h1>
                    <p className="booking-subtitle">Book a consultation with our experienced medical team.</p>

                    {bookingDetails?.clinicName && (<div className="clinic-badge-mini">
                            At <strong>{bookingDetails.clinicName}</strong>
                        </div>)}

                    <div className="selection-grid landing-cards" style={{ justifyContent: 'center' }}>
                        <div className="choice-card" onClick={() => {
                // Always go to step 1 (clinic selection) to show all steps
                setStep(1);
            }}>
                            <div className="choice-icon"><FiUser /></div>
                            <h3>Book Appointment</h3>
                            <p>Fill in your details and request your appointment.</p>
                            <button className="btn-selection-solid">Continue</button>
                        </div>

                        <div className="choice-card" onClick={() => {
                // Navigate to login page
                navigate('/login');
            }}>
                            <div className="choice-icon"><FiLogIn /></div>
                            <h3>Already a Patient?</h3>
                            <p>Sign in to access your account and manage appointments.</p>
                            <button className="btn-selection-solid">Login</button>
                        </div>
                    </div>
                </div>
            </div>);
    }
    if (step === 1) {
        return (<div className="booking-form-area fade-in">
                <div className="page-header d-flex justify-content-between align-items-center">
                    <div>
                        <h1>Book an Appointment</h1>
                        <p>{isWalkinRoute ? 'Please enter patient details to schedule an appointment' : `Welcome, <strong>${user?.name || 'Guest'}</strong>. Please select a clinic facility.`}</p>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => setStep(0)} style={{ width: 'fit-content' }}>
                        ← Back
                    </button>
                </div>

                <div className="selection-grid" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                    {clinics.length > 0 ? clinics.map((clinic) => (<div key={clinic.id} className="choice-card" onClick={() => {
                    handleClinicChange(clinic.id);
                    setStep(2);
                }}>
                            <div className="choice-icon">
                                {clinic.logo ? <img src={clinic.logo} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }}/> : <FiActivity />}
                            </div>
                            <div>
                                <h3>{clinic.name}</h3>
                                <p>{clinic.location || 'Medical Facility'}</p>
                            </div>
                            <button className="btn-selection-solid">Select Clinic</button>
                        </div>)) : (<div className="p-20 text-center w-full card" style={{ gridColumn: '1 / -1' }}>
                            <p>{loading ? 'Searching for clinics...' : 'No clinics available at the moment.'}</p>
                        </div>)}
                </div>
            </div>);
    }
    if (step === 2) {
        // Show loading if booking details are not yet loaded
        if (!bookingDetails && loading) {
            return (<div className="patient-booking-form-page">
                    <div className="patient-booking-header">
                        <h1 className="patient-booking-title">Appointment Booking</h1>
                        <p className="patient-booking-subtitle">Loading clinic details...</p>
                    </div>
                </div>);
        }
        return (<div className="patient-booking-form-page">
                <div className="patient-booking-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h1 className="patient-booking-title">Appointment Booking</h1>
                            <p className="patient-booking-subtitle">Book a consultation with our experienced medical team.</p>
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={() => setStep(1)} style={{ width: 'fit-content' }}>
                            ← Back
                        </button>
                    </div>
                </div>

                <div className="patient-booking-form-card">
                    <form onSubmit={handleBookingSubmit} className="patient-booking-form-grid">
                        {/* Clinic Selection - Full Width */}
                        <div className="patient-booking-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="patient-booking-label">
                                <FiActivity className="patient-booking-label-icon"/>
                                Select Clinic <span className="patient-booking-required">*</span>
                            </label>
                            <div className="patient-booking-input-wrapper">
                                <select required value={selectedClinicId || ''} onChange={e => handleClinicChange(Number(e.target.value))} className="patient-booking-select">
                                    <option value="">Select a Clinic</option>
                                    {clinics.map((clinic) => (<option key={clinic.id} value={clinic.id}>
                                            {clinic.name} {clinic.location ? `- ${clinic.location}` : ''}
                                        </option>))}
                                </select>
                            </div>
                        </div>

                        {/* Left Column */}
                        <div className="patient-booking-form-left">
                            {/* Patient Full Name */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiUser className="patient-booking-label-icon"/>
                                    Patient Full Name <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper">
                                    <input type="text" required placeholder="Enter your full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="patient-booking-input" autoComplete="off"/>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiPhone className="patient-booking-label-icon"/>
                                    Phone Number <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper" style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.5rem' }}>
                                    <div className="phone-code-container phone-code-container-styled">
                                        <div className="phone-code-display">
                                            {formData.phone.includes(' ') ? formData.phone.split(' ')[0] : '+971'}
                                        </div>
                                        <select required value={formData.phone.includes(' ') ? formData.phone.split(' ')[0] : '+971'} onChange={e => {
                const currentNumber = formData.phone.includes(' ')
                    ? formData.phone.split(' ').slice(1).join(' ')
                    : formData.phone;
                setFormData({ ...formData, phone: `${e.target.value} ${currentNumber}` });
            }} className="patient-booking-select">
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
                                    <input type="tel" required placeholder="Mobile number" value={formData.phone.includes(' ') ? (formData.phone.split(' ')[0] === '+971' && !formData.phone.includes(' ') ? formData.phone : formData.phone.split(' ').slice(1).join(' ')) : formData.phone.replace('+971', '').trim()} onChange={e => {
                const currentCode = formData.phone.includes(' ')
                    ? formData.phone.split(' ')[0]
                    : '+971';
                setFormData({ ...formData, phone: `${currentCode} ${e.target.value}` });
            }} className="patient-booking-input" autoComplete="off"/>
                                </div>
                            </div>

                            {/* Visit Date */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiCalendar className="patient-booking-label-icon"/>
                                    Visit Date <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper">
                                    <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => {
                setFormData({ ...formData, date: e.target.value, time: '' });
            }} className="patient-booking-input"/>
                                    <FiCalendar className="patient-booking-date-icon"/>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="patient-booking-form-right">
                            {/* Email Address */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiMail className="patient-booking-label-icon"/>
                                    Email Address <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper">
                                    <input type="email" required placeholder="email@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="patient-booking-input" autoComplete="off"/>
                                </div>
                            </div>

                            {/* Create Password (New) */}
                            {(!user && !isWalkinRoute) && (<div className="patient-booking-form-group">
                                    <label className="patient-booking-label">
                                        <FiLogIn className="patient-booking-label-icon"/>
                                        Create Password <span className="patient-booking-required">*</span>
                                    </label>
                                    <div className="patient-booking-input-wrapper">
                                        <input type="password" required placeholder="Create a password for your account" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="patient-booking-input" autoComplete="new-password"/>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        You will use this to login and check your reports later.
                                    </p>
                                </div>)}

                            {/* Choose Specialist */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiHeart className="patient-booking-label-icon"/>
                                    Choose Specialist <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper">
                                    <select required value={formData.doctorId} onChange={e => {
                setFormData({ ...formData, doctorId: e.target.value, time: '' });
            }} disabled={!selectedClinicId || !bookingDetails} className="patient-booking-select">
                                        <option value="">
                                            {!selectedClinicId
                ? 'Select a clinic first'
                : !bookingDetails
                    ? 'Loading doctors...'
                    : bookingDetails?.doctors && bookingDetails.doctors.length > 0
                        ? 'Select a Doctor'
                        : 'No doctors available'}
                                        </option>
                                        {bookingDetails?.doctors && bookingDetails.doctors.length > 0 && (bookingDetails.doctors.map((dr) => (<option key={dr.id} value={dr.id}>
                                                    {dr.name} {dr.specialty ? `- ${dr.specialty}` : ''}
                                                </option>)))}
                                    </select>
                                </div>
                            </div>

                            {/* Preferred Time */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiClock className="patient-booking-label-icon"/>
                                    Preferred Time <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper">
                                    <select required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} disabled={!formData.date || !formData.doctorId} className="patient-booking-select">
                                        <option value="">
                                            {!formData.date || !formData.doctorId
                ? 'Select provider and date first'
                : bookingDetails?.timeSlots && bookingDetails.timeSlots.length > 0
                    ? 'Choose a time slot'
                    : 'No time slots available'}
                                        </option>
                                        {formData.date && formData.doctorId && bookingDetails?.timeSlots && bookingDetails.timeSlots.length > 0 && (bookingDetails.timeSlots.map((t) => (<option key={t} value={t}>{t}</option>)))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="patient-booking-submit-wrapper">
                            <button type="submit" className="patient-booking-submit-btn" disabled={loading}>
                                {loading ? ('Processing...') : (<>
                                        <FiCheckCircle className="patient-booking-submit-icon"/>
                                        <span>Confirm Appointment Request</span>
                                    </>)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>);
    }
    if (step === 3) {
        return (<div className="confirmation-view fade-in">
                <div className="success-card text-center">
                    <div className="success-icon-large">
                        <FiCheckCircle />
                    </div>
                    <h2 className="mt-lg">Booking Successful!</h2>
                    <p className="text-secondary mt-md">
                        Your appointment has been requested and is currently <strong>Pending</strong>.
                        The clinic will review and confirm your booking shortly.
                    </p>

                    <div className="booking-summary card mt-xl">
                        <div className="summary-item">
                            <span className="label">Doctor</span>
                            <span className="value">
                                {bookingDetails?.doctors?.find((d) => d.id === Number(formData.doctorId))?.name}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Date & Time</span>
                            <span className="value">{formData.date} at {formData.time}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Service</span>
                            <span className="value">{formData.service}</span>
                        </div>
                    </div>

                </div>
            </div>);
    }
    return null;
};
export default BookAppointment;
