import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TestDashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const testAPI = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Token from localStorage:', token ? 'exists' : 'missing');
                
                if (!token) {
                    setError('No token found');
                    return;
                }
                
                const headers = { Authorization: `Bearer ${token}` };
                console.log('Making API call with headers:', headers);
                
                const res = await axios.get('http://localhost:5000/api/dashboard-summary', { headers });
                console.log('API Response:', res.data);
                setData(res.data);
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
            }
        };
        
        testAPI();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Dashboard</h1>
            <p>Token in localStorage: {localStorage.getItem('token') ? 'YES' : 'NO'}</p>
            <p>User in localStorage: {localStorage.getItem('user') ? 'YES' : 'NO'}</p>
            
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            
            {data && (
                <div>
                    <h2>API Response:</h2>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default TestDashboard;
