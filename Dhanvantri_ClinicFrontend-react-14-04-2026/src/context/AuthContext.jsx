import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useToast } from './ToastContext';
const AuthContext = createContext(null);
const OTP_TRUST_STORAGE_PREFIX = 'ev_trusted_otp_';

const getOtpTrustStorageKey = (email) => `${OTP_TRUST_STORAGE_PREFIX}${String(email || '').trim().toLowerCase()}`;

const getTrustedOtpToken = (email) => {
    if (!email)
        return null;
    const raw = localStorage.getItem(getOtpTrustStorageKey(email));
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.token || !parsed?.expiresAt)
            return null;
        if (Date.now() >= new Date(parsed.expiresAt).getTime()) {
            localStorage.removeItem(getOtpTrustStorageKey(email));
            return null;
        }
        return parsed.token;
    } catch {
        localStorage.removeItem(getOtpTrustStorageKey(email));
        return null;
    }
};

const saveTrustedOtpToken = (email, token, expiresAt) => {
    if (!email || !token || !expiresAt)
        return;
    localStorage.setItem(getOtpTrustStorageKey(email), JSON.stringify({
        token,
        expiresAt
    }));
};

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil] = useState(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [auditLogs] = useState([]);
    useEffect(() => {
        const storedUser = localStorage.getItem('ev_user');
        const storedClinic = localStorage.getItem('ev_clinic');
        let parsedUser = null;
        if (storedUser) {
            parsedUser = JSON.parse(storedUser);
            if (parsedUser.roles && Array.isArray(parsedUser.roles)) {
                parsedUser.roles = parsedUser.roles.map((r) => r.toUpperCase());
            }
            setUser(parsedUser);
            setIsAuthenticated(true);
        }
        // Clinic-scoped data isolation: use stored clinic ONLY if it's in user's allowed clinics
        if (storedClinic && parsedUser) {
            try {
                const clinic = JSON.parse(storedClinic);
                const userClinics = parsedUser.clinics || [];
                const clinicIds = userClinics.map((c) => (typeof c === 'object' ? c.id : c));
                if (clinic?.id && (clinicIds.length === 0 || clinicIds.includes(clinic.id))) {
                    setSelectedClinic(clinic);
                }
                else {
                    localStorage.removeItem('ev_clinic');
                }
            }
            catch {
                localStorage.removeItem('ev_clinic');
            }
        }
        else if (storedClinic && !parsedUser) {
            localStorage.removeItem('ev_clinic');
        }
        setLoading(false);
    }, []);
    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            const trustedOtpToken = getTrustedOtpToken(email);
            const response = await authService.login({ email, password, trustedOtpToken });
            console.log('Login response:', response);
            if (response.success && response.data) {
                if (response.data.otpRequired) {
                    // Trusted token is not usable anymore once server asks OTP again.
                    localStorage.removeItem(getOtpTrustStorageKey(email));
                    return {
                        success: true,
                        otpRequired: true,
                        devOtp: response.data.devOtp || null,
                        debugOtp: response.data.devOtp || null
                    };
                }
                else {
                    // Direct login success path
                    const userData = response.data.user;
                    if (userData.roles && Array.isArray(userData.roles)) {
                        userData.roles = userData.roles.map((r) => r.toUpperCase());
                    }
                    try {
                        let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                        if (Array.isArray(mockMultiUsers))
                            mockMultiUsers = {}; // format migration
                        // Override clinics context
                        const cachedClinics = mockMultiUsers[email.trim().toLowerCase()];
                        const hasSingleClinicAssigned = Array.isArray(userData.clinics) && userData.clinics.length <= 1;
                        if (cachedClinics && !hasSingleClinicAssigned) {
                            userData.isMockUser = true;
                            userData.clinics = cachedClinics;
                        }
                        else if (email.trim().toLowerCase() === 'corporate@gmail.com') {
                            userData.isMockUser = true;
                            userData.clinics = MOCK_CLINICS.map(c => c.id);
                        }
                    }
                    catch (e) { /* ignore */ }
                    const token = response.data.token;
                    localStorage.setItem('ev_token', token);
                    localStorage.setItem('ev_user', JSON.stringify(userData));
                    // Store patientClinics for PATIENT clinic selection
                    if (userData.patientClinics && userData.patientClinics.length > 0) {
                        localStorage.setItem('ev_patient_clinics', JSON.stringify(userData.patientClinics));
                    }
                    setUser(userData);
                    setIsAuthenticated(true);
                    // Auto-select clinic if only one is available and not a super_admin
                    const isSuperAdmin = userData.roles?.some((r) => r.toUpperCase() === 'SUPER_ADMIN');
                    const isPatient = userData.role === 'PATIENT';
                    if (isPatient && userData.clinics?.length === 1) {
                        // Patient with single clinic → auto-select + redirect
                        try {
                            const patientClinic = userData.patientClinics?.[0];
                            await selectClinicById(userData.clinics[0], 'PATIENT');
                            if (patientClinic) {
                                const clinicData = { id: patientClinic.id, name: patientClinic.name, location: patientClinic.location, role: 'PATIENT' };
                                localStorage.setItem('ev_clinic', JSON.stringify(clinicData));
                                setSelectedClinic(clinicData);
                            }
                        }
                        catch (err) {
                            console.error('Auto-select clinic failed:', err);
                        }
                    }
                    else if (!isSuperAdmin && !isPatient && userData.clinics?.length === 1) {
                        try {
                            await selectClinicById(userData.clinics[0]);
                        }
                        catch (err) {
                            console.error('Auto-select clinic failed:', err);
                        }
                    }
                    return { success: true, otpRequired: false, user: userData };
                }
            }
            return {
                success: false,
                error: response.message || 'Authorization failed. Please check your credentials.'
            };
        }
        catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message || 'Unable to connect to service.'
            };
        }
    };
    const confirmOTP = async (email, otp) => {
        try {
            const response = await authService.verifyOTP({ email, otp });
            if (response.success) {
                const userData = response.data.user;
                if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map((r) => r.toUpperCase());
                }
                try {
                    let mockMultiUsers = JSON.parse(localStorage.getItem('ev_multi_clinic_users') || '{}');
                    if (Array.isArray(mockMultiUsers))
                        mockMultiUsers = {};
                    const cachedClinics = mockMultiUsers[email.trim().toLowerCase()];
                    const hasSingleClinicAssigned = Array.isArray(userData.clinics) && userData.clinics.length <= 1;
                    if (cachedClinics && !hasSingleClinicAssigned) {
                        userData.isMockUser = true;
                        userData.clinics = cachedClinics;
                    }
                    else if (email.trim().toLowerCase() === 'corporate@gmail.com') {
                        userData.isMockUser = true;
                        userData.clinics = MOCK_CLINICS.map(c => c.id);
                    }
                }
                catch (e) { /* ignore */ }
                const token = response.data.token;
                if (response.data.otpTrustToken && response.data.otpTrustedUntil) {
                    saveTrustedOtpToken(email, response.data.otpTrustToken, response.data.otpTrustedUntil);
                }
                localStorage.setItem('ev_token', token);
                localStorage.setItem('ev_user', JSON.stringify(userData));
                setUser(userData);
                setIsAuthenticated(true);
                // Auto-select clinic if only one is available and not a super_admin
                if (!userData.roles.includes('SUPER_ADMIN') && userData.clinics && userData.clinics.length === 1) {
                    await selectClinicById(userData.clinics[0]);
                }
                return { success: true, user: userData };
            }
            return { success: false, error: 'Verification failed' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    };
    const selectClinicById = async (clinicId, role) => {
        try {
            // Extract role from clinic list if not provided
            let targetRole = role;
            const clinics = await getUserClinics();
            const clinic = clinics.find((c) => c.id === clinicId);
            if (!targetRole && clinic) {
                targetRole = clinic.role;
            }
            const response = await authService.selectClinic(clinicId, targetRole || 'RECEPTIONIST');
            if (response.success) {
                const newToken = response.data.token;
                localStorage.setItem('ev_token', newToken);
                if (clinic) {
                    localStorage.setItem('ev_clinic', JSON.stringify(clinic));
                    setSelectedClinic(clinic);
                }
            }
        }
        catch (error) {
            console.error('Clinic selection failed:', error.message);
        }
    };
    const selectClinic = async (clinic) => {
        await selectClinicById(clinic.id, clinic.role);
    };
    const getUserClinics = async () => {
        try {
            const response = await authService.getMyClinics();
            return response.data || [];
        }
        catch (error) {
            return [];
        }
    };
    const logout = () => {
        setUser(null);
        setSelectedClinic(null);
        setIsAuthenticated(false);
        localStorage.removeItem('ev_token');
        localStorage.removeItem('ev_user');
        localStorage.removeItem('ev_clinic');
    };
    const handleRedirectByRole = (role) => {
        if (!role) {
            navigate('/');
            window.location.reload();
            return;
        }
        const r = role.toString().toUpperCase().trim();
        if (!r) {
            navigate('/');
            return;
        }
        if (r === 'SUPER_ADMIN')
            window.location.href = '/super-admin';
        else if (r === 'ADMIN' || r === 'CLINIC_ADMIN')
            window.location.href = '/clinic-admin';
        else if (r === 'DOCTOR')
            window.location.href = '/doctor';
        else if (r === 'RECEPTIONIST' || r === 'RECEPTION' || r === 'ADMISSION')
            window.location.href = '/reception';
        else if (r === 'PATIENT')
            window.location.href = '/patient';
        else if (r === 'PHARMACY')
            window.location.href = '/pharmacy';
        else if (r === 'LAB' || r === 'LABORATORY')
            window.location.href = '/lab';
        else if (r === 'RADIOLOGY' || r === 'RADIOLOGIST')
            window.location.href = '/radiology';
        else if (r === 'DOCUMENT_CONTROLLER')
            window.location.href = '/documents';
        else if (r === 'ACCOUNTING' || r === 'ACCOUNTS' || r === 'ACCOUNTANT')
            window.location.href = '/accounting';
        else
            window.location.href = '/';
    };
    const impersonate = async (userId) => {
        try {
            const response = await authService.impersonate(userId);
            if (response.success) {
                const userData = response.data.user;
                if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map((r) => r.toUpperCase());
                }
                const token = response.data.token;
                localStorage.setItem('ev_token', token);
                localStorage.setItem('ev_user', JSON.stringify(userData));
                localStorage.removeItem('ev_clinic'); // Clear clinic context on impersonation
                setUser(userData);
                setIsAuthenticated(true);
                // Auto-set clinic if available to avoid select-clinic call
                if (userData.clinics && userData.clinics.length > 0) {
                    const firstClinic = userData.clinics[0];
                    const clinicContext = {
                        id: firstClinic.id,
                        role: firstClinic.role,
                        name: firstClinic.name || ''
                    };
                    setSelectedClinic(clinicContext);
                    localStorage.setItem('ev_clinic', JSON.stringify(clinicContext));
                }
                // Redirect based on role
                const targetRole = userData.role || (userData.roles ? userData.roles[0] : null);
                handleRedirectByRole(targetRole);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Impersonation failed:', error);
            return false;
        }
    };
    const loginAsClinic = async (clinic) => {
        try {
            const response = await authService.impersonateClinic(clinic.id);
            if (response.success) {
                const userData = response.data.user;
                if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map((r) => r.toUpperCase());
                }
                const token = response.data.token;
                localStorage.setItem('ev_token', token);
                localStorage.setItem('ev_user', JSON.stringify(userData));
                // Use the clinic info provided or from response
                // CRITICAL: Ensure we have a valid clinic context with a ROLE.
                // The clinic object from Super Admin table might not have 'role'.
                // Since this is 'loginAsClinic', we assume we are becoming the ADMIN.
                let contextObj = clinic;
                if (!contextObj && userData.clinics && userData.clinics.length > 0) {
                    // If no clinic passed, use the first one from user data (which usually has id, role)
                    contextObj = userData.clinics[0];
                }
                if (contextObj) {
                    const matchedClinicName = Array.isArray(userData?.clinics)
                        ? userData.clinics.find((c) => Number(c?.id) === Number(contextObj.id))?.name
                        : '';
                    const cleanContext = {
                        id: contextObj.id,
                        name: contextObj.name || matchedClinicName || '',
                        role: contextObj.role || 'ADMIN', // Force ADMIN if missing
                        modules: contextObj.modules
                    };
                    localStorage.setItem('ev_clinic', JSON.stringify(cleanContext));
                    // setSelectedClinic(cleanContext); // Skipped to prevent React render cycle
                }
                // setUser(userData); // Skipped
                // setIsAuthenticated(true); // Skipped
                // Redirect based on role
                const targetRole = userData.role || (userData.roles ? userData.roles[0] : null);
                // Immediate hard redirect
                handleRedirectByRole(targetRole);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Clinic impersonation failed:', error);
            toast.error('Failed to login as clinic admin. Please ensure the clinic has at least one staff member.');
            return false;
        }
    };
    const resetFailedAttempts = () => {
        setFailedAttempts(0);
        setShowCaptcha(false);
    };
    const getAuditLogs = () => auditLogs;
    const changePassword = async (data) => {
        return await authService.changePassword(data);
    };
    const value = {
        user,
        selectedClinic,
        isAuthenticated,
        loading,
        failedAttempts,
        lockoutUntil,
        showCaptcha,
        login,
        confirmOTP,
        loginAsClinic,
        logout,
        selectClinic,
        getUserClinics,
        resetFailedAttempts,
        getAuditLogs,
        impersonate,
        handleRedirectByRole,
        changePassword,
        selectClinicById,
        verifyOTP: confirmOTP // Assuming verifyOTP is confirmOTP based on the context
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
