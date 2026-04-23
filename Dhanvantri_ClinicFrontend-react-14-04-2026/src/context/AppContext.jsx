import React, { createContext, useContext, useState, useEffect } from 'react';
import { superService } from '../services/super.service';
import { clinicService } from '../services/clinic.service';
import { departmentService } from '../services/department.service';
import { receptionService } from '../services/reception.service';
import { doctorService } from '../services/doctor.service';
import { billingService } from '../services/billing.service';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { MOCK_CLINICS, MOCK_DOCTORS, MOCK_PATIENTS, MOCK_BOOKINGS, MOCK_ADMINS } from '../data/mockDatabase';
const AppContext = createContext(null);
const unwrapApiData = (res) => {
    const first = res?.data ?? res;
    if (first && typeof first === 'object' && 'data' in first) {
        return first.data;
    }
    return first;
};
export const AppProvider = ({ children }) => {
    const { user, selectedClinic } = useAuth();
    const toast = useToast();
    const [clinics, setClinics] = useState([]);
    const [staff, setStaff] = useState([]);
    const [patients, setPatients] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [formTemplates, setFormTemplates] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [bookingConfig, setBookingConfig] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const fetchData = async () => {
        if (!user)
            return;
        setDataLoading(true);
        // ─── MOCK USER: use live mock API state so CRUD reflects instantly ─────
        if (user.isMockUser) {
            const isSuperAdminPath = window.location.pathname.startsWith('/super-admin');
            const isSuperAdmin = user.roles?.includes('SUPER_ADMIN');
            if (isSuperAdmin || isSuperAdminPath) {
                try {
                    const [clinicsRes, staffRes] = await Promise.all([
                        superService.getClinics().catch(() => ({ data: MOCK_CLINICS })),
                        superService.getStaff().catch(() => ({ data: [...MOCK_DOCTORS, ...MOCK_ADMINS] }))
                    ]);
                    const clinicsData = clinicsRes?.data ?? clinicsRes ?? [];
                    const staffData = staffRes?.data ?? staffRes ?? [];
                    setClinics(Array.isArray(clinicsData) ? clinicsData : []);
                    setStaff(Array.isArray(staffData) ? staffData : []);
                    setPatients(Object.values(MOCK_PATIENTS).flat());
                    setBookings(Object.values(MOCK_BOOKINGS).flat());
                    setInvoices([]);
                }
                finally {
                    setDataLoading(false);
                }
                return;
            }
            if (selectedClinic) {
                await Promise.all([
                    departmentService.getDepartments().then((r) => setDepartments(r?.data ?? r ?? [])).catch(() => setDepartments([])),
                    clinicService.getStaff().then((r) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([])),
                    receptionService.getPatients().then((r) => setPatients(r?.data ?? r ?? [])).catch(() => setPatients([])),
                    receptionService.getAppointments().then((r) => setBookings(r?.data ?? r ?? [])).catch(() => setBookings([])),
                    billingService.getInvoices().then((r) => setInvoices(r?.data ?? r ?? [])).catch(() => setInvoices([])),
                    clinicService.getBookingConfig().then((r) => setBookingConfig(r?.data ?? r ?? null)).catch(() => setBookingConfig(null))
                ]);
            }
            setDataLoading(false);
            return;
        }
        // ─────────────────────────────────────────────────────────────────────
        const fetchAndSet = async (fetcher, setter, fallback = []) => {
            try {
                const res = await fetcher();
                const data = unwrapApiData(res);
                setter(Array.isArray(data) ? data : (data || fallback));
            }
            catch (err) {
                setter(fallback);
            }
        };
        try {
            if (user.roles.includes('SUPER_ADMIN')) {
                await Promise.all([
                    superService.getClinics().then((r) => setClinics(r?.data ?? r ?? [])).catch(() => setClinics([])),
                    superService.getStaff().then((r) => {
                        const raw = r?.data ?? r ?? [];
                        try {
                            let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                            if (Array.isArray(mockMultiUsers))
                                mockMultiUsers = {};
                            setStaff(raw.map((s) => {
                                if (s.email && mockMultiUsers[s.email.toLowerCase()]) {
                                    return { ...s, clinics: mockMultiUsers[s.email.toLowerCase()] };
                                }
                                return s;
                            }));
                        }
                        catch {
                            setStaff(raw);
                        }
                    }).catch(() => setStaff([]))
                ]);
            }
            // ─── CLINIC LEVEL DATA ───────────────────────────────────────────────
            // Only fetch clinic-operational data if we are NOT on a Super Admin management route
            const isSuperAdminPath = window.location.pathname.startsWith('/super-admin');
            if (selectedClinic && !isSuperAdminPath) {
                const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
                const isDoctor = user.roles.includes('DOCTOR') && !isAdmin;
                const isSupport = ['RECEPTIONIST', 'ACCOUNTING', 'ACCOUNTS', 'ACCOUNTANT'].some(r => user.roles.includes(r));
                const isDocCtrl = user.roles.includes('DOCUMENT_CONTROLLER') && !isAdmin && !user.roles.includes('DOCTOR');
                if (isAdmin) {
                    await Promise.all([
                        departmentService.getDepartments().then((r) => setDepartments(r?.data ?? r ?? [])).catch(() => setDepartments([])),
                        clinicService.getStaff().then((r) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([])),
                        receptionService.getPatients().then((r) => setPatients(r?.data ?? r ?? [])).catch(() => setPatients([])),
                        receptionService.getAppointments().then((r) => setBookings(r?.data ?? r ?? [])).catch(() => setBookings([])),
                        billingService.getInvoices().then((r) => setInvoices(r?.data ?? r ?? [])).catch(() => setInvoices([])),
                        clinicService.getBookingConfig().then((r) => setBookingConfig(r?.data ?? r)).catch(() => setBookingConfig(null)),
                        clinicService.getActivities().then((r) => setAuditLogs(r?.data ?? r ?? [])).catch(() => setAuditLogs([]))
                    ]);
                    clinicService.getFormTemplates().then((res) => {
                        const list = res?.data ?? res ?? [];
                        setFormTemplates(Array.isArray(list) ? list.map((t) => ({
                            ...t,
                            fields: typeof t.fields === 'string' ? (() => { try {
                                return JSON.parse(t.fields);
                            }
                            catch {
                                return t.fields;
                            } })() : t.fields
                        })) : []);
                    }).catch(() => setFormTemplates([]));
                }
                else if (isDoctor) {
                    await Promise.all([
                        fetchAndSet(() => doctorService.getPatients(), setPatients),
                        fetchAndSet(() => doctorService.getQueue(), setBookings),
                        clinicService.getStaff().then((r) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([]))
                    ]);
                    doctorService.getTemplates().then((res) => {
                        const list = res?.data ?? res ?? [];
                        setFormTemplates(Array.isArray(list) ? list.map((t) => ({
                            ...t,
                            fields: typeof t.fields === 'string' ? (() => { try {
                                return JSON.parse(t.fields);
                            }
                            catch {
                                return t.fields;
                            } })() : t.fields
                        })) : []);
                    }).catch(() => setFormTemplates([]));
                }
                else if (isSupport) {
                    await Promise.all([
                        receptionService.getPatients().then((r) => setPatients(r?.data ?? r ?? [])).catch(() => setPatients([])),
                        receptionService.getAppointments().then((r) => setBookings(r?.data ?? r ?? [])).catch(() => setBookings([])),
                        billingService.getInvoices().then((r) => setInvoices(r?.data ?? r ?? [])).catch(() => setInvoices([])),
                        clinicService.getStaff().then((r) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([]))
                    ]);
                }
                else if (isDocCtrl) {
                    await fetchAndSet(() => doctorService.getPatients(), setPatients);
                    doctorService.getTemplates().then((res) => {
                        const list = res?.data ?? res ?? [];
                        setFormTemplates(Array.isArray(list) ? list.map((t) => ({
                            ...t,
                            fields: typeof t.fields === 'string' ? (() => { try {
                                return JSON.parse(t.fields);
                            }
                            catch {
                                return t.fields;
                            } })() : t.fields
                        })) : []);
                    }).catch(() => setFormTemplates([]));
                }
            }
        }
        finally {
            setDataLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [user, selectedClinic]);
    const refreshData = async () => {
        await fetchData();
        setRefreshTrigger(prev => prev + 1);
    };
    const logAction = (action, _performedBy, details) => {
        console.log(`Action: ${action}`, details);
    };
    const addClinic = async (clinic) => {
        const res = await superService.createClinic(clinic);
        setClinics(prev => [...prev, res.data]);
        // After creating a clinic, a clinic admin is also created. 
        // We need to refetch the staff list to show them in the Admins tab.
        if (user.roles.includes('SUPER_ADMIN')) {
            const sRes = await superService.getStaff();
            setStaff(sRes.data || []);
        }
        await refreshData();
        return res.data;
    };
    const updateClinic = async (clinicId, updates) => {
        const res = await superService.updateClinic(clinicId, updates);
        setClinics(prev => prev.map(c => c.id === clinicId ? res.data : c));
        // Update staff list as well in case clinic details used in admins list changed
        if (user.roles.includes('SUPER_ADMIN')) {
            const sRes = await superService.getStaff();
            setStaff(sRes.data || []);
        }
        await refreshData();
    };
    const toggleClinicStatus = async (clinicId) => {
        const res = await superService.toggleClinicStatus(clinicId);
        setClinics(prev => prev.map(c => c.id === clinicId ? res.data : c));
        await refreshData();
    };
    const deleteClinic = async (clinicId) => {
        await superService.deleteClinic(clinicId);
        setClinics(prev => prev.filter(c => c.id !== clinicId));
        // Remove associated staff from the local state by refetching
        if (user.roles.includes('SUPER_ADMIN')) {
            const sRes = await superService.getStaff();
            setStaff(sRes.data || []);
        }
        await refreshData();
    };
    const updateClinicModules = async (clinicId, modules) => {
        const res = await superService.updateModules(clinicId, modules);
        setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, modules: res.data.modules } : c));
        await refreshData();
    };
    const addStaff = async (member, clinicId) => {
        // Determine all clinic IDs to assign
        const allClinicIds = member.clinicIds && member.clinicIds.length > 0
            ? member.clinicIds
            : clinicId
                ? [clinicId]
                : member.clinicId
                    ? [member.clinicId]
                    : selectedClinic?.id
                        ? [selectedClinic.id]
                        : clinics.length > 0 ? [clinics[0].id] : [];
        if (allClinicIds.length === 0) {
            console.error('Cannot create staff: No clinic ID provided.');
            return;
        }
        // STEP 1: Create the user on the FIRST clinic
        const firstClinicId = allClinicIds[0];
        const res = user.roles.includes('SUPER_ADMIN')
            ? await superService.createClinicAdmin(Number(firstClinicId), member)
            : await clinicService.createStaff(member);
        const staffData = res.data || res;
        const newStaffId = staffData.id || staffData.staff?.id;
        // STEP 2: If multiple clinics, immediately patch with full array
        if (newStaffId && allClinicIds.length > 1 && user.roles.includes('SUPER_ADMIN')) {
            try {
                await superService.updateStaff(newStaffId, { clinicIds: allClinicIds });
            }
            catch (e) {
                console.warn('Multi-clinic assignment partial update failed:', e);
            }
            // FRONTEND DEMO MOCK: Save email to grant mock multi-clinic view on login
            try {
                let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                if (member.email) {
                    if (Array.isArray(mockMultiUsers))
                        mockMultiUsers = {}; // clear old array format
                    const matchedClinics = clinics
                        .filter(c => allClinicIds.includes(c.id))
                        .map(c => ({ id: c.id, name: c.name, logo: c.logo || '' }));
                    mockMultiUsers[member.email.toLowerCase()] = matchedClinics.length > 0 ? matchedClinics : allClinicIds;
                    localStorage.setItem('ev_multi_clinic_users', JSON.stringify(mockMultiUsers));
                }
            }
            catch (e) { /* ignore */ }
        }
        else if (user.roles.includes('SUPER_ADMIN') && member.email) {
            // Keep clinic assignment cache in sync for single-clinic admins too.
            try {
                let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                if (Array.isArray(mockMultiUsers))
                    mockMultiUsers = {};
                delete mockMultiUsers[member.email.toLowerCase()];
                localStorage.setItem('ev_multi_clinic_users', JSON.stringify(mockMultiUsers));
            }
            catch (e) { /* ignore */ }
        }
        // STEP 3: Flatten for local state, use allClinicIds for display
        const flattenedStaff = {
            ...staffData,
            name: staffData.name || staffData.user?.name,
            email: staffData.email || staffData.user?.email,
            phone: staffData.phone || staffData.user?.phone,
            clinics: allClinicIds // Reflect all assigned clinics in local state immediately
        };
        setStaff(prev => [...prev, flattenedStaff]);
        await refreshData();
        return flattenedStaff;
    };
    const updateStaff = async (staffId, updates) => {
        const res = user.roles.includes('SUPER_ADMIN')
            ? await superService.updateStaff(staffId, updates)
            : await clinicService.updateStaff(staffId, updates);
        // FRONTEND DEMO MOCK: keep mock clinic assignment cache synced with latest assignment
        if (updates.clinicIds && updates.clinicIds.length > 1) {
            try {
                const updatedStaff = res.data || res;
                const email = updatedStaff.email || updates.email;
                if (email) {
                    let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                    if (Array.isArray(mockMultiUsers))
                        mockMultiUsers = {}; // migration
                    const matchedClinics = clinics
                        .filter(c => updates.clinicIds.includes(c.id))
                        .map(c => ({ id: c.id, name: c.name, logo: c.logo || '' }));
                    mockMultiUsers[email.toLowerCase()] = matchedClinics.length > 0 ? matchedClinics : updates.clinicIds;
                    localStorage.setItem('ev_multi_clinic_users', JSON.stringify(mockMultiUsers));
                    // Immediately override the response for correct UI rendering without refresh
                    if (res.data)
                        res.data.clinics = updates.clinicIds;
                    else
                        res.clinics = updates.clinicIds;
                }
            }
            catch (e) { /* ignore */ }
        }
        else if (updates.clinicIds && updates.clinicIds.length <= 1) {
            try {
                const updatedStaff = res.data || res;
                const email = (updatedStaff.email || updates.email || '').toLowerCase();
                if (email) {
                    let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                    if (Array.isArray(mockMultiUsers))
                        mockMultiUsers = {};
                    delete mockMultiUsers[email];
                    localStorage.setItem('ev_multi_clinic_users', JSON.stringify(mockMultiUsers));
                }
            }
            catch (e) { /* ignore */ }
        }
        setStaff(prev => prev.map(s => s.id === staffId ? (res.data || res) : s));
        await refreshData();
    };
    const addPatient = async (patient) => {
        const res = await receptionService.registerPatient(patient);
        const created = unwrapApiData(res);
        setPatients(prev => [...prev, created]);
        await refreshData();
        return created;
    };
    const addBooking = async (booking) => {
        const res = await receptionService.createAppointment(booking);
        const created = unwrapApiData(res);
        setBookings(prev => [...prev, created]);
        await refreshData();
        return created;
    };
    const updateBookingStatus = async (bookingId, status) => {
        try {
            console.log('Updating booking status:', bookingId, status);
            const res = status === 'Checked In'
                ? await receptionService.checkIn(bookingId)
                : await receptionService.updateStatus(bookingId, status);
            console.log('Status update response:', res);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: res.data.status } : b));
            await refreshData();
            toast.success(`Appointment ${status.toLowerCase()} successfully!`);
        }
        catch (error) {
            console.error('Failed to update booking status:', error);
            toast.error(`Failed to update appointment status: ${error.response?.data?.message || error.message}`);
        }
    };
    const approveBooking = async (bookingId) => {
        console.log('Approving booking:', bookingId);
        await updateBookingStatus(bookingId, 'Confirmed');
    };
    const rejectBooking = async (bookingId) => {
        console.log('Rejecting booking:', bookingId);
        await updateBookingStatus(bookingId, 'Cancelled');
    };
    const addFormTemplate = async (template) => {
        const res = await clinicService.createFormTemplate(template);
        const newTemplate = {
            ...res.data,
            fields: typeof res.data.fields === 'string' ? JSON.parse(res.data.fields) : res.data.fields
        };
        setFormTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
    };
    const toggleStaffStatus = async (staffId) => {
        const staffMember = staff.find(s => s.id === staffId);
        if (!staffMember)
            return;
        const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
        let res;
        if (user.roles.includes('SUPER_ADMIN')) {
            res = await superService.toggleStaffStatus(staffId);
        }
        else {
            // For clinic admins, toggle via updateStaff
            res = await clinicService.updateStaff(staffId, { status: newStatus });
        }
        const updatedMember = res.data;
        setStaff(prev => prev.map(s => s.id === staffId ? updatedMember : s));
    };
    const deleteStaff = async (staffId) => {
        try {
            if (user.roles.includes('SUPER_ADMIN') && !selectedClinic) {
                await superService.deleteStaff(staffId);
            }
            else {
                await clinicService.deleteStaff(staffId);
            }
            setStaff(prev => prev.filter(s => s.id !== staffId));
            await refreshData();
            toast.success('Staff member deleted successfully');
        }
        catch (error) {
            console.error('Failed to delete staff:', error);
            const message = error.response?.data?.message || error.message || 'Failed to delete staff member';
            toast.error(message);
        }
    };
    const deleteFormTemplate = async (templateId) => {
        await clinicService.deleteFormTemplate(templateId);
        setFormTemplates(prev => prev.filter(t => t.id !== templateId));
    };
    const saveBookingConfig = async (config) => {
        const res = await clinicService.updateBookingConfig(config);
        setBookingConfig(res.data);
    };
    const updatePatientStatus = async (patientId, status) => {
        // This would call a backend update patient endpoint
        // For now, we update local state if successful
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status } : p));
    };
    const addAssessment = async (patientId, assessment) => {
        await doctorService.submitAssessment({ patientId, ...assessment });
        // Optionally refetch history or update state if needed
    };
    const addDepartment = async (department) => {
        const res = await departmentService.createDepartment(department);
        setDepartments(prev => [...prev, res.data]);
        return res.data;
    };
    const deleteDepartment = async (id) => {
        await departmentService.deleteDepartment(id);
        setDepartments(prev => prev.filter(d => d.id !== id));
    };
    const updateNotificationStatus = async (id, status) => {
        const res = await departmentService.updateNotificationStatus(id, status);
        setNotifications(prev => prev.map(n => n.id === id ? res.data : n));
    };
    const addInvoice = async (data) => {
        const res = await billingService.createInvoice(data);
        if (res.status === 'success') {
            setInvoices(prev => [res.data, ...prev]);
            return res.data;
        }
    };
    const updateInvoiceStatus = async (id, status) => {
        const res = await billingService.updateInvoiceStatus(id, status);
        if (res.status === 'success') {
            setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
            return res.data;
        }
    };
    const value = {
        clinics, staff, patients, bookings, invoices, formTemplates, auditLogs, notifications, departments, bookingConfig, dataLoading,
        addClinic, updateClinic, toggleClinicStatus, deleteClinic, updateClinicModules,
        addStaff, updateStaff, toggleStaffStatus, deleteStaff, addPatient, updatePatientStatus, addBooking, approveBooking, rejectBooking,
        updateBookingStatus, addInvoice, updateInvoiceStatus, addFormTemplate, deleteFormTemplate, logAction,
        addDepartment, deleteDepartment, updateNotificationStatus, saveBookingConfig, addAssessment, refreshData, refreshTrigger
    };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context)
        throw new Error('useApp must be used within AppProvider');
    return context;
};
