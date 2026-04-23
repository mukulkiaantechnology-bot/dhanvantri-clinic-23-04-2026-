import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiCheckCircle, FiDollarSign, FiCreditCard, FiActivity } from 'react-icons/fi';
import { doctorService } from '../../services/doctor.service';
import { useCurrency } from '../../context/CurrencyContext';
import PatientProfileModal from '../../components/PatientProfileModal';
import './Dashboard.css';
import './Patients.css';
const DoctorPatients = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const { formatMoney } = useCurrency();
    const [billingStats, setBillingStats] = useState(null);
    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedPatientForProfile, setSelectedPatientForProfile] = useState(null);
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const [patientsRes, revenueRes] = await Promise.all([
                    doctorService.getPatients(),
                    doctorService.getRevenue()
                ]);
                setPatients(patientsRes.data || []);
                setBillingStats(revenueRes.data || null);
            }
            catch (error) {
                console.error('Failed to fetch patients data', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);
    const openProfile = (patient) => {
        setSelectedPatientForProfile(patient);
        setIsProfileOpen(true);
    };
    const getFollowup = (p) => {
        if (!p.medicalrecord || p.medicalrecord.length === 0)
            return null;
        try {
            const data = typeof p.medicalrecord[0].data === 'string' ? JSON.parse(p.medicalrecord[0].data) : (p.medicalrecord[0].data || {});
            return data.followUpDate || null;
        }
        catch (e) {
            return null;
        }
    };
    const tabs = [
        { id: 'all', label: 'All', count: patients.length },
        { id: 'active', label: 'Active', count: patients.filter(p => !['Discharged', 'Inactive'].includes(p.status)).length },
        { id: 'followup', label: 'Follow-up', count: patients.filter(p => getFollowup(p)).length },
        { id: 'discharged', label: 'Discharged', count: patients.filter(p => p.status === 'Discharged').length }
    ];
    const filteredPatients = patients.filter((p) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(search) ||
            p.phone?.includes(searchTerm) ||
            String(p.id).includes(searchTerm) ||
            p.email?.toLowerCase().includes(search);
        if (!matchesSearch)
            return false;
        const followup = getFollowup(p);
        if (activeTab === 'active')
            return !['Discharged', 'Inactive'].includes(p.status);
        if (activeTab === 'followup')
            return !!followup;
        if (activeTab === 'discharged')
            return p.status === 'Discharged';
        return true;
    });
    return (<div className="doctor-dashboard">
            {/* Page Header */}
            <div className="patients-page-header">
                <div>
                    <h1 className="patients-title">My Patients</h1>
                    <p className="patients-subtitle">Manage and view your assigned patients</p>
                </div>
            </div>

            {/* Billing & Invoices Summary Row */}
            <div className="patients-summary-row">
                <div className="summary-card-modern">
                    <div className="summary-icon-box glass-green">
                        <FiDollarSign />
                    </div>
                    <div className="summary-details">
                        <label>Total Billed</label>
                        <h3>{formatMoney(Number(billingStats?.totalEarnings || 0) + Number(billingStats?.totalOutstanding || 0))}</h3>
                    </div>
                </div>
                <div className="summary-card-modern">
                    <div className="summary-icon-box glass-blue">
                        <FiCreditCard />
                    </div>
                    <div className="summary-details">
                        <label>Total Paid</label>
                        <h3>{formatMoney(billingStats?.totalEarnings || 0)}</h3>
                    </div>
                </div>
                <div className="summary-card-modern">
                    <div className="summary-icon-box glass-orange">
                        <FiActivity />
                    </div>
                    <div className="summary-details">
                        <label>Outstanding</label>
                        <h3 className="text-warning">{formatMoney(billingStats?.totalOutstanding || 0)}</h3>
                    </div>
                </div>
            </div>

            {/* Search and Filter Card */}
            <div className="patients-filter-card">
                <div className="search-bar-centered">
                    <FiSearch className="search-icon"/>
                    <input type="text" placeholder="Search by name, phone, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-large"/>
                </div>

                <div className="filter-tabs">
                    {tabs.map(tab => (<button key={tab.id} className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.label} ({tab.count})
                        </button>))}
                </div>
            </div>

            {/* Patients List */}
            <div className="patients-results-card">
                {loading ? (<div className="p-20 text-center">Loading patients...</div>) : filteredPatients.length > 0 ? (<div className="patients-grid">
                        {filteredPatients.map((patient) => {
                const followupDate = getFollowup(patient);
                return (<div key={patient.id} className="patient-card-modern">
                                    <div className="patient-avatar-large">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div className="patient-info-block">
                                        <h3 className="patient-name">{patient.name}</h3>
                                        <p className="patient-meta">
                                            ID: P-{patient.id} • {(patient.age !== undefined && patient.age !== null) ? patient.age : 'N/A'} Y • {patient.gender || 'N/A'}
                                        </p>
                                        <div className="patient-contact">
                                            <span>{patient.email || 'No email registered'}</span>
                                            <span>{patient.phone || patient.contact || 'No phone record'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                            {patient.medicalrecord && patient.medicalrecord.length > 0 && (<div className="last-visit-tag">
                                                    <FiCheckCircle size={12}/>
                                                    <span>Last: {new Date(patient.medicalrecord[0].createdAt).toLocaleDateString()}</span>
                                                </div>)}
                                            {followupDate && (<div className="last-visit-tag" style={{ background: '#FFF7ED', color: '#9A3412', border: '1px solid #FFEDD5' }}>
                                                    <FiActivity size={12}/>
                                                    <span>Follow-up: {new Date(followupDate).toLocaleDateString()}</span>
                                                </div>)}
                                        </div>
                                    </div>
                                    <div className="patient-actions">
                                        <button className="btn btn-primary btn-sm btn-start-consulting-static" onClick={() => navigate('/doctor/assessments', { state: { patientId: patient.id, patientName: patient.name, openNew: true } })}>
                                            Start Consultation
                                        </button>
                                        <button className="btn btn-primary btn-sm" style={{
                        background: 'linear-gradient(135deg, #2D3BAE 0%, #1E1B4B 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 600
                    }} onClick={() => openProfile(patient)}>
                                            View Full File
                                        </button>
                                    </div>
                                </div>);
            })}
                    </div>) : (<div className="empty-state-patients">
                        <div className="empty-icon-large">
                            <FiUser />
                        </div>
                        <h3>No patients found</h3>
                        <p>No patients match your search criteria</p>
                    </div>)}
            </div>

            {/* Patient Profile Modal */}
            {selectedPatientForProfile && (<PatientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} patientId={selectedPatientForProfile.id} patientName={selectedPatientForProfile.name}/>)}
        </div>);
};
export default DoctorPatients;
