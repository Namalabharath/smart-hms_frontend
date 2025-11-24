/* eslint-disable no-undef */
import api from './api';

class ZKPAuthService {
    // ZKP Parameters
    static ZKP_PARAMS = {
        g: 2n,
        p: BigInt(1000000000000000007)
    };

    /**
     * Register new user
     */
    static async register(username, email, password, role, firstName, lastName) {
        try {
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
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    }

    /**
     * LOGIN STEP 1: Initiate proof
     */
    static async loginInitiate(username) {
        try {
            const response = await api.post('/auth/login/initiate', { username });

            if (!response.data.success) {
                return {
                    success: false,
                    error: response.data.error
                };
            }

            // Store session info
            sessionStorage.setItem('zkp_session_id', response.data.session_id);
            sessionStorage.setItem('zkp_challenge', response.data.challenge);

            return {
                success: true,
                session_id: response.data.session_id,
                challenge: response.data.challenge
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login initiation failed'
            };
        }
    }

    /**
     * Derive secret from password (SHA-256 equivalent for browser)
     */
    static async getSecretFromPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return BigInt('0x' + hashHex);
    }

    /**
     * LOGIN STEP 2: Generate proof
     * Client generates random r, computes t=2^r, then computes s=r+c*x
     */
    static async generateProof(password, challenge) {
        try {
            console.log('🔐 CLIENT GENERATING PROOF:');
            console.log('  challenge:', challenge?.substring?.(0, 50));
            
            // Derive secret from password
            const secret_x = await this.getSecretFromPassword(password);
            console.log('  secret_x:', secret_x.toString().substring(0, 50));

            // Generate random r for THIS LOGIN ATTEMPT
            const random_r = await this.generateRandomBigInt();

            // Calculate t = 2^r mod p (commitment that will be verified)
            const t = this.modularExponentiation(
                this.ZKP_PARAMS.g,
                random_r,
                this.ZKP_PARAMS.p
            );
            console.log('  t (2^r mod p):', t.toString().substring(0, 50));

            // Calculate proof s = r + (c × x)
            const c = BigInt(challenge);
            const proof_s = random_r + (c * secret_x);
            console.log('  s (r + c*x):', proof_s.toString().substring(0, 50));

            return {
                success: true,
                t_value: t.toString(),
                proof_s: proof_s.toString()
            };

        } catch (error) {
            return {
                success: false,
                error: 'Failed to generate proof: ' + error.message
            };
        }
    }

    /**
     * LOGIN STEP 3: Verify proof
     */
    static async loginVerify(proof_s, t_value) {
        try {
            const session_id = sessionStorage.getItem('zkp_session_id');

            if (!session_id) {
                return {
                    success: false,
                    error: 'Session expired. Please try again.'
                };
            }

            console.log('🔐 CLIENT SENDING VERIFICATION:');
            console.log('  session_id:', session_id);
            console.log('  proof_s length:', proof_s?.length, 'value:', proof_s?.substring?.(0, 50));
            console.log('  t_value:', t_value?.substring?.(0, 50));

            const response = await api.post('/auth/login/verify', {
                session_id,
                proof_s,
                t_value
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

            // Clear session data
            sessionStorage.removeItem('zkp_session_id');
            sessionStorage.removeItem('zkp_challenge');
            sessionStorage.removeItem('zkp_t_value');

            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Verification failed'
            };
        }
    }

    /**
     * Complete login flow
     */
    static async login(username, password) {
        try {
            // Step 1: Initiate (get session_id and challenge from server)
            const initiateResult = await this.loginInitiate(username);
            if (!initiateResult.success) {
                return initiateResult;
            }

            // Step 2: Generate proof (compute t and s)
            const proofResult = await this.generateProof(password, initiateResult.challenge);
            if (!proofResult.success) {
                return proofResult;
            }

            // Step 3: Verify proof (send t and s to server for verification)
            const verifyResult = await this.loginVerify(proofResult.proof_s, proofResult.t_value);

            return verifyResult;

        } catch (error) {
            return {
                success: false,
                error: 'Login failed: ' + error.message
            };
        }
    }

    /**
     * Generate random BigInt
     */
    static async generateRandomBigInt() {
        const array = new Uint32Array(8);
        crypto.getRandomValues(array);
        
        let hexString = '';
        for (let i = 0; i < array.length; i++) {
            hexString += array[i].toString(16).padStart(8, '0');
        }
        
        return BigInt('0x' + hexString);
    }

    /**
     * Modular exponentiation
     */
    static modularExponentiation(base, exponent, modulus) {
        if (modulus === 1n) return 0n;

        let result = 1n;
        base = base % modulus;

        while (exponent > 0n) {
            if (exponent % 2n === 1n) {
                result = (result * base) % modulus;
            }
            exponent = exponent >> 1n;
            base = (base * base) % modulus;
        }

        return result;
    }

    /**
     * Logout
     */
    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('zkp_session_id');
        sessionStorage.removeItem('zkp_challenge');
    }
}

export default ZKPAuthService;
