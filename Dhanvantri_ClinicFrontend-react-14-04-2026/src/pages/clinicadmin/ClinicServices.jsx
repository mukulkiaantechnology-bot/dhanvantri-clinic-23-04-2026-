import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { clinicService } from '../../services/clinic.service';
import { useCurrency } from '../../context/CurrencyContext';
import './ClinicServices.css';
const ClinicServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { formatMoney } = useCurrency();
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        description: '',
        price: 0,
        gstRate: 18,
        type: 'LAB',
        isActive: true
    });
    useEffect(() => {
        fetchServices();
    }, []);
    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await clinicService.getClinicServices();
            // The backend returns { success: true, data: services }
            // api service interceptor returns response.data
            // So res is { success: true, data: services }
            const items = Array.isArray(res.data) ? res.data : (res.data?.data && Array.isArray(res.data.data) ? res.data.data : []);
            setServices(items);
        }
        catch (error) {
            console.error('Error fetching services:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleOpenForm = (service) => {
        if (service) {
            setFormData({
                id: service.id,
                name: service.name,
                description: service.description || '',
                price: parseFloat(service.price) || 0,
                gstRate: Number(service.gstRate ?? 18),
                type: service.type,
                isActive: service.isActive
            });
        }
        else {
            setFormData({
                id: null,
                name: '',
                description: '',
                price: 0,
                gstRate: 18,
                type: 'LAB',
                isActive: true
            });
        }
        setIsFormOpen(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await clinicService.updateClinicService(formData.id, formData);
                alert('Service updated successfully');
            }
            else {
                await clinicService.createClinicService(formData);
                alert('Service created successfully');
            }
            setIsFormOpen(false);
            fetchServices();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to save service');
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?'))
            return;
        try {
            await clinicService.deleteClinicService(id);
            fetchServices();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete service');
        }
    };
    const filteredServices = (Array.isArray(services) ? services : []).filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.type || '').toLowerCase().includes(searchTerm.toLowerCase()));
    return (<div className="clinic-services-page">
            <div className="page-header">
                <div>
                    <h1>Lab & Radiology Services</h1>
                    <p>Manage test pricing, catalog, and available services for doctors</p>
                </div>
                <button className="btn btn-primary btn-with-icon" onClick={() => handleOpenForm()}>
                    <FiPlus /> Add Service
                </button>
            </div>

            <div className="search-bar-container">
                <FiSearch className="search-icon"/>
                <input type="text" placeholder="Search tests or services by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input"/>
            </div>

            {loading ? (<div className="loading-state">Loading services...</div>) : filteredServices.length > 0 ? (<div className="services-table-container card">
                    <table className="services-table">
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Category</th>
                                <th>Price Amount</th>
                                <th>GST %</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.map((service) => (<tr key={service.id}>
                                    <td className="font-medium">{service.name}</td>
                                    <td>
                                        <span className={`type-badge ${(service.type || 'OTHER').toLowerCase()}`}>
                                            {service.type || 'OTHER'}
                                        </span>
                                    </td>
                                    <td className="font-semibold">{formatMoney(service.price)}</td>
                                    <td className="font-semibold">{Number(service.gstRate ?? 18)}%</td>
                                    <td>
                                        <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                                            {service.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button className="icon-btn edit-btn" onClick={() => handleOpenForm(service)} title="Edit">
                                            <FiEdit2 />
                                        </button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDelete(service.id)} title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>))}
                        </tbody>
                    </table>
                </div>) : (<div className="empty-state card">
                    <p>No services or tests found matching your criteria.</p>
                    <button className="btn btn-secondary mt-10" onClick={() => handleOpenForm()}>Add First Service</button>
                </div>)}

            {isFormOpen && (<div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{formData.id ? 'Edit Service' : 'Add New Service / Test'}</h2>
                            <button className="close-btn" onClick={() => setIsFormOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="service-form">
                            <div className="form-group">
                                <label>Service / Test Name *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Complete Blood Count (CBC)"/>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category *</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} required>
                                        <option value="LAB">Laboratory / Blood Test</option>
                                        <option value="RADIOLOGY">Radiology / Imaging</option>
                                        <option value="CONSULTATION">Consultation / Procedure</option>
                                        <option value="OTHER">Other Service</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Price Amount *</label>
                                    <input type="number" step="0.01" min="0" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}/>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Default GST Rate (%) *</label>
                                    <input type="number" step="0.01" min="0" max="100" required value={formData.gstRate} onChange={e => setFormData({ ...formData, gstRate: parseFloat(e.target.value) || 0 })}/>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Diagnostic instructions or details for this test..."/>
                            </div>

                            <div className="form-group checkbox-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })}/>
                                    Active (Available for Doctors to Prescribe)
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{formData.id ? 'Update Service' : 'Add Service'}</button>
                            </div>
                        </form>
                    </div>
                </div>)}
        </div>);
};
export default ClinicServices;
