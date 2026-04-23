import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './DashboardLayout.css';
const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    // Close sidebar on mobile when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    const isPatientPath = location.pathname.includes('/patient') || location.pathname.startsWith('/book');
    return (<div className={`dashboard-layout ${isPatientPath ? 'patient-layout' : ''}`}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}/>
            <div className="dashboard-main">
                <TopBar onToggleSidebar={toggleSidebar}/>
                <main className="dashboard-content animate-fade-in">
                    {children}
                </main>
            </div>
            {/* Overlay for mobile */}
            {isSidebarOpen && (<div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>)}
        </div>);
};
export default DashboardLayout;
