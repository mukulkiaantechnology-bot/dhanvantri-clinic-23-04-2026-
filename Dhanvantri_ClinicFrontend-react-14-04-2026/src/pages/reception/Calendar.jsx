import { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiCheck, FiCalendar, FiUser } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { receptionService } from '../../services/reception.service';
import { clinicService } from '../../services/clinic.service';
import Modal from '../../components/Modal';
import './Calendar.css';
const FALLBACK_TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '15:00', '16:00'];
const CalendarView = () => {
    const { patients, staff, addBooking, refreshData } = useApp();
    const { selectedClinic } = useAuth();
    const [view, setView] = useState('day');
    const [displayDate, setDisplayDate] = useState(new Date());
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [patientExistingAppointments, setPatientExistingAppointments] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00',
        service: 'Consultation', notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [doctorAvailability, setDoctorAvailability] = useState(null);
    const [allDoctorsAvailability, setAllDoctorsAvailability] = useState({});
    const clinicPatients = (patients || []).filter((p) => !selectedClinic?.id || p.clinicId === selectedClinic?.id);
    const clinicStaff = (staff || []).filter((s) => s.clinicId === selectedClinic?.id || (s.clinics || []).includes(selectedClinic?.id));
    const doctors = clinicStaff.filter((s) => {
        const roles = (s.roles || [s.role] || []).map((r) => String(r).toUpperCase());
        return roles.includes('DOCTOR') || roles.includes('ADMISSION');
    });
    const currentDateStr = displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const displayDateYmd = displayDate.toISOString().split('T')[0];
    const displayDayOfWeek = displayDate.getDay();
    const timeSlots = (doctorAvailability?.timeSlots?.length ? doctorAvailability.timeSlots : FALLBACK_TIME_SLOTS);
    const offDays = doctorAvailability?.offDays ?? [0, 6];
    const isSelectedDateOffDay = () => {
        if (!formData.date)
            return false;
        const d = new Date(formData.date);
        return offDays.includes(d.getDay());
    };
    useEffect(() => {
        if (formData.patientId) {
            receptionService.getPatientAppointments(Number(formData.patientId))
                .then((r) => setPatientExistingAppointments(r?.data?.data ?? r?.data ?? []))
                .catch(() => setPatientExistingAppointments([]));
        }
        else {
            setPatientExistingAppointments([]);
        }
    }, [formData.patientId]);
    useEffect(() => {
        if (formData.doctorId) {
            clinicService.getDoctorAvailability(Number(formData.doctorId))
                .then((r) => setDoctorAvailability(r?.data ?? r ?? null))
                .catch(() => setDoctorAvailability(null));
        }
        else {
            setDoctorAvailability(null);
        }
    }, [formData.doctorId]);
    useEffect(() => {
        if (!selectedClinic?.id || doctors.length === 0)
            return;
        clinicService.getBookingConfig()
            .then((r) => {
            const cfg = r?.data ?? r ?? {};
            const da = cfg.doctorAvailability || {};
            const defaultOff = cfg.offDays ?? [0, 6];
            const defaultSlots = cfg.timeSlots ?? FALLBACK_TIME_SLOTS;
            const map = {};
            doctors.forEach((d) => {
                const dc = da[String(d.id)];
                map[String(d.id)] = {
                    offDays: dc?.offDays ?? defaultOff,
                    timeSlots: (dc?.timeSlots?.length ? dc.timeSlots : defaultSlots) || FALLBACK_TIME_SLOTS
                };
            });
            setAllDoctorsAvailability(map);
        })
            .catch(() => setAllDoctorsAvailability({}));
    }, [selectedClinic?.id, doctors.map((d) => d.id).join(',')]);
    const calendarTimeSlots = useMemo(() => {
        const slots = new Set();
        const docsToUse = selectedDoctorFilter
            ? doctors.filter((d) => String(d.id) === selectedDoctorFilter)
            : doctors;
        docsToUse.forEach((d) => {
            (allDoctorsAvailability[String(d.id)]?.timeSlots || FALLBACK_TIME_SLOTS).forEach((s) => slots.add(s));
        });
        return [...slots].sort();
    }, [doctors, allDoctorsAvailability, selectedDoctorFilter]);
    const getAvailableDoctorsForSlot = (timeSlot) => {
        const docsToCheck = selectedDoctorFilter
            ? doctors.filter((d) => String(d.id) === selectedDoctorFilter)
            : doctors;
        return docsToCheck.filter((d) => {
            const av = allDoctorsAvailability[String(d.id)];
            if (!av)
                return false;
            if (av.offDays.includes(displayDayOfWeek))
                return false;
            return (av.timeSlots || []).includes(timeSlot);
        });
    };
    const filteredDoctor = selectedDoctorFilter ? doctors.find((d) => String(d.id) === selectedDoctorFilter) : null;
    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.doctorId)
            return;
        if (isSelectedDateOffDay()) {
            alert('Please select an available day for this doctor. Cannot book on off days.');
            return;
        }
        setSubmitting(true);
        try {
            await addBooking({
                patientId: Number(formData.patientId),
                doctorId: Number(formData.doctorId),
                date: formData.date,
                time: formData.time,
                service: formData.service,
                notes: formData.notes || undefined
            });
            await refreshData?.();
            setIsAppointmentModalOpen(false);
            setFormData({ patientId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', service: 'Consultation', notes: '' });
        }
        catch (err) {
            alert(err?.response?.data?.message || 'Failed to schedule appointment');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="calendar-page">
            <div className="page-header">
                <div>
                    <h1>Appointments Calendar</h1>
                    <p>Manage and schedule patient appointments</p>
                </div>
                <button className="btn-new-appointment-static" onClick={() => setIsAppointmentModalOpen(true)}>
                    <FiPlus /> <span>New Appointment</span>
                </button>
            </div>

            <div className="calendar-controls-bar card">
                <div className="calendar-filters">
                    <div className="doctor-filter">
                        <label>Doctor</label>
                        <select value={selectedDoctorFilter} onChange={e => setSelectedDoctorFilter(e.target.value)} className="doctor-filter-select">
                            <option value="">All doctors</option>
                            {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>))}
                        </select>
                    </div>
                    <div className="view-selector">
                        <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button>
                        <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
                        <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
                    </div>
                </div>

                <div className="calendar-date-nav">
                    <button className="nav-arrow" onClick={() => setDisplayDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}><FiChevronLeft /></button>
                    <span className="current-date-text">{currentDateStr}</span>
                    <button className="nav-arrow" onClick={() => setDisplayDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}><FiChevronRight /></button>
                </div>

                <button className="btn-today" onClick={() => setDisplayDate(new Date())}>Today</button>
            </div>

            <div className="calendar-content card mt-lg">
                <p className="calendar-legend" style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {selectedDoctorFilter ? (<>On <strong>{currentDateStr}</strong> — Showing availability for <strong>{filteredDoctor?.name}</strong>. {filteredDoctor && !allDoctorsAvailability[selectedDoctorFilter]?.offDays?.includes(displayDayOfWeek) ? 'Hover over a slot for details.' : 'This doctor is not available on this day (off day).'}</>) : (<>Select a doctor above to see their available time slots for <strong>{currentDateStr}</strong>. Or choose "All doctors" to see combined availability.</>)}
                </p>
                <div className="time-grid">
                    {(calendarTimeSlots.length ? calendarTimeSlots : FALLBACK_TIME_SLOTS).map((time, idx) => {
            const availableDoctors = getAvailableDoctorsForSlot(time);
            const hasAvailability = availableDoctors.length > 0;
            return (<div key={idx} className="time-row">
                                <div className="time-label">{time}</div>
                                <div className={`time-slot-available ${hasAvailability ? 'has-doctors' : ''}`} onClick={() => {
                    setFormData(f => ({
                        ...f,
                        date: displayDateYmd,
                        time,
                        doctorId: selectedDoctorFilter && hasAvailability ? selectedDoctorFilter : f.doctorId
                    }));
                    setIsAppointmentModalOpen(true);
                }} title={hasAvailability ? `On this date, these doctors are available at ${time}: ${availableDoctors.map((d) => d.name).join(', ')}` : 'No doctors available at this time'}>
                                    <div className="slot-content">
                                        {hasAvailability ? (<>
                                                <span className="slot-doctors">
                                                    <FiUser size={14}/> {selectedDoctorFilter
                        ? `${filteredDoctor?.name} — Available`
                        : `${availableDoctors.length} doctor${availableDoctors.length !== 1 ? 's' : ''} available`}
                                                </span>
                                                <span className="slot-hover-hint">Click to book</span>
                                            </>) : (<span>No availability</span>)}
                                    </div>
                                    {hasAvailability && (<div className="slot-tooltip">
                                            <strong>On this date, these doctors are available at {time}:</strong>
                                            <ul>
                                                {availableDoctors.map((d) => (<li key={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</li>))}
                                            </ul>
                                        </div>)}
                                </div>
                            </div>);
        })}
                </div>
            </div>

            {/* Schedule Appointment Modal */}
            <Modal isOpen={isAppointmentModalOpen} onClose={() => { setIsAppointmentModalOpen(false); setFormData({ ...formData, patientId: '', doctorId: '' }); }} title="Schedule Appointment">
                {patientExistingAppointments.length > 0 && (<div style={{
                background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px',
                padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem'
            }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#92400E' }}>
                            <FiCalendar size={16}/> This patient already has upcoming appointment(s):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {patientExistingAppointments.slice(0, 5).map((apt) => (<li key={apt.id} style={{ marginBottom: '0.25rem' }}>
                                    {new Date(apt.date).toLocaleDateString()} • {apt.time || '—'} • Dr. {apt.doctorName || 'Unknown'} • {apt.status}
                                </li>))}
                        </ul>
                        {patientExistingAppointments.length > 5 && (<small style={{ color: '#92400E' }}>+ {patientExistingAppointments.length - 5} more</small>)}
                    </div>)}
                <form className="modal-form" onSubmit={handleScheduleSubmit}>
                    <div className="form-group">
                        <label>Patient *</label>
                        <select required value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
                            <option value="">Select Patient</option>
                            {clinicPatients.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Doctor *</label>
                        <select required value={formData.doctorId} onChange={e => setFormData({
            ...formData,
            doctorId: e.target.value,
            time: '',
            date: new Date().toISOString().split('T')[0]
        })}>
                            <option value="">Select Provider</option>
                            {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                    </div>
                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Date *</label>
                            <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}/>
                            {formData.doctorId && isSelectedDateOffDay() && (<small style={{ color: '#DC2626', display: 'block', marginTop: '0.25rem' }}>
                                    This doctor is not available on this day (off day). Please choose an available day.
                                </small>)}
                        </div>
                        <div className="form-group">
                            <label>Time *</label>
                            <select required value={timeSlots.includes(formData.time) ? formData.time : (timeSlots[0] || '')} onChange={e => setFormData({ ...formData, time: e.target.value })}>
                                {timeSlots.map(t => (<option key={t} value={t}>{t}</option>))}
                            </select>
                            {formData.doctorId && (<small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                                    Admin has configured these time slots for this doctor
                                </small>)}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Service Type *</label>
                        <select required value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })}>
                            <option value="Consultation">Consultation</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea placeholder="Additional notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}/>
                    </div>
                    <div className="modal-actions-refined">
                        <button type="button" className="btn-cancel" onClick={() => setIsAppointmentModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={submitting || isSelectedDateOffDay()}>
                            <FiCheck /> {submitting ? 'Scheduling...' : 'Schedule Appointment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default CalendarView;
