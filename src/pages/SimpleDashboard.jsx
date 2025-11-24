import React, { useEffect, useState } from 'react';
import axios from 'axios';

function SimpleDashboard() {
    const [data, setData] = useState({
        patients: [],
        appointments: [],
        summary: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('No token found. Please login first.');
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                // Get summary
                const summaryRes = await axios.get('http://localhost:5000/api/dashboard-summary', { headers });
                
                // Get patients
                const patientsRes = await axios.get('http://localhost:5000/api/doctor/my-patients', { headers });
                
                // Get appointments
                const appointmentsRes = await axios.get('http://localhost:5000/api/doctor/appointments', { headers });

                setData({
                    summary: summaryRes.data.summary || {},
                    patients: patientsRes.data.patients || [],
                    appointments: appointmentsRes.data.appointments || []
                });
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                alert('Error loading data: ' + error.message);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Doctor Dashboard - Simple View</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>
                        {data.summary.patientCount || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Assigned Patients</div>
                </div>

                <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2' }}>
                        {data.summary.upcomingAppointments || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Upcoming Appointments</div>
                </div>

                <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#388e3c' }}>
                        {data.summary.diagnosesCount || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Total Diagnoses</div>
                </div>
            </div>

            <h2>Patients ({data.patients.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                    <tr>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Blood Group</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Phone</th>
                    </tr>
                </thead>
                <tbody>
                    {data.patients.map((patient) => (
                        <tr key={patient.id}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {patient.first_name} {patient.last_name}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.email}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.blood_group}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{patient.phone}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Appointments ({data.appointments.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                    <tr>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Patient</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Reason</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.appointments.slice(0, 10).map((appt) => (
                        <tr key={appt.id}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {appt.first_name} {appt.last_name}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {new Date(appt.appointment_date).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{appt.reason}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: appt.status === 'completed' ? '#c8e6c9' : '#fff9c4',
                                    color: appt.status === 'completed' ? '#2e7d32' : '#f57f17'
                                }}>
                                    {appt.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SimpleDashboard;
