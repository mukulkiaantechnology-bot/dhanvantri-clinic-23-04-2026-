import { useState } from 'react';
import { FiPlus, FiTrash2, FiSave, FiEye, FiEdit2, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/Modal';
import './Forms.css';
const Forms = () => {
    const { selectedClinic, user } = useAuth();
    // FIXED: Destructured addFormTemplate and deleteFormTemplate from useApp here
    const { clinics, staff, formTemplates, addFormTemplate, deleteFormTemplate } = useApp();
    const currentClinic = clinics.find((c) => c.id === selectedClinic?.id) || selectedClinic;
    const forms = (formTemplates || []).filter((f) => f.clinicId === currentClinic?.id);
    const doctors = (staff || []).filter((s) => s.role === 'DOCTOR' || (s.roles && s.roles.includes('DOCTOR')));
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    // Form builder state
    const [formName, setFormName] = useState('');
    const [specialty, setSpecialty] = useState('General');
    const [assignedDoctorId, setAssignedDoctorId] = useState('');
    const [fields, setFields] = useState([]);
    const fieldTypes = [
        { type: 'text', label: 'Text Input', icon: '📝' },
        { type: 'number', label: 'Number', icon: '#️⃣' },
        { type: 'dropdown', label: 'Dropdown', icon: '▼' },
        { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
        { type: 'textarea', label: 'Text Area', icon: '📄' },
        { type: 'date', label: 'Date Picker', icon: '📅' }
    ];
    const specialties = formTemplates?.length
        ? [...new Set(formTemplates.map((t) => t.specialty).filter(Boolean))].sort()
        : ['General', 'Dental', 'Physiotherapy', 'Cardiology', 'Pediatrics'];
    const addField = (type) => {
        const newField = {
            id: Date.now().toString(),
            type,
            label: `New ${type} field`,
            required: false,
            placeholder: '',
            options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
        };
        setFields([...fields, newField]);
    };
    const updateField = (id, updates) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };
    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
    };
    const moveField = (index, direction) => {
        const newFields = [...fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < fields.length) {
            [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
            setFields(newFields);
        }
    };
    const saveForm = (status) => {
        const newForm = {
            id: Date.now(),
            name: formName,
            specialty,
            status,
            version: 1,
            fields,
            createdBy: user?.name || 'Admin',
            createdAt: new Date().toISOString().split('T')[0],
            clinicId: currentClinic?.id,
            doctorId: assignedDoctorId ? Number(assignedDoctorId) : undefined
        };
        // FIXED: Now using the destructured function directly
        addFormTemplate(newForm);
        resetBuilder();
        setIsBuilderOpen(false);
    };
    const resetBuilder = () => {
        setFormName('');
        setSpecialty('General');
        setAssignedDoctorId('');
        setFields([]);
    };
    const openBuilder = () => {
        resetBuilder();
        setIsBuilderOpen(true);
    };
    const viewForm = (form) => {
        setSelectedForm(form);
        setIsPreviewOpen(true);
    };
    const duplicateForm = (form) => {
        const newForm = {
            ...form,
            id: Date.now(),
            name: `${form.name} (Copy)`,
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0]
        };
        // FIXED: Now using the destructured function directly
        addFormTemplate(newForm);
    };
    const deleteForm = (id) => {
        if (window.confirm('Are you sure you want to delete this form?')) {
            // FIXED: Now using the destructured function directly
            deleteFormTemplate(id);
        }
    };
    return (
    // ... (rest of the JSX is the same) ...
    <div className="forms-page">
            <div className="page-header">
                <div>
                    <h1>Forms & Assessments</h1>
                    <p>Create and manage clinic-specific assessment forms</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={openBuilder}>
                    <FiPlus />
                    <span>Create New Form</span>
                </button>
            </div>

            {/* Forms List */}
            <div className="forms-grid">
                {forms.map((form) => (<div key={form.id} className="form-card card">
                        <div className="form-card-header">
                            <div>
                                <h3>{form.name}</h3>
                                <p className="form-meta">
                                    {form.specialty} • v{form.version} • {form.fields.length} fields
                                </p>
                            </div>
                            <span className={`status-pill ${form.status}`}>
                                {form.status === 'published' ? <FiCheck size={14}/> : <FiEdit2 size={14}/>}
                                {form.status}
                            </span>
                        </div>
                        <div className="form-card-actions">
                            <button className="btn-icon" title="Preview" onClick={() => viewForm(form)}>
                                <FiEye />
                            </button>
                            <button className="btn-icon" title="Duplicate" onClick={() => duplicateForm(form)}>
                                <FiCopy />
                            </button>
                            <button className="btn-icon text-danger" title="Delete" onClick={() => deleteForm(form.id)}>
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>))}

                {forms.length === 0 && (<div className="empty-state card">
                        <FiEdit2 size={48}/>
                        <h3>No forms created yet</h3>
                        <p>Create your first assessment form to get started</p>
                        <button className="btn btn-primary btn-no-hover" onClick={openBuilder}>
                            Create Form
                        </button>
                    </div>)}
            </div>

            {/* Form Builder Modal */}
            <Modal isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} title="Form Builder">
                <div className="form-builder">
                    {/* Form Settings */}
                    <div className="builder-settings">
                        <div className="form-group">
                            <label>Form Name *</label>
                            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Patient Intake Form"/>
                        </div>
                        <div className="form-group">
                            <label>Specialty *</label>
                            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                                {specialties.map(s => (<option key={s} value={s}>{s}</option>))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Assign to Doctor (Optional)</label>
                            <select value={assignedDoctorId} onChange={(e) => setAssignedDoctorId(e.target.value ? Number(e.target.value) : '')}>
                                <option value="">All Doctors</option>
                                {doctors.map((doc) => (<option key={doc.userId} value={doc.userId}>{doc.name}</option>))}
                            </select>
                        </div>
                    </div>

                    {/* Field Types */}
                    <div className="field-types">
                        <h4>Add Fields</h4>
                        <div className="field-types-grid">
                            {fieldTypes.map(ft => (<button key={ft.type} className="field-type-btn" onClick={() => addField(ft.type)}>
                                    <span className="field-icon">{ft.icon}</span>
                                    <span>{ft.label}</span>
                                </button>))}
                        </div>
                    </div>

                    {/* Fields List */}
                    <div className="builder-fields">
                        <h4>Form Fields ({fields.length})</h4>
                        {fields.map((field, index) => (<div key={field.id} className="builder-field">
                                <div className="field-header">
                                    <span className="field-number">{index + 1}</span>
                                    <input type="text" value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} placeholder="Field label" className="field-label-input"/>
                                    <label className="checkbox-inline">
                                        <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })}/>
                                        Required
                                    </label>
                                    <div className="field-actions">
                                        {index > 0 && (<button className="btn-icon-sm" onClick={() => moveField(index, 'up')}>↑</button>)}
                                        {index < fields.length - 1 && (<button className="btn-icon-sm" onClick={() => moveField(index, 'down')}>↓</button>)}
                                        <button className="btn-icon-sm text-danger" onClick={() => removeField(field.id)}>
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                                <div className="field-config">
                                    <input type="text" value={field.placeholder || ''} onChange={(e) => updateField(field.id, { placeholder: e.target.value })} placeholder="Placeholder text" className="field-placeholder-input"/>
                                    {field.type === 'dropdown' && (<input type="text" value={field.options?.join(', ') || ''} onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(o => o.trim()) })} placeholder="Options (comma separated)" className="field-options-input"/>)}
                                </div>
                            </div>))}
                        {fields.length === 0 && (<p className="empty-message">No fields added yet. Click a field type above to add.</p>)}
                    </div>

                    {/* Actions */}
                    <div className="builder-actions">
                        <button className="btn btn-secondary" onClick={() => setIsBuilderOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-secondary" onClick={() => saveForm('draft')} disabled={!formName || fields.length === 0}>
                            Save as Draft
                        </button>
                        <button className="btn btn-primary btn-no-hover" onClick={() => saveForm('published')} disabled={!formName || fields.length === 0}>
                            <FiSave /> Publish Form
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Form Preview">
                {selectedForm && (<div className="form-preview">
                        <h2>{selectedForm.name}</h2>
                        <p className="form-preview-meta">
                            {selectedForm.specialty} • Version {selectedForm.version}
                        </p>
                        <div className="preview-fields">
                            {selectedForm.fields.map((field, index) => (<div key={field.id} className="preview-field">
                                    <label>
                                        {index + 1}. {field.label}
                                        {field.required && <span className="required">*</span>}
                                    </label>
                                    {field.type === 'text' && (<input type="text" placeholder={field.placeholder} disabled/>)}
                                    {field.type === 'number' && (<input type="number" placeholder={field.placeholder} disabled/>)}
                                    {field.type === 'textarea' && (<textarea placeholder={field.placeholder} disabled rows={3}/>)}
                                    {field.type === 'dropdown' && (<select disabled>
                                            <option>Select...</option>
                                            {field.options?.map((opt, i) => (<option key={i}>{opt}</option>))}
                                        </select>)}
                                    {field.type === 'checkbox' && (<div className="checkbox-group">
                                            {field.options?.map((opt, i) => (<label key={i} className="checkbox-label">
                                                    <input type="checkbox" disabled/>
                                                    {opt}
                                                </label>))}
                                        </div>)}
                                    {field.type === 'date' && (<input type="date" disabled/>)}
                                </div>))}
                        </div>
                    </div>)}
            </Modal>
        </div>);
};
export default Forms;
