import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patient.service';
import { useToast } from '../../context/ToastContext';
import { FiCalendar, FiUser, FiCheckCircle, FiActivity, FiMapPin } from 'react-icons/fi';
import './PatientBooking.css';
const ClinicPublicBooking = () => {
    const { subdomain } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [clinic, setClinic] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1); // 1: Form, 2: Success
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        doctorId: '',
        date: '',
        time: '',
        notes: ''
    });
    useEffect(() => {
        const fetchClinicData = async () => {
            if (!subdomain)
                return;
            try {
                const res = await patientService.getPublicClinic(subdomain);
                setClinic(res.data);
                // Once clinic is found, fetch its doctors
                const doctorsRes = await patientService.getPublicDoctors(res.data.id);
                setDoctors(doctorsRes.data);
            }
            catch (error) {
                console.error('Failed to fetch clinic details', error);
                toast.error('Clinic not found or booking is currently unavailable.');
                navigate('/');
            }
            finally {
                setLoading(false);
            }
        };
        fetchClinicData();
    }, [subdomain]);
    useEffect(() => {
        const fetchSlots = async () => {
            if (formData.doctorId && formData.date) {
                try {
                    const res = await patientService.getPublicAvailability(Number(formData.doctorId), formData.date);
                    setSlots(res.data.timeSlots || []);
                }
                catch (error) {
                    toast.error('Could not load time slots');
                }
            }
        };
        fetchSlots();
    }, [formData.doctorId, formData.date]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await patientService.submitPublicBooking({
                ...formData,
                clinicId: clinic.id,
                doctorId: Number(formData.doctorId)
            });
            setBookingStep(2);
            toast.success('Appointment booked successfully!');
        }
        catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading && !clinic) {
        return <div className="loading-screen text-center p-50"><h2>Connecting to {subdomain}...</h2></div>;
    }
    if (bookingStep === 2) {
        return (<div className="booking-success-wrapper fade-in">
                <div className="success-content text-center card p-40">
                    {clinic?.logo && (<img src={clinic.logo} alt={clinic.name} style={{ height: '60px', objectFit: 'contain', display: 'block', margin: '0 auto 1rem' }}/>)}
                    <FiCheckCircle size={80} color="var(--color-success)"/>
                    <h1 className="mt-20">Booking Confirmed!</h1>
                    <p className="text-secondary mt-10">
                        Thank you, <strong>{formData.name}</strong>. Your appointment request has been sent to <strong>{clinic.name}</strong>.
                        A confirmation will be sent to <strong>{formData.email}</strong> shortly.
                    </p>
                    <div className="summary-box mt-30 p-20 bg-light rounded text-left">
                        <p><strong>Doctor:</strong> {doctors.find(d => d.id === Number(formData.doctorId))?.user?.name}</p>
                        <p><strong>Date:</strong> {formData.date}</p>
                        <p><strong>Time:</strong> {formData.time}</p>
                    </div>
                    <button onClick={() => navigate('/')} className="btn-no-hover" style={{
                marginTop: '2rem',
                padding: '0.8rem 2.5rem',
                background: 'var(--primary-clinic)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                margin: '1.5rem auto 0'
            }}>
                        Back to Home
                    </button>
                </div>
            </div>);
    }
    return (<div className="public-booking-container" style={{ '--primary-clinic': clinic.brandingColor || '#2563eb' }}>
            <div className="public-booking-header text-center">
                {clinic.logo ? (<img src={clinic.logo} alt={clinic.name || 'Clinic Logo'} className="clinic-logo-large"/>) : (<div className="clinic-logo-placeholder"><FiActivity size={40}/></div>)}
                <h1 className="clinic-name-heavy">{clinic.name || 'Our Clinic'}</h1>
                <p className="clinic-location-text"><FiMapPin /> {clinic.location || 'Location not available'}</p>
            </div>

            <div className="booking-card-main card shadow-lg">
                <div className="card-header-styled">
                    <h2>Book Your Appointment</h2>
                    <p>Experience world-class healthcare at your fingertips.</p>
                </div>

                <form onSubmit={handleSubmit} className="booking-form-grid-styled p-30">
                    <div className="form-section">
                        <h3><FiUser /> Personal Details</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" required className="form-control" placeholder="Enter your full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}/>
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input type="email" required className="form-control" placeholder="your@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}/>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.5rem' }}>
                                    <div className="phone-code-container phone-code-container-styled">
                                        <div className="phone-code-display">
                                            {formData.phone.split(' ')[0] || '+971'}
                                        </div>
                                        <select required className="patient-booking-select" value={formData.phone.split(' ')[0] || '+971'} onChange={e => {
            const currentNumber = formData.phone.includes(' ') ? formData.phone.split(' ').slice(1).join(' ') : formData.phone;
            setFormData({ ...formData, phone: `${e.target.value} ${currentNumber}` });
        }}>
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
                                    <input type="tel" required className="form-control" placeholder="Mobile number" value={formData.phone.includes(' ') ? formData.phone.split(' ').slice(1).join(' ') : formData.phone} onChange={e => {
            const currentCode = formData.phone.includes(' ') ? formData.phone.split(' ')[0] : '+971';
            setFormData({ ...formData, phone: `${currentCode} ${e.target.value}` });
        }}/>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Create Password (to check reports later) *</label>
                                <input type="password" required className="form-control" placeholder="Minimum 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}/>
                            </div>
                        </div>
                    </div>

                    <div className="form-section mt-30">
                        <h3><FiCalendar /> Appointment Info</h3>
                        <div className="form-group">
                            <label>Choose Specialist *</label>
                            <select required className="form-control" value={formData.doctorId} onChange={e => setFormData({ ...formData, doctorId: e.target.value })}>
                                <option value="">Select a Doctor</option>
                                {doctors.map(dr => (<option key={dr.id} value={dr.id}>
                                        {(dr.user?.name || dr.name || 'Doctor')} - {dr.specialty || dr.department || 'General Practitioner'}
                                    </option>))}
                            </select>
                        </div>
                        <div className="form-row mt-20">
                            <div className="form-group">
                                <label>Preferred Date *</label>
                                <input type="date" required className="form-control" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}/>
                            </div>
                            <div className="form-group">
                                <label>Preferred Time *</label>
                                <select required className="form-control" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} disabled={!formData.date || !formData.doctorId}>
                                    <option value="">{formData.date ? (slots.length > 0 ? 'Select a Time' : 'No slots available') : 'Choose Date First'}</option>
                                    {slots.map(slot => (<option key={slot} value={slot}>{slot}</option>))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group mt-20">
                            <label>Notes (Optional)</label>
                            <textarea className="form-control" placeholder="Any specific concerns or details..." rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                        </div>
                    </div>

                    <div className="form-actions mt-40">
                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                            {loading ? 'Processing...' : 'Secure My Appointment'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="public-footer text-center mt-40 pb-40">
                <p className="text-secondary">© 2026 {clinic.name || 'Dhanwantri Hospital'}. Powered by Dhanwantri Hospital.</p>
            </div>
        </div>);
};
export default ClinicPublicBooking;
