import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { useToast } from '../../context/ToastContext';
import { FiCalendar, FiClock, FiUser, FiActivity, FiCheckCircle, FiPhone, FiMail, FiHeart } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import './PatientBooking.css';
const BookAppointment = () => {
    const { user, handleRedirectByRole } = useAuth();
    const { clinicId } = useParams();
    const toast = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(2); // Start directly at booking form (Step 2)
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
            setClinics(res.data?.data || res.data || []);
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
            // If clinicId is provided in URL (from /book/:clinicId), pre-load clinic details
            if (clinicId) {
                try {
                    const res = await patientService.getClinicBookingDetails(Number(clinicId));
                    setBookingDetails(res.data?.data || res.data || null);
                    setSelectedClinicId(Number(clinicId));
                }
                catch (error) {
                    console.error('Failed to pre-fetch clinic details', error);
                    toast.error('Failed to load clinic details');
                }
            }
        };
        initBooking();
    }, [clinicId]);
    // Pre-fill user data when logged in and on booking form
    useEffect(() => {
        if (user && step === 2 && !formData.name) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user, step]);
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
            setBookingDetails(res.data?.data || res.data || null);
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
        // Validation
        const requiredFields = user
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
            // Use public-book API for all bookings (handles both logged-in and guest users)
            await patientService.publicBookAppointment({
                clinicId: selectedClinicId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                doctorId: Number(formData.doctorId),
                date: formData.date,
                time: formData.time,
                service: formData.service || 'Consultation',
                notes: formData.notes || '',
                source: 'Patient Portal'
            });
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
    // Only show step 2 (booking form)
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
                    <h1 className="patient-booking-title">Appointment Booking</h1>
                    <p className="patient-booking-subtitle">Book a consultation with our experienced medical team.</p>
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
                                    <input type="text" required placeholder="Enter your full name" value={formData.name || (user?.name || '')} onChange={e => setFormData({ ...formData, name: e.target.value })} className="patient-booking-input"/>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="patient-booking-form-group">
                                <label className="patient-booking-label">
                                    <FiPhone className="patient-booking-label-icon"/>
                                    Phone Number <span className="patient-booking-required">*</span>
                                </label>
                                <div className="patient-booking-input-wrapper phone-grid-responsive">
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
            }} className="patient-booking-input"/>
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
                                    <input type="email" required placeholder="email@example.com" value={formData.email || (user?.email || '')} onChange={e => setFormData({ ...formData, email: e.target.value })} className="patient-booking-input"/>
                                </div>
                            </div>

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

                    <button className="btn btn-primary btn-lg mt-xl w-full btn-no-hover" onClick={() => {
                if (user) {
                    handleRedirectByRole(user.role || (user.roles ? user.roles[0] : 'PATIENT'));
                }
                else {
                    navigate('/login');
                }
            }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>);
    }
    return null;
};
export default BookAppointment;
