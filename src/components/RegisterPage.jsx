import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHashAuthService from '../services/simpleHashAuthService';
import './Auth.css';

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient',
        firstName: '',
        lastName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        console.log('🔍 ===== REGISTRATION PROCESS STARTED =====');
        console.log('Form Data:', formData);

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validation Phase
            console.log('📋 PHASE 1: Frontend Validation');
            
            if (!formData.username?.trim()) {
                const errMsg = 'Username is required';
                console.error('❌', errMsg);
                setError(errMsg);
                setLoading(false);
                return;
            }

            if (!formData.email?.trim()) {
                const errMsg = 'Email is required';
                console.error('❌', errMsg);
                setError(errMsg);
                setLoading(false);
                return;
            }

            if (!formData.password) {
                const errMsg = 'Password is required';
                console.error('❌', errMsg);
                setError(errMsg);
                setLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                const errMsg = 'Passwords do not match';
                console.error('❌', errMsg);
                setError(errMsg);
                setLoading(false);
                return;
            }

            if (formData.password.length < 6) {
                const errMsg = 'Password must be at least 6 characters';
                console.error('❌', errMsg);
                setError(errMsg);
                setLoading(false);
                return;
            }

            console.log('✅ PHASE 1 COMPLETE: All validations passed');

            // API Call Phase
            console.log('📤 PHASE 2: Calling Registration API');
            console.log('Endpoint: POST /api/auth/register');

            const result = await SimpleHashAuthService.register(
                formData.username,
                formData.email,
                formData.password,
                formData.role,
                formData.firstName || 'User',
                formData.lastName || ''
            );

            console.log('📥 API Response:', result);

            if (result.success) {
                console.log('✅ PHASE 2 COMPLETE: User created successfully');
                console.log('New User ID:', result.user?.id);
                console.log('Username:', result.user?.username);
                
                console.log('📍 PHASE 3: Redirecting to login');
                setSuccess('Registration successful! Redirecting to login...');
                
                setTimeout(() => {
                    console.log('✅ Redirecting now');
                    navigate('/login');
                }, 2000);
            } else {
                const errMsg = result.error || 'Registration failed';
                console.error('❌ PHASE 2 FAILED:', errMsg);
                setError(errMsg);
            }

        } catch (err) {
            const errMsg = err.message || 'An unexpected error occurred';
            console.error('❌ EXCEPTION DURING REGISTRATION:', err);
            console.error('Error Message:', errMsg);
            setError(errMsg);
        } finally {
            setLoading(false);
            console.log('🔍 ===== REGISTRATION PROCESS ENDED =====\n');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box register-box">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join Hospital Management System</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                placeholder="First name"
                                value={formData.firstName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                placeholder="Last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Choose username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="nurse">Nurse</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="lab_technician">Lab Technician</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <div className="auth-link">
                        <p>
                            Already have an account?{' '}
                            <a href="/login">Sign in</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;
