import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiCheck, FiMapPin, FiBriefcase, FiAlertCircle } from 'react-icons/fi';
import './ClinicSelection.css';
const ClinicSelection = () => {
    const { user, selectClinic, getUserClinics, handleRedirectByRole } = useAuth();
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(null);
    const isPatient = user?.role === 'PATIENT' || user?.roles?.includes('PATIENT');
    useEffect(() => {
        const fetchClinics = async () => {
            if (isPatient) {
                // For patients, use stored patientClinics from login response
                const storedPatientClinics = localStorage.getItem('ev_patient_clinics');
                if (storedPatientClinics) {
                    try {
                        const patientClinics = JSON.parse(storedPatientClinics);
                        setClinics(patientClinics.map((pc) => ({
                            id: pc.id,
                            name: pc.name,
                            location: pc.location,
                            role: 'PATIENT',
                            patientId: pc.patientId
                        })));
                    }
                    catch (e) {
                        setClinics([]);
                    }
                }
                else {
                    // Fallback: fetch from API
                    const data = await getUserClinics();
                    setClinics(data);
                }
            }
            else {
                // Staff flow (existing)
                const data = await getUserClinics();
                setClinics(data);
            }
            setLoading(false);
        };
        fetchClinics();
    }, [getUserClinics, isPatient]);
    const getRoleDisplayName = (role) => {
        const roleNames = {
            SUPER_ADMIN: 'System Administrator',
            ADMIN: 'Clinic Administrator',
            DOCTOR: 'Medical Doctor',
            RECEPTIONIST: 'Admissions Desk',
            PATIENT: 'Patient',
            PHARMACY: 'Pharmacy',
            LAB: 'Laboratory',
            RADIOLOGY: 'Radiology',
            ACCOUNTANT: 'Accounting'
        };
        return roleNames[role] || role;
    };
    const handleSelect = async (clinic) => {
        setSelecting(clinic.id);
        try {
            await selectClinic({ ...clinic, role: clinic.role || 'PATIENT' });
            // Store selected clinic
            const clinicData = {
                id: clinic.id,
                name: clinic.name,
                location: clinic.location,
                role: clinic.role || 'PATIENT'
            };
            localStorage.setItem('ev_clinic', JSON.stringify(clinicData));
            // Clean up patient clinics data
            localStorage.removeItem('ev_patient_clinics');
            // Redirect based on role
            handleRedirectByRole(clinic.role || 'PATIENT');
        }
        catch (err) {
            console.error('Clinic selection failed:', err);
            setSelecting(null);
        }
    };
    return (<div className="selection-container">
            <div className="selection-card fade-in-up">
                <div className="selection-header">
                    <div className="brand-logo-small mb-md">
                        <img src="/sidebar-logo.jpg" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '50%' }}/>
                    </div>
                    <h1>{isPatient ? 'Select Your Clinic' : 'Select Your Facility'}</h1>
                    <p className="selection-subtitle">Welcome back, <strong>{user?.name}</strong></p>
                    {isPatient && (<p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                            You are registered in multiple clinics. Please select which clinic you'd like to access.
                        </p>)}
                </div>

                <div className="clinics-list mt-lg">
                    {loading ? (<p className="text-center">Identifying accessible facilities...</p>) : clinics.length === 0 ? (<div className="no-clinics-message">
                            <FiAlertCircle size={48}/>
                            <h3>No Clinics Found</h3>
                            <p>{isPatient
                ? 'You are not registered in any clinic. Please contact your clinic reception desk.'
                : 'Contact System Administrator for access.'}</p>
                        </div>) : (clinics.map((clinic) => (<div key={clinic.id} className={`clinic-option-card ${selecting === clinic.id ? 'selecting' : ''}`} onClick={() => !selecting && handleSelect(clinic)} style={{ opacity: selecting && selecting !== clinic.id ? 0.5 : 1, pointerEvents: selecting ? 'none' : 'auto' }}>
                                <div className="clinic-card-content">
                                    <div className="clinic-info">
                                        <h3>{clinic.name}</h3>
                                        <div className="clinic-meta">
                                            {clinic.location && (<span className="clinic-location"><FiMapPin size={14}/> {clinic.location}</span>)}
                                            <span className="clinic-role"><FiBriefcase size={14}/> {getRoleDisplayName(clinic.role)}</span>
                                        </div>
                                    </div>
                                    <div className="select-icon">
                                        {selecting === clinic.id ? (<div className="spinner-sm"/>) : (<FiCheck />)}
                                    </div>
                                </div>
                            </div>)))}
                </div>
            </div>
        </div>);
};
export default ClinicSelection;
