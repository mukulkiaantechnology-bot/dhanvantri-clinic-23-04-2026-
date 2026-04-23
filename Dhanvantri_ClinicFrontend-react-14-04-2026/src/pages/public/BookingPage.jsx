import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { FiCalendar, FiUser, FiMail, FiPhone, FiCheck } from 'react-icons/fi';
import './BookingPage.css';
const BookingPage = () => {
    const { clinicId } = useParams();
    const { clinics, addBooking } = useApp();
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        reason: ''
    });
    const clinic = clinics.find(c => c.id === parseInt(clinicId || '0')) || clinics[0];
    const handleSubmit = (e) => {
        e.preventDefault();
        addBooking({
            ...bookingData,
            patientId: 1, // Simulated new patient or existing
            clinicId: clinic.id,
            doctorId: 5, // Default doctor
            source: 'Online'
        });
        setStep(3);
    };
    return (<div className="booking-page-public">
            <div className="booking-container fade-in-up">
                <div className="booking-header">
                    <h1>Book Appointment</h1>
                    {clinic && <p>Facility: <strong>{clinic.name}</strong></p>}
                </div>

                {step === 1 && (<div className="step-content">
                        <h2>Select Date & Time</h2>
                        <div className="form-group mt-md">
                            <label><FiCalendar className="mr-xs"/> Date</label>
                            <input type="date" className="w-full" value={bookingData.date} onChange={e => setBookingData({ ...bookingData, date: e.target.value })}/>
                        </div>
                        <div className="time-grid mt-md">
                            <button className="time-pill" onClick={() => { setBookingData({ ...bookingData, time: '09:00 AM' }); setStep(2); }}>09:00 AM</button>
                            <button className="time-pill" onClick={() => { setBookingData({ ...bookingData, time: '10:30 AM' }); setStep(2); }}>10:30 AM</button>
                            <button className="time-pill" onClick={() => { setBookingData({ ...bookingData, time: '01:00 PM' }); setStep(2); }}>01:00 PM</button>
                            <button className="time-pill" onClick={() => { setBookingData({ ...bookingData, time: '03:15 PM' }); setStep(2); }}>03:15 PM</button>
                        </div>
                    </div>)}

                {step === 2 && (<form onSubmit={handleSubmit} className="step-content">
                        <h2>Your Information</h2>
                        <div className="form-group mt-md">
                            <label><FiUser className="mr-xs"/> Full Name</label>
                            <input type="text" required value={bookingData.name} onChange={e => setBookingData({ ...bookingData, name: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label><FiMail className="mr-xs"/> Email</label>
                            <input type="email" required value={bookingData.email} onChange={e => setBookingData({ ...bookingData, email: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label><FiPhone className="mr-xs"/> Phone</label>
                            <input type="text" required value={bookingData.phone} onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Reason for Visit</label>
                            <textarea rows={3} value={bookingData.reason} onChange={e => setBookingData({ ...bookingData, reason: e.target.value })}></textarea>
                        </div>
                        <div className="actions mt-lg">
                            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                            <button type="submit" className="btn btn-primary">Confirm Booking</button>
                        </div>
                    </form>)}

                {step === 3 && (<div className="step-content text-center">
                        <div className="success-icon mb-md"><FiCheck size={48}/></div>
                        <h2>Booking Confirmed!</h2>
                        <p>We've received your appointment request for {bookingData.date} at {bookingData.time}.</p>
                        <p className="mt-md text-secondary">A confirmation email has been sent to {bookingData.email}.</p>
                        <button className="btn btn-primary mt-lg" onClick={() => window.location.href = '/'}>Done</button>
                    </div>)}
            </div>
        </div>);
};
export default BookingPage;
