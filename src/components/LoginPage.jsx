import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHashAuthService from '../services/simpleHashAuthService';
import ZKPAuthService from '../services/zkpAuthService';
import './Auth.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!username || !password) {
                setError('Please enter username and password');
                setLoading(false);
                return;
            }

            const result = await SimpleHashAuthService.login(username, password);

            if (result.success) {
                // Redirect based on user role
                const user = result.user;
                let redirectPath = '/';
                
                switch (user.role) {
                    case 'receptionist':
                        redirectPath = '/receptionist';
                        break;
                    case 'patient':
                        redirectPath = '/patient';
                        break;
                    case 'pharmacist':
                        redirectPath = '/pharmacist';
                        break;
                    case 'doctor':
                        redirectPath = '/doctor';
                        break;
                    case 'nurse':
                        redirectPath = '/nurse';
                        break;
                    case 'lab_technician':
                        redirectPath = '/lab-technician';
                        break;
                    case 'inventory_manager':
                        redirectPath = '/inventory-manager';
                        break;
                    case 'admin':
                        redirectPath = '/admin';
                        break;
                    default:
                        redirectPath = '/';
                }
                
                navigate(redirectPath);
            } else {
                setError(result.error);
            }

        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleZKPLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!username || !password) {
                setError('Please enter username and password for ZKP login');
                setLoading(false);
                return;
            }

            const result = await ZKPAuthService.login(username, password);

            if (result.success) {
                const user = result.user;
                let redirectPath = '/';
                switch (user.role) {
                    case 'receptionist': redirectPath = '/receptionist'; break;
                    case 'patient': redirectPath = '/patient'; break;
                    case 'pharmacist': redirectPath = '/pharmacist'; break;
                    case 'doctor': redirectPath = '/doctor'; break;
                    case 'nurse': redirectPath = '/nurse'; break;
                    case 'lab_technician': redirectPath = '/lab-technician'; break;
                    case 'inventory_manager': redirectPath = '/inventory-manager'; break;
                    case 'admin': redirectPath = '/admin'; break;
                    default: redirectPath = '/';
                }
                navigate(redirectPath);
            } else {
                setError(result.error || 'ZKP login failed');
            }

        } catch (err) {
            setError(err.message || 'ZKP Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <h1>Hospital Management System</h1>
                    <p>Secure Authentication</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    {/* ZKP login button temporarily hidden per request */}
                    {/*
                    <button type="button" disabled={loading} onClick={handleZKPLogin} className="secondary-btn">
                        {loading ? 'Processing...' : 'Sign In with ZKP'}
                    </button>
                    */}

                    <div className="auth-link">
                        <p>
                            Don't have an account?{' '}
                            <a href="/register">Sign up</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
