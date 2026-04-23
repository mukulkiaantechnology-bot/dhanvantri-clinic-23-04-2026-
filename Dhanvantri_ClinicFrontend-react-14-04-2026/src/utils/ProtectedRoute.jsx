import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>);
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    if (allowedRoles) {
        const userRoles = (user?.roles || []).map((r) => r.toUpperCase());
        const isAllowed = allowedRoles.some(role => userRoles.includes(role.toUpperCase())) || userRoles.includes('SUPER_ADMIN');
        if (!isAllowed) {
            return <Navigate to="/unauthorized" replace/>;
        }
    }
    return <>{children}</>;
};
export default ProtectedRoute;
