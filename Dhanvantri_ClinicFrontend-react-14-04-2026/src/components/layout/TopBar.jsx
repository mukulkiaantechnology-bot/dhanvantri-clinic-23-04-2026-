import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiChevronDown, FiBell, FiLogOut, FiUser, FiMenu, FiClock } from 'react-icons/fi';
import { departmentService } from '../../services/department.service';
import { API_URL } from '../../config/config';
import './TopBar.css';
const TopBar = ({ onToggleSidebar }) => {
    const { user, selectedClinic, getUserClinics, selectClinic, logout } = useAuth();
    const [isClinicDropdownOpen, setIsClinicDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationsList, setNotificationsList] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [userClinics, setUserClinics] = useState([]);
    const location = useLocation();
    const notificationRef = useRef(null);
    const logoutAndRedirect = () => {
        logout();
        window.location.href = '/login';
    };
    const isPatientView = user?.roles?.includes('PATIENT') || location.pathname.includes('/patient') || location.pathname.startsWith('/book');
    const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
    // Corporate Admin = ADMIN with multiple clinics assigned (check async userClinics OR static user.clinics from JWT)
    const assignedClinicsCount = userClinics.length > 0 ? userClinics.length : (user?.clinics?.length || 0);
    const isCorporateAdmin = !isSuperAdmin && (user?.roles?.includes('ADMIN') || user?.role === 'ADMIN') && assignedClinicsCount > 1;
    const showPlatformPill = isCorporateAdmin;
    // Combined clinics list: prefer async-fetched, fallback to user.clinics for display
    const displayClinics = userClinics.length > 0 ? userClinics : (user?.clinics || []);
    const activeClinicId = selectedClinic?.id || userClinics[0]?.id;
    let fallbackPillName = selectedClinic?.name || userClinics[0]?.name;
    if (!fallbackPillName && activeClinicId) {
        if (activeClinicId === 10)
            fallbackPillName = 'Husri Clinic';
        else if (activeClinicId === 13)
            fallbackPillName = 'proclinic';
        else if (activeClinicId === 14)
            fallbackPillName = "test 's Clinic";
        else
            fallbackPillName = `Center Set #${activeClinicId}`;
    }
    const selectedClinicIndex = displayClinics.findIndex((c) => Number(c?.id ?? c) === Number(selectedClinic?.id));
    const orderedClinics = selectedClinicIndex > 0
        ? [displayClinics[selectedClinicIndex], ...displayClinics.filter((_, idx) => idx !== selectedClinicIndex)]
        : displayClinics;
    const platformPillLabel = fallbackPillName || 'Select Center';
    useEffect(() => {
        const fetchUserClinics = async () => {
            if (!user)
                return;
            const isPatient = user?.role === 'PATIENT' || user?.roles?.includes('PATIENT');
            if (isPatient) {
                const storedPatientClinics = localStorage.getItem('ev_patient_clinics');
                if (storedPatientClinics) {
                    try {
                        const patientClinics = JSON.parse(storedPatientClinics);
                        setUserClinics(patientClinics.map((pc) => ({
                            id: pc.id,
                            name: pc.name,
                            location: pc.location,
                            role: 'PATIENT',
                            patientId: pc.patientId
                        })));
                        return;
                    }
                    catch (e) {
                        // ignore
                    }
                }
                if (user?.clinics)
                    setUserClinics(user.clinics);
            }
            else {
                const data = await getUserClinics();
                setUserClinics(data || []);
            }
        };
        fetchUserClinics();
    }, [user, getUserClinics]);
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user)
                return;
            if (user.isMockUser) {
                setNotificationCount(0);
                return;
            }
            try {
                // Determine appropriate department for count badge
                let dept = undefined;
                const roles = user.roles || [];
                if (roles.includes('PHARMACY') || roles.includes('PHARMACIST'))
                    dept = 'pharmacy';
                else if (roles.includes('LAB') || roles.includes('LAB_TECHNICIAN'))
                    dept = 'laboratory';
                else if (roles.includes('RADIOLOGY'))
                    dept = 'radiology';
                // Get count for badge
                const countRes = await departmentService.getUnreadCount(dept);
                const count = countRes?.count ?? countRes?.data?.count ?? 0;
                setNotificationCount(count);
                // If open, fetch actual list
                if (isNotificationsOpen) {
                    const listRes = await departmentService.getNotifications();
                    const fullList = listRes?.data ?? listRes ?? [];
                    // Filter to show only today's notifications
                    const today = new Date().toDateString();
                    const todaysList = fullList.filter((n) => new Date(n.createdAt).toDateString() === today);
                    setNotificationsList(todaysList);
                }
            }
            catch (e) {
                console.error('Failed to fetch notifications', e);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [user, isNotificationsOpen]);
    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const formatNotificationMessage = (msg) => {
        if (typeof msg !== 'string')
            return msg;
        try {
            const parsed = JSON.parse(msg);
            if (typeof parsed !== 'object' || parsed === null)
                return msg;
            return parsed.message || parsed.description || parsed.content || (parsed.type ? `${parsed.type} Notification` : msg);
        }
        catch {
            return msg;
        }
    };
    return (<header className={`topbar no-print ${isPatientView ? 'patient-nav' : ''}`}>
            <div className="topbar-left">
                <button className="mobile-toggle" onClick={onToggleSidebar}>
                    <FiMenu />
                </button>
                {isSuperAdmin ? null : (showPlatformPill ? (<div className={`ev-platform-pill ${displayClinics.length > 1 ? 'clickable' : ''}`} onClick={() => displayClinics.length > 1 && setIsClinicDropdownOpen(!isClinicDropdownOpen)}>
                        <img src={(selectedClinic?.logo && !location.pathname.startsWith('/super-admin')) ? (selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${API_URL.replace(/\/api$/, '')}${selectedClinic.logo.startsWith('/') ? selectedClinic.logo : `/${selectedClinic.logo}`}`) : "/sidebar-logo.jpg"} alt="Logo" style={{ width: '24px', height: '24px', marginRight: '8px', borderRadius: '4px', objectFit: 'contain' }}/>
                        <span>{platformPillLabel}</span>
                        {displayClinics.length > 1 && <FiChevronDown className={`chevron ${isClinicDropdownOpen ? 'open' : ''}`}/>}

                        {isClinicDropdownOpen && (<div className="clinic-dropdown" onClick={e => e.stopPropagation()}>
                                {isCorporateAdmin && (<div style={{ padding: '8px 12px 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Your Assigned Centers
                                    </div>)}
                                {orderedClinics.map((clinic) => {
                    const cId = clinic?.id ?? clinic;
                    let cName = clinic?.name;
                    if (!cName) {
                        if (cId === 10)
                            cName = 'Husri Clinic';
                        else if (cId === 13)
                            cName = 'proclinic';
                        else if (cId === 14)
                            cName = "test 's Clinic";
                        else
                            cName = `Center Set #${cId}`;
                    }
                    return (<div key={cId} className={`clinic-option ${selectedClinic?.id === cId ? 'active' : ''}`} onClick={(e) => {
                            e.stopPropagation();
                            selectClinic(clinic?.id ? clinic : { id: cId, name: cName, role: 'ADMIN' });
                            setIsClinicDropdownOpen(false);
                        }}>
                                            <span>{cName}</span>
                                            {selectedClinic?.id === cId && <div className="active-indicator"></div>}
                                        </div>);
                })}
                            </div>)}
                    </div>) : (<div className={`clinic-selector ${displayClinics.length > 1 ? 'clickable' : ''}`} onClick={() => displayClinics.length > 1 && setIsClinicDropdownOpen(!isClinicDropdownOpen)}>
                        <img src={selectedClinic?.logo ? (selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${API_URL.replace(/\/api$/, '')}${selectedClinic.logo.startsWith('/') ? selectedClinic.logo : `/${selectedClinic.logo}`}`) : "/sidebar-logo.jpg"} alt="Logo" className="clinic-icon" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }}/>
                        <span className="clinic-name">{fallbackPillName || 'Clinic'}</span>
                        {displayClinics.length > 1 && <FiChevronDown className={`chevron ${isClinicDropdownOpen ? 'open' : ''}`}/>}

                        {isClinicDropdownOpen && (<div className="clinic-dropdown">
                                {displayClinics.map((clinic) => {
                    const cId = clinic?.id ?? clinic;
                    let cName = clinic?.name;
                    // Fallback dictionary for legacy cached IDs
                    if (!cName) {
                        if (cId === 10)
                            cName = 'Husri Clinic';
                        else if (cId === 13)
                            cName = 'proclinic';
                        else if (cId === 14)
                            cName = "test 's Clinic";
                        else
                            cName = `Center Set #${cId}`;
                    }
                    return (<div key={cId} className={`clinic-option ${selectedClinic?.id === cId ? 'active' : ''}`} onClick={(e) => {
                            e.stopPropagation();
                            selectClinic(clinic?.id ? clinic : { id: cId, name: cName, role: 'ADMIN' });
                            setIsClinicDropdownOpen(false);
                        }}>
                                            <span>{cName}</span>
                                            {selectedClinic?.id === cId && <div className="active-indicator"></div>}
                                        </div>);
                })}
                            </div>)}
                    </div>))}
            </div>



            <div className="topbar-right">
                <div className="notification-wrapper" ref={notificationRef}>
                    <button className="notification-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                        <FiBell />
                        {notificationCount > 0 && <span className="notification-dot"></span>}
                    </button>
                    {isNotificationsOpen && (<div className="notifications-dropdown">
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                            </div>
                            <div className="notifications-list">
                                {notificationsList.length > 0 ? (notificationsList.map((n) => (<div key={n.id} className={`notification-item ${n.status === 'unread' ? 'unread' : ''}`}>
                                            <div className="notif-icon"><FiClock /></div>
                                            <div className="notif-content">
                                                <p>{formatNotificationMessage(n.message)}</p>
                                                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>))) : (<div className="empty-notifications">
                                        <FiBell size={24}/>
                                        <p>No new notifications</p>
                                    </div>)}
                            </div>
                        </div>)}
                </div>

                {!isPatientView && (<span className="user-role-label">
                        {location.pathname.startsWith('/clinic-admin') ? 'ADMIN' : user?.roles?.[0]?.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>)}
                {isPatientView && <span className="patient-label">Patient</span>}

                <div className="user-profile" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                    <div className="user-avatar">
                        <FiUser />
                    </div>

                    {isProfileDropdownOpen && (<div className="profile-dropdown">
                            <div className="profile-header">
                                <div className="profile-avatar-large">
                                    <FiUser />
                                </div>
                                <div className="profile-info">
                                    <h4>{user?.name || 'User'}</h4>
                                    <p className="capitalize">{user?.roles?.[0]?.replace('_', ' ') || 'PATIENT'}</p>
                                </div>
                            </div>
                            <div className="profile-divider"></div>
                            {user && (<button className="profile-menu-item logout" onClick={logoutAndRedirect}>
                                    <FiLogOut />
                                    <span>Sign Out</span>
                                </button>)}
                            {!user && (<button className="profile-menu-item" onClick={() => window.location.href = '/login'}>
                                    <FiUser />
                                    <span>Login</span>
                                </button>)}
                        </div>)}
                </div>
            </div>
        </header>);
};
export default TopBar;
