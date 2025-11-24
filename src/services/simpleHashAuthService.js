/* eslint-disable no-undef */
import api from './api';

class SimpleHashAuthService {
    /**
     * Register new user
     */
    static async register(username, email, password, role, firstName, lastName) {
        try {
            console.log('📝 REGISTRATION REQUEST:', { username, email, role });
            
            const response = await api.post('/auth/register', {
                username,
                email,
                password,
                role,
                firstName,
                lastName
            });

            console.log('✅ REGISTRATION SUCCESS:', response.data);

            return {
                success: true,
                message: 'Registration successful! You can now login.',
                user: response.data.user
            };
        } catch (error) {
            console.error('❌ REGISTRATION ERROR:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    }

    /**
     * Login with username and password
     */
    static async login(username, password) {
        try {
            console.log('🔐 LOGIN ATTEMPT:', { username, passwordLength: password.length });
            
            const response = await api.post('/auth/login', {
                username,
                password
            });

            if (!response.data.success) {
                return {
                    success: false,
                    error: response.data.error
                };
            }

            console.log('✅ LOGIN SUCCESS');
            
            // Store token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };

        } catch (error) {
            console.error('❌ LOGIN FAILED:', error.response?.data?.error || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    }

    /**
     * Logout
     */
    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    /**
     * Get current user
     */
    static async getCurrentUser() {
        try {
            const response = await api.get('/auth/me');
            return response.data.user;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if user is logged in
     */
    static isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    /**
     * Get stored user info
     */
    static getStoredUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}

export default SimpleHashAuthService;
