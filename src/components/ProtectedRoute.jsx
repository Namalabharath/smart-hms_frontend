import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    // Check if authenticated
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        // Check if user has required role
        if (requiredRole && user.role !== requiredRole) {
            // User has wrong role - redirect to their correct dashboard
            const rolePathMap = {
                'receptionist': '/receptionist',
                'patient': '/patient',
                'pharmacist': '/pharmacist',
                'doctor': '/doctor',
                'nurse': '/nurse',
                'lab_technician': '/lab-technician',
                'inventory_manager': '/inventory-manager',
                'admin': '/admin'
            };
            const correctPath = rolePathMap[user.role] || '/login';
            return <Navigate to={correctPath} replace />;
        }
        
        return children;
    } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoute;
