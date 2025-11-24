import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DebugPage() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const test = async () => {
            try {
                addLog('Page loaded, checking localStorage...');
                const token = localStorage.getItem('token');
                const user = localStorage.getItem('user');
                
                addLog(`Token exists: ${!!token}`);
                addLog(`User exists: ${!!user}`);
                
                if (user) {
                    addLog(`User data: ${user}`);
                }
                
                if (token && user) {
                    addLog('Making API call...');
                    const headers = { Authorization: `Bearer ${token}` };
                    const response = await axios.get('http://localhost:5000/api/dashboard-summary', { headers, timeout: 5000 });
                    addLog(`API Success: ${JSON.stringify(response.data)}`);
                } else {
                    addLog('Missing token or user - please login first');
                }
            } catch (error) {
                addLog(`ERROR: ${error.message}`);
                if (error.response) {
                    addLog(`Response status: ${error.response.status}`);
                    addLog(`Response data: ${JSON.stringify(error.response.data)}`);
                }
            }
        };
        
        test();
    }, []);

    const addLog = (message) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Debug Log</h1>
            <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px', maxHeight: '400px', overflowY: 'auto' }}>
                {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DebugPage;
