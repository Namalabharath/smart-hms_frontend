import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ZKPAuthService from '../services/zkpAuthService';
import './Dashboard.css';

function DashboardPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        ZKPAuthService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="dashboard-container"><p>Loading...</p></div>;
    }

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="navbar-brand">HMS</div>
                <div className="navbar-menu">
                    <span className="user-info">
                        {user?.username} ({user?.role})
                    </span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-box">
                    <h1>Welcome, {user?.username}!</h1>
                    <p>Hospital Management System with ZKP Authentication</p>

                    <div className="info-grid">
                        <div className="info-card">
                            <h3>Your Role</h3>
                            <p className="role-badge">{user?.role?.toUpperCase()}</p>
                        </div>

                        <div className="info-card">
                            <h3>Authentication</h3>
                            <p className="badge-success">ZKP Secured</p>
                        </div>

                        <div className="info-card">
                            <h3>Status</h3>
                            <p className="badge-success">Active</p>
                        </div>
                    </div>

                    <div className="features-section">
                        <h2>Available Features</h2>
                        <div className="features-grid">
                            {user?.role === 'doctor' && (
                                <>
                                    <div className="feature-item">
                                        <span className="feature-icon">👨‍⚕️</span>
                                        <h4>View Patients</h4>
                                        <p>See your assigned patients</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📋</span>
                                        <h4>Add Diagnosis</h4>
                                        <p>Record patient diagnoses</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">💊</span>
                                        <h4>Prescriptions</h4>
                                        <p>Create prescriptions</p>
                                    </div>
                                </>
                            )}

                            {user?.role === 'patient' && (
                                <>
                                    <div className="feature-item">
                                        <span className="feature-icon">📑</span>
                                        <h4>Medical Records</h4>
                                        <p>View your records</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📅</span>
                                        <h4>Appointments</h4>
                                        <p>Book appointments</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">💊</span>
                                        <h4>Prescriptions</h4>
                                        <p>View prescriptions</p>
                                    </div>
                                </>
                            )}

                            {user?.role === 'nurse' && (
                                <>
                                    <div className="feature-item">
                                        <span className="feature-icon">❤️</span>
                                        <h4>Vital Signs</h4>
                                        <p>Record vital signs</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">💊</span>
                                        <h4>Medications</h4>
                                        <p>Log medication admin</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📝</span>
                                        <h4>Progress Notes</h4>
                                        <p>Write progress notes</p>
                                    </div>
                                </>
                            )}

                            {user?.role === 'admin' && (
                                <>
                                    <div className="feature-item">
                                        <span className="feature-icon">👥</span>
                                        <h4>Manage Users</h4>
                                        <p>User administration</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">📊</span>
                                        <h4>Reports</h4>
                                        <p>System reports</p>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">🔍</span>
                                        <h4>Audit Logs</h4>
                                        <p>View audit logs</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="security-info">
                        <h3>🔒 Security Information</h3>
                        <ul>
                            <li><strong>Authentication:</strong> Zero Knowledge Proof (ZKP)</li>
                            <li><strong>Password:</strong> Never sent to server</li>
                            <li><strong>Proof:</strong> Cryptographically verified</li>
                            <li><strong>Session:</strong> JWT token based</li>
                            <li><strong>Data:</strong> Encrypted in transit and at rest</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
