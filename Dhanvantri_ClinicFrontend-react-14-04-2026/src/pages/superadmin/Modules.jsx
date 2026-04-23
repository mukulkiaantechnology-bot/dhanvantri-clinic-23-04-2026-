import { useState } from 'react';
import { FiSave, FiInfo, FiCheck } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import './Modules.css';
const Modules = () => {
    const { clinics, updateClinicModules } = useApp();
    const toast = useToast();
    const [selectedClinicId, setSelectedClinicId] = useState('all');
    const [isSaving, setIsSaving] = useState(false);
    const toggleModule = async (clinicId, moduleName) => {
        try {
            const clinic = clinics.find(c => c.id === clinicId);
            const newModules = {
                ...clinic.modules,
                [moduleName]: !clinic.modules[moduleName]
            };
            await updateClinicModules(clinicId, newModules);
            toast.success('Module settings updated successfully!');
        }
        catch (error) {
            console.error('Failed to update module:', error);
            toast.error('Failed to update module. Please try again.');
        }
    };
    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
    };
    const filteredClinics = selectedClinicId === 'all'
        ? clinics
        : clinics.filter((c) => c.id === selectedClinicId);
    return (<div className="modules-page">
            <div className="page-header">
                <div className="header-text">
                    <h1>Module Control</h1>
                    <p>Enable or disable specific features for each clinic facility.</p>
                </div>
                <button className={`btn btn-primary btn-with-icon btn-no-hover ${isSaving ? 'btn-success' : ''}`} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <FiCheck /> : <FiSave />}
                    <span>{isSaving ? 'Changes Saved' : 'Save All Changes'}</span>
                </button>
            </div>

            <div className="modules-controls card">
                <div className="clinic-selector">
                    <label htmlFor="clinic-select">Select Clinic:</label>
                    <select id="clinic-select" value={selectedClinicId} onChange={(e) => setSelectedClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                        <option value="all">All Clinics</option>
                        {clinics.map((clinic) => (<option key={clinic.id} value={clinic.id}>{clinic.name}</option>))}
                    </select>
                </div>
            </div>

            <div className="modules-info card">
                <FiInfo className="info-icon"/>
                <p>Disabling a module will immediately restrict access to its features for all users in that clinic.</p>
            </div>

            <div className="clinics-modules-grid">
                {filteredClinics.map((clinic) => (<div key={clinic.id} className="clinic-module-card card">
                        <div className="clinic-card-header">
                            <h3>{clinic.name}</h3>
                            <span className={`status-pill ${clinic.status}`}>
                                {clinic.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="modules-list">
                            <div className="module-item">
                                <div className="module-info">
                                    <p className="module-title">Pharmacy Management</p>
                                    <p className="module-desc">Inventory tracking and prescription fulfillment.</p>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" checked={clinic.modules.pharmacy} onChange={() => toggleModule(clinic.id, 'pharmacy')}/>
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="module-item">
                                <div className="module-info">
                                    <p className="module-title">Radiology Module</p>
                                    <p className="module-desc">X-Ray, MRI scans and report generation.</p>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" checked={clinic.modules.radiology} onChange={() => toggleModule(clinic.id, 'radiology')}/>
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="module-item">
                                <div className="module-info">
                                    <p className="module-title">Laboratory System</p>
                                    <p className="module-desc">Pathology tests and direct result updates.</p>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" checked={clinic.modules.laboratory} onChange={() => toggleModule(clinic.id, 'laboratory')}/>
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="module-item">
                                <div className="module-info">
                                    <p className="module-title">Billing & Invoicing</p>
                                    <p className="module-desc">Patient billing, payments, and invoice management.</p>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" checked={clinic.modules.billing} onChange={() => toggleModule(clinic.id, 'billing')}/>
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="module-item">
                                <div className="module-info">
                                    <p className="module-title">Reports & Analytics</p>
                                    <p className="module-desc">Detailed clinic performance and financial reports.</p>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" checked={clinic.modules.reports} onChange={() => toggleModule(clinic.id, 'reports')}/>
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>))}
            </div>
        </div>);
};
export default Modules;
