import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import SimpleDashboard from './pages/SimpleDashboard';
import TestDashboard from './pages/TestDashboard';
import DebugPage from './pages/DebugPage';
import ComprehensiveDashboard from './pages/ComprehensiveDashboard';
import ReceptionistDashboard from './pages/Receptionist/ReceptionistDashboard';
import PharmacistDashboard from './pages/Pharmacist/PharmacistDashboard';
import LabTechnicianDashboard from './pages/LabTechnician/LabTechnicianDashboard';
import InventoryManagerDashboard from './pages/InventoryManager/InventoryManagerDashboard';
import NurseDashboard from './pages/Nurse/NurseDashboard';
import EnhancedPatientDashboard from './pages/Patient/EnhancedPatientDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Get user's role-specific dashboard path
const getRolePath = (role) => {
    switch (role) {
        case 'receptionist':
            return '/receptionist';
        case 'patient':
            return '/patient';
        case 'pharmacist':
            return '/pharmacist';
        case 'doctor':
            return '/doctor';
        case 'nurse':
            return '/nurse';
        case 'lab_technician':
            return '/lab-technician';
        case 'inventory_manager':
            return '/inventory-manager';
        case 'admin':
            return '/admin';
        default:
            return '/';
    }
};

// Check if user is authenticated
const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
};

// Get user's role
const getUserRole = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        return user.role;
    } catch {
        return null;
    }
};

function App() {
    // Clear localStorage on app startup - fresh login required
    React.useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Debug Routes */}
                <Route path="/test" element={<TestDashboard />} />
                <Route path="/debug" element={<DebugPage />} />
                <Route path="/simple-dashboard" element={<SimpleDashboard />} />

                {/* Role-Based Protected Routes */}
                <Route
                    path="/receptionist"
                    element={
                        <ProtectedRoute requiredRole="receptionist">
                            <ReceptionistDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/doctor"
                    element={
                        <ProtectedRoute requiredRole="doctor">
                            <ComprehensiveDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/patient"
                    element={
                        <ProtectedRoute requiredRole="patient">
                            <EnhancedPatientDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/nurse"
                    element={
                        <ProtectedRoute requiredRole="nurse">
                            <NurseDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pharmacist"
                    element={
                        <ProtectedRoute requiredRole="pharmacist">
                            <PharmacistDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/lab-technician"
                    element={
                        <ProtectedRoute requiredRole="lab_technician">
                            <LabTechnicianDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory-manager"
                    element={
                        <ProtectedRoute requiredRole="inventory_manager">
                            <InventoryManagerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <ComprehensiveDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback Routes */}
                <Route 
                    path="/" 
                    element={
                        isAuthenticated() 
                            ? <Navigate to={getRolePath(getUserRole())} replace />
                            : <Navigate to="/login" replace />
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
