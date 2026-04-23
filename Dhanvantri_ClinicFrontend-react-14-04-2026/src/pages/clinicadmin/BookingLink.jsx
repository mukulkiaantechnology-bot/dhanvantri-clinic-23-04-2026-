import { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiExternalLink, FiShare2, FiToggleLeft, FiToggleRight, FiCalendar, FiClock, FiUsers, FiSave, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/Modal';
import './BookingLink.css';
const BookingLink = () => {
    const { selectedClinic } = useAuth();
    const { staff, clinics, saveBookingConfig, bookingConfig } = useApp();
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Modal states
    const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [doctorScheduleModal, setDoctorScheduleModal] = useState(null);
    const [timeSelector, setTimeSelector] = useState({
        hour: '09',
        minute: '00',
        period: 'AM'
    });
    const [newService, setNewService] = useState('');
    const [timeSlotError, setTimeSlotError] = useState('');
    // Get current clinic
    const currentClinic = clinics.find((c) => c.id === selectedClinic?.id) || selectedClinic;
    // Get clinic doctors
    const clinicDoctors = staff.filter(s => (s.clinicId === currentClinic?.id || s.clinics?.includes(currentClinic?.id)) &&
        ((s.role || '').toUpperCase() === 'DOCTOR' || (Array.isArray(s.roles) && s.roles.map(r => String(r).toUpperCase()).includes('DOCTOR'))) &&
        s.status === 'active');
    const [config, setConfig] = useState({
        enabled: true,
        selectedDoctors: [],
        services: [],
        timeSlots: [],
        offDays: [0, 6],
        holidays: [],
        doctorAvailability: {}
    });
    // Load config from API only (backend returns default when clinic has no saved config)
    useEffect(() => {
        if (bookingConfig && typeof bookingConfig === 'object') {
            setConfig({
                enabled: bookingConfig.enabled !== undefined ? bookingConfig.enabled : true,
                selectedDoctors: Array.isArray(bookingConfig.selectedDoctors) ? bookingConfig.selectedDoctors : [],
                services: Array.isArray(bookingConfig.services) ? bookingConfig.services : [],
                timeSlots: Array.isArray(bookingConfig.timeSlots) ? bookingConfig.timeSlots : [],
                offDays: Array.isArray(bookingConfig.offDays) ? bookingConfig.offDays : [0, 6],
                holidays: Array.isArray(bookingConfig.holidays) ? bookingConfig.holidays : [],
                doctorAvailability: bookingConfig.doctorAvailability || {}
            });
        }
    }, [bookingConfig]);
    // Use subdomain if available, otherwise ID. Backend matches either.
    // Ensure we don't generate a link with 'undefined' or 'clinic' placeholder if possible
    const uniqueIdentifier = currentClinic?.subdomain || currentClinic?.id;
    const bookingUrl = uniqueIdentifier ? `${window.location.origin}/book/${uniqueIdentifier}` : '';
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveBookingConfig(config);
            alert('Configuration saved successfully!');
        }
        catch (error) {
            console.error('Failed to save config:', error);
            alert('Failed to save configuration.');
        }
        finally {
            setIsSaving(false);
        }
    };
    const toggleBookingEnabled = () => {
        setConfig(prev => ({
            ...prev,
            enabled: !prev.enabled
        }));
    };
    const copyToClipboard = () => {
        navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const shareOnWhatsApp = () => {
        const message = `Book your appointment at ${currentClinic?.name}: ${bookingUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };
    // const getEmbedCode = () => {
    //     return `<iframe src="${bookingUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    // };
    // const copyEmbedCode = () => {
    //     navigator.clipboard.writeText(getEmbedCode());
    //     alert('Embed code copied to clipboard!');
    // };
    const toggleDoctor = (doctorId) => {
        setConfig(prev => ({
            ...prev,
            selectedDoctors: prev.selectedDoctors.includes(doctorId)
                ? prev.selectedDoctors.filter(id => id !== doctorId)
                : [...prev.selectedDoctors, doctorId]
        }));
    };
    const getDoctorAvailability = (doctorId) => {
        const d = config.doctorAvailability[String(doctorId)];
        return {
            offDays: d?.offDays ?? config.offDays,
            timeSlots: (d?.timeSlots?.length ? d.timeSlots : config.timeSlots) || []
        };
    };
    const setDoctorAvailability = (doctorId, data) => {
        setConfig(prev => ({
            ...prev,
            doctorAvailability: {
                ...prev.doctorAvailability,
                [String(doctorId)]: {
                    ...(prev.doctorAvailability[String(doctorId)] || {}),
                    ...data
                }
            }
        }));
    };
    const toggleDoctorOffDay = (doctorId, day) => {
        const curr = getDoctorAvailability(doctorId).offDays;
        const next = curr.includes(day) ? curr.filter(d => d !== day) : [...curr, day];
        setDoctorAvailability(doctorId, { offDays: next });
    };
    const addDoctorTimeSlot = (doctorId, slot) => {
        const curr = getDoctorAvailability(doctorId).timeSlots;
        if (curr.includes(slot))
            return;
        setDoctorAvailability(doctorId, { timeSlots: [...curr, slot].sort() });
    };
    const removeDoctorTimeSlot = (doctorId, slot) => {
        const curr = getDoctorAvailability(doctorId).timeSlots;
        setDoctorAvailability(doctorId, { timeSlots: curr.filter(s => s !== slot) });
    };
    const toggleOffDay = (day) => {
        setConfig(prev => ({
            ...prev,
            offDays: prev.offDays.includes(day)
                ? prev.offDays.filter(d => d !== day)
                : [...prev.offDays, day]
        }));
    };
    // Time Slot Management
    const formatTime = (time) => {
        if (!time)
            return '';
        const [hour, minute] = time.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 || 12;
        const padHour = formattedHour < 10 ? `0${formattedHour}` : formattedHour;
        return `${padHour}:${minute} ${ampm}`;
    };
    const addTimeSlot = () => {
        setTimeSlotError('');
        let h = parseInt(timeSelector.hour, 10);
        if (timeSelector.period === 'PM' && h < 12)
            h += 12;
        if (timeSelector.period === 'AM' && h === 12)
            h = 0;
        const hh = h < 10 ? `0${h}` : h;
        const slot = `${hh}:${timeSelector.minute}`;
        if (config.timeSlots.includes(slot)) {
            setTimeSlotError('This time slot already exists');
            return;
        }
        setConfig(prev => ({
            ...prev,
            timeSlots: [...prev.timeSlots, slot].sort()
        }));
        setIsTimeSlotModalOpen(false);
    };
    const removeTimeSlot = (slot) => {
        setConfig(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(s => s !== slot)
        }));
    };
    // Service Management
    const addService = () => {
        if (!newService.trim()) {
            alert('Please enter a service name');
            return;
        }
        if (config.services.includes(newService.trim())) {
            alert('This service already exists');
            return;
        }
        setConfig(prev => ({
            ...prev,
            services: [...prev.services, newService.trim()]
        }));
        setNewService('');
        setIsServiceModalOpen(false);
    };
    const removeService = (service) => {
        setConfig(prev => ({
            ...prev,
            services: prev.services.filter(s => s !== service)
        }));
    };
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (<div className="booking-link-page">
            <div className="page-header">
                <div>
                    <h1>Booking Link Generator</h1>
                    <p>Configure and share your clinic's online booking link with patients.</p>
                </div>
                <button className={`btn ${config.enabled ? 'btn-danger' : 'btn-success'} btn-with-icon`} onClick={toggleBookingEnabled} style={{ marginLeft: 'auto' }}>
                    {config.enabled ? <FiToggleRight /> : <FiToggleLeft />}
                    <span>{config.enabled ? 'Disable Booking' : 'Enable Booking'}</span>
                </button>
            </div>

            {/* Booking Link Card */}
            <div className="booking-card card">
                <div className={`card-header ${config.enabled ? 'cursor-pointer' : ''}`} onClick={() => config.enabled && bookingUrl && window.open(bookingUrl, '_blank')} title={config.enabled ? "Click to open booking link" : "Booking disabled"}>
                    <div className="link-icon">
                        <FiShare2 size={32}/>
                    </div>
                    <div>
                        <h3>Your Unique Booking Link</h3>
                        <p>Share this link to allow patients to book appointments online</p>
                    </div>
                    <span className={`status-pill ${config.enabled ? 'active' : 'inactive'}`}>
                        {config.enabled ? 'Active' : 'Disabled'}
                    </span>
                </div>

                <div className="url-container">
                    <div className="url-box">{bookingUrl || 'Loading unique link...'}</div>
                    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyToClipboard} disabled={!bookingUrl || !config.enabled}>
                        {copied ? <FiCheck /> : <FiCopy />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>

                <div className="link-actions">
                    <button className="btn btn-secondary btn-with-icon" onClick={() => bookingUrl && window.open(bookingUrl, '_blank')} disabled={!bookingUrl || !config.enabled}>
                        <FiExternalLink />
                        <span>Preview Link</span>
                    </button>
                    <button className="btn btn-secondary btn-with-icon" onClick={shareOnWhatsApp} disabled={!bookingUrl || !config.enabled}>
                        <FiShare2 />
                        <span>Share on WhatsApp</span>
                    </button>
                    {/* <button className="btn btn-secondary btn-with-icon" onClick={copyEmbedCode}>
            <FiCopy />
            <span>Get Embed Code</span>
        </button> */}
                </div>
            </div>

            {/* Configuration Sections */}
            <div className="config-grid">
                {/* Doctor Selection */}
                <div className="config-card card">
                    <div className="config-header">
                        <FiUsers />
                        <h3>Available Doctors</h3>
                    </div>
                    <p className="config-desc">Select which doctors patients can book with</p>
                    <div className="doctor-list">
                        {clinicDoctors.length > 0 ? clinicDoctors.map((doctor) => (<div key={doctor.id} className="doctor-row-with-schedule">
                                <label className="checkbox-item" style={{ flex: 1 }}>
                                    <input type="checkbox" checked={config.selectedDoctors.includes(doctor.id)} onChange={() => toggleDoctor(doctor.id)}/>
                                    <span>{doctor.name}</span>
                                    <span className="specialty">{doctor.specialty || doctor.department || 'General'}</span>
                                </label>
                                {config.selectedDoctors.includes(doctor.id) && (<button type="button" className="btn btn-sm btn-secondary" onClick={() => setDoctorScheduleModal({ doctor })}>
                                        Set schedule
                                    </button>)}
                            </div>)) : (<p className="empty-message">No doctors available</p>)}
                    </div>
                </div>

                {/* Time Slots */}
                <div className="config-card card">
                    <div className="config-header">
                        <FiClock />
                        <h3>Time Slots</h3>
                    </div>
                    <p className="config-desc">Configure available appointment times</p>
                    <div className="time-slots-grid">
                        {config.timeSlots.map((slot, index) => (<div key={index} className="time-slot-chip">
                                {formatTime(slot)}
                                <button className="remove-chip-btn" onClick={() => removeTimeSlot(slot)} title="Remove">
                                    <FiX size={14}/>
                                </button>
                            </div>))}
                    </div>
                    <button className="btn btn-sm btn-secondary mt-md" onClick={() => setIsTimeSlotModalOpen(true)}>
                        + Add Time Slot
                    </button>
                </div>

                {/* Off Days */}
                <div className="config-card card">
                    <div className="config-header">
                        <FiCalendar />
                        <h3>Off Days</h3>
                    </div>
                    <p className="config-desc">Select days when clinic is closed</p>
                    <div className="days-grid">
                        {days.map((day, index) => (<label key={index} className={`day-chip ${config.offDays.includes(index) ? 'off' : ''}`}>
                                <input type="checkbox" checked={config.offDays.includes(index)} onChange={() => toggleOffDay(index)}/>
                                <span>{day.substring(0, 3)}</span>
                            </label>))}
                    </div>
                </div>

                {/* Services */}
                <div className="config-card card">
                    <div className="config-header">
                        <FiShare2 />
                        <h3>Services</h3>
                    </div>
                    <p className="config-desc">Services available for booking</p>
                    <div className="services-list">
                        {config.services.map((service, index) => (<div key={index} className="service-chip">
                                {service}
                                <button className="remove-chip-btn" onClick={() => removeService(service)} title="Remove">
                                    <FiX size={14}/>
                                </button>
                            </div>))}
                    </div>
                    <button className="btn btn-sm btn-secondary mt-md" onClick={() => setIsServiceModalOpen(true)}>
                        + Add Service
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="save-section">
                <button className="btn btn-primary btn-lg btn-no-hover" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <FiCheck /> : <FiSave />}
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            {/* Add Time Slot Modal */}
            <Modal isOpen={isTimeSlotModalOpen} onClose={() => {
            setIsTimeSlotModalOpen(false);
            setTimeSlotError('');
        }} title="Add Time Slot">
                <div className="modal-form">
                    <div className="form-group">
                        <label>Select Time</label>
                        <div className="time-selector-inputs">
                            <select value={timeSelector.hour} onChange={(e) => setTimeSelector(prev => ({ ...prev, hour: e.target.value }))} className="time-select">
                                {[...Array(12)].map((_, i) => {
            const h = (i + 1).toString().padStart(2, '0');
            return <option key={h} value={h}>{h}</option>;
        })}
                            </select>
                            <span className="time-separator">:</span>
                            <select value={timeSelector.minute} onChange={(e) => setTimeSelector(prev => ({ ...prev, minute: e.target.value }))} className="time-select">
                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (<option key={m} value={m}>{m}</option>))}
                            </select>
                            <select value={timeSelector.period} onChange={(e) => setTimeSelector(prev => ({ ...prev, period: e.target.value }))} className="time-select period">
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                        {timeSlotError && <p className="error-message">{timeSlotError}</p>}
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={() => {
            setIsTimeSlotModalOpen(false);
            setTimeSlotError('');
        }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-no-hover" onClick={addTimeSlot}>
                            Add Time Slot
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Service Modal */}
            <Modal isOpen={isServiceModalOpen} onClose={() => {
            setIsServiceModalOpen(false);
            setNewService('');
        }} title="Add Service">
                <div className="modal-form">
                    <div className="form-group">
                        <label>Service Name</label>
                        <input type="text" value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="e.g., Eye Examination" onKeyPress={(e) => e.key === 'Enter' && addService()}/>
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={() => {
            setIsServiceModalOpen(false);
            setNewService('');
        }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-no-hover" onClick={addService}>
                            Add Service
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Doctor Schedule Modal - per-doctor days & time slots */}
            <Modal isOpen={!!doctorScheduleModal} onClose={() => setDoctorScheduleModal(null)} title={doctorScheduleModal ? `Schedule: ${doctorScheduleModal.doctor.name}` : 'Doctor Schedule'} size="md">
                {doctorScheduleModal && (<div className="modal-form">
                        <p className="config-desc" style={{ marginBottom: '1rem' }}>
                            Is doctor ke liye available days aur time slots set karo. Receptionist ko yahi options dikhenge jab appointment book kare.
                        </p>
                        <div className="form-group">
                            <label>Available Days (uncheck = off day)</label>
                            <div className="days-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {days.map((day, index) => (<label key={index} className={`day-chip ${getDoctorAvailability(doctorScheduleModal.doctor.id).offDays.includes(index) ? 'off' : ''}`}>
                                        <input type="checkbox" checked={!getDoctorAvailability(doctorScheduleModal.doctor.id).offDays.includes(index)} onChange={() => toggleDoctorOffDay(doctorScheduleModal.doctor.id, index)}/>
                                        <span>{day.substring(0, 3)}</span>
                                    </label>))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Time Slots (is doctor ke liye)</label>
                            <div className="time-slots-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {getDoctorAvailability(doctorScheduleModal.doctor.id).timeSlots.map((slot) => (<div key={slot} className="time-slot-chip">
                                        {formatTime(slot)}
                                        <button type="button" className="remove-chip-btn" onClick={() => removeDoctorTimeSlot(doctorScheduleModal.doctor.id, slot)} title="Remove">
                                            <FiX size={14}/>
                                        </button>
                                    </div>))}
                            </div>
                            <div className="time-selector-inputs" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select value={timeSelector.hour} onChange={(e) => setTimeSelector(prev => ({ ...prev, hour: e.target.value }))} className="time-select">
                                    {[...Array(12)].map((_, i) => {
                const h = (i + 1).toString().padStart(2, '0');
                return <option key={h} value={h}>{h}</option>;
            })}
                                </select>
                                <span>:</span>
                                <select value={timeSelector.minute} onChange={(e) => setTimeSelector(prev => ({ ...prev, minute: e.target.value }))} className="time-select">
                                    {['00', '15', '30', '45'].map(m => (<option key={m} value={m}>{m}</option>))}
                                </select>
                                <select value={timeSelector.period} onChange={(e) => setTimeSelector(prev => ({ ...prev, period: e.target.value }))} className="time-select period">
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                                <button type="button" className="btn btn-sm" onClick={() => {
                let h = parseInt(timeSelector.hour, 10);
                if (timeSelector.period === 'PM' && h < 12)
                    h += 12;
                if (timeSelector.period === 'AM' && h === 12)
                    h = 0;
                const hh = h < 10 ? `0${h}` : h;
                addDoctorTimeSlot(doctorScheduleModal.doctor.id, `${hh}:${timeSelector.minute}`);
            }}>
                                    Add Slot
                                </button>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDoctorScheduleModal(null)}>
                                Done
                            </button>
                        </div>
                    </div>)}
            </Modal>
        </div>);
};
export default BookingLink;
