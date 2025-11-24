import api from './api';

class LoginService {
    /**
     * SIMPLE AUTHENTICATION
     * Formula: hash = SHA256(SHA256(password) + "hospital2025")
     * Backend stores hash, we send just username+password
     * Server computes same hash and compares
     */

    static async login(username, password) {
        try {
            console.log('🔐 Sending login request:', username);
            
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

            // Store token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            console.log('✅ Login successful!');
            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };

        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    }

    static async register(username, email, password, role, firstName, lastName) {
        try {
            console.log('📝 Registering user:', username);
            
            const response = await api.post('/auth/register', {
                username,
                email,
                password,
                role,
                firstName,
                lastName
            });

            return {
                success: true,
                message: 'Registration successful! You can now login.',
                user: response.data.user
            };
        } catch (error) {
            console.error('❌ Registration error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}

export default LoginService;
