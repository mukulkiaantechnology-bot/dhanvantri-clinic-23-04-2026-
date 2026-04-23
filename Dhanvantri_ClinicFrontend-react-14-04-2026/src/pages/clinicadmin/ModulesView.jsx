import { useEffect, useState } from 'react';
import { FiPackage, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { clinicService } from '../../services/clinic.service';
import './ModulesView.css';
const ModulesView = () => {
    const { selectedClinic } = useAuth();
    const { clinics } = useApp();
    const [currentClinic, setCurrentClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchClinicData = async () => {
            try {
                // Try fetching fresh data from DB
                const res = await clinicService.getClinicDetails();
                setCurrentClinic(res.data);
            }
            catch (err) {
                console.error('Failed to fetch clinic details:', err);
                // Fallback to context data
                const contextClinic = clinics.find((c) => c.id === selectedClinic?.id) || selectedClinic;
                setCurrentClinic(contextClinic);
            }
            finally {
                setLoading(false);
            }
        };
        fetchClinicData();
    }, [selectedClinic, clinics]);
    if (loading) {
        return <div className="p-lg">Loading modules configuration...</div>;
    }
    const clinicData = currentClinic || selectedClinic;
    const modules = [
        {
            id: 'pharmacy',
            name: 'Pharmacy Management',
            description: 'Inventory tracking, prescription fulfillment, and medication dispensing',
            icon: '💊',
            enabled: clinicData?.modules?.pharmacy || false
        },
        {
            id: 'laboratory',
            name: 'Laboratory System',
            description: 'Pathology tests, sample tracking, and direct result updates',
            icon: '🔬',
            enabled: clinicData?.modules?.laboratory || false
        },
        {
            id: 'radiology',
            name: 'Radiology Module',
            description: 'X-Ray, MRI scans, imaging reports, and PACS integration',
            icon: '🩻',
            enabled: clinicData?.modules?.radiology || false
        },
        {
            id: 'billing',
            name: 'Billing & Invoicing',
            description: 'Patient billing, payment processing, and invoice management',
            icon: '💰',
            enabled: clinicData?.modules?.billing || false
        }
    ];
    const enabledCount = modules.filter(m => m.enabled).length;
    const disabledCount = modules.filter(m => !m.enabled).length;
    return (<div className="modules-view-page">
            <div className="page-header">
                <div>
                    <h1>Modules</h1>
                    <p>View modules enabled for your clinic by the Super Administrator</p>
                </div>
            </div>

            {/* Stats */}
            <div className="modules-stats">
                <div className="stat-card">
                    <div className="stat-icon active">
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p className="stat-label">Active Modules</p>
                        <h3 className="stat-value">{enabledCount}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon inactive">
                        <FiXCircle />
                    </div>
                    <div>
                        <p className="stat-label">Disabled Modules</p>
                        <h3 className="stat-value">{disabledCount}</h3>
                    </div>
                </div>
            </div>

            {/* Info Alert */}
            <div className="info-alert card">
                <FiAlertCircle />
                <div>
                    <strong>Read-Only View</strong>
                    <p>Module access is controlled by the Super Administrator. Contact your system admin to enable or disable modules.</p>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="modules-grid">
                {modules.map(module => (<div key={module.id} className={`module-card card ${module.enabled ? 'enabled' : 'disabled'}`}>
                        <div className="module-header">
                            <div className="module-icon">{module.icon}</div>
                            <span className={`status-pill ${module.enabled ? 'active' : 'inactive'}`}>
                                {module.enabled ? (<><FiCheckCircle size={14}/> Active</>) : (<><FiXCircle size={14}/> Disabled</>)}
                            </span>
                        </div>
                        <h3>{module.name}</h3>
                        <p>{module.description}</p>
                        {!module.enabled && (<div className="disabled-overlay">
                                <FiPackage size={32}/>
                                <p>Module Not Enabled</p>
                            </div>)}
                    </div>))}
            </div>

            {/* Contact Section */}
            {disabledCount > 0 && (<div className="contact-section card">
                    <h3>Need More Modules?</h3>
                    <p>Contact your Super Administrator to enable additional modules for your clinic.</p>
                    <button className="btn btn-primary">
                        Contact Super Admin
                    </button>
                </div>)}
        </div>);
};
export default ModulesView;
