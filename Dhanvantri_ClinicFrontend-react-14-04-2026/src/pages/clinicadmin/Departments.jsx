/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiBriefcase, FiUsers } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import './Departments.css';
const Departments = () => {
    const { departments, addDepartment, deleteDepartment, staff } = useApp();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newDept, setNewDept] = useState({ name: '', type: 'CLINICAL' });
    const filteredDepartments = departments.filter((d) => (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addDepartment(newDept);
            toast.success('Department created successfully!');
            setIsModalOpen(false);
            setNewDept({ name: '', type: 'CLINICAL' });
        }
        catch (error) {
            console.error('Failed to add department:', error);
            toast.error('Failed to add department. It might already exist.');
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department? This may affect staff associated with it.')) {
            try {
                await deleteDepartment(id);
                toast.success('Department deleted successfully.');
            }
            catch (error) {
                console.error('Failed to delete department:', error);
                toast.error('Failed to delete department.');
            }
        }
    };
    return (<div className="departments-page">
            <div className="page-header">
                <div>
                    <h1>Clinical Departments</h1>
                    <p>Manage specialization areas and service modules in your clinic.</p>
                </div>
                <button className="btn btn-primary btn-no-hover" onClick={() => setIsModalOpen(true)}>
                    <FiPlus /> <span>Add Department</span>
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card-dept">
                    <div className="stat-icon-dept">
                        <FiBriefcase />
                    </div>
                    <div className="stat-info-dept">
                        <p className="stat-label-dept">Total Departments</p>
                        <h3 className="stat-value-dept">{departments.length}</h3>
                    </div>
                </div>
                <div className="stat-card-dept">
                    <div className="stat-icon-dept" style={{ background: '#EEF2FF', color: '#3F46B8' }}>
                        <FiBriefcase />
                    </div>
                    <div className="stat-info-dept">
                        <p className="stat-label-dept">Clinical Units</p>
                        <h3 className="stat-value-dept">{departments.filter((d) => d.type === 'CLINICAL').length}</h3>
                    </div>
                </div>
                <div className="stat-card-dept">
                    <div className="stat-icon-dept" style={{ background: '#ECFDF5', color: '#059669' }}>
                        <FiBriefcase />
                    </div>
                    <div className="stat-info-dept">
                        <p className="stat-label-dept">Service Units</p>
                        <h3 className="stat-value-dept">{departments.filter((d) => d.type === 'SERVICE').length}</h3>
                    </div>
                </div>
            </div>

            <div className="table-container-dept card">
                <div className="table-header-dept">
                    <h3>All Departments</h3>
                    <div className="search-box-dept">
                        <FiSearch />
                        <input type="text" placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th>Type</th>
                                <th className="text-center">Assigned Staff</th>
                                <th>Created Date</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDepartments.map((dept) => {
            const staffCount = staff?.filter((s) => s.department === dept.name).length || 0;
            return (<tr key={dept.id}>
                                        <td>
                                            <div className="dept-name-cell">
                                                <strong>{dept.name}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${(dept.type || 'CLINICAL').toLowerCase()}`}>
                                                {dept.type || 'CLINICAL'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="assigned-staff-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                                <FiUsers />
                                                <span>{staffCount} Members</span>
                                            </div>
                                        </td>
                                        <td>{dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A'}</td>
                                        <td className="text-right">
                                            <button className="btn-icon text-danger" title="Delete" onClick={() => handleDelete(dept.id)}>
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>);
        })}
                            {filteredDepartments.length === 0 && (<tr>
                                    <td colSpan={4}>
                                        <div className="empty-state-dept">
                                            <FiBriefcase size={48}/>
                                            <h3>No Departments Found</h3>
                                            <p>No departments match your search criteria. Add your first department like "General Medicine" or "Radiology" to get started.</p>
                                        </div>
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Department">
                <form onSubmit={handleAdd} className="modal-form">
                    <div className="form-group">
                        <label>Department Name *</label>
                        <input type="text" className="form-control" required placeholder="e.g., Cardiology, Radiology, Pediatrics" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}/>
                    </div>
                    <div className="form-group">
                        <label>Department Type</label>
                        <select className="form-control" value={newDept.type} onChange={(e) => setNewDept({ ...newDept, type: e.target.value })}>
                            <option value="CLINICAL">Clinical Unit</option>
                            <option value="SERVICE">Service Unit (Lab/Rad/Pharm)</option>
                        </select>
                    </div>
                    <div className="modal-actions mt-xl">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-no-hover">
                            Create Department
                        </button>
                    </div>
                </form>
            </Modal>
        </div>);
};
export default Departments;
