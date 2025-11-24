import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ComprehensiveDashboard.css';

function ComprehensiveDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({});
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState({});
    const [selectedPatient, setSelectedPatient] = useState(null);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
            navigate('/login');
            return;
        }
        
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadDashboardData(parsedUser.role, token);
    }, [navigate]);

    const loadDashboardData = async (role, token) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            console.log('Loading dashboard data for role:', role);
            console.log('Using token:', token.substring(0, 50) + '...');
            
            // Load summary
            console.log('Making request to:', `${API_URL}/dashboard-summary`);
            const summaryRes = await axios.get(`${API_URL}/dashboard-summary`, { headers, timeout: 10000 });
            console.log('Summary response:', summaryRes.data);
            if (summaryRes.data.success) {
                console.log('Setting summary:', summaryRes.data.summary);
                setSummary(summaryRes.data.summary);
            } else {
                console.error('Summary API returned success: false');
            }
            
            // Role-specific data
            if (role === 'doctor') {
                console.log('Fetching doctor-specific data...');
                const patientsRes = await axios.get(`${API_URL}/doctor/my-patients`, { headers, timeout: 10000 });
                console.log('Patients response:', patientsRes.data);
                if (patientsRes.data.success) {
                    console.log('Setting patients:', patientsRes.data.patients);
                    setPatients(patientsRes.data.patients);
                } else {
                    console.error('Patients API returned success: false');
                    setPatients([]);
                }
                
                const appointmentsRes = await axios.get(`${API_URL}/doctor/appointments`, { headers, timeout: 10000 });
                console.log('Appointments response:', appointmentsRes.data);
                if (appointmentsRes.data.success) {
                    console.log('Setting appointments:', appointmentsRes.data.appointments);
                    setAppointments(appointmentsRes.data.appointments);
                } else {
                    console.error('Appointments API returned success: false');
                    setAppointments([]);
                }
            } else if (role === 'patient') {
                const recordsRes = await axios.get(`${API_URL}/patient/my-records`, { headers });
                if (recordsRes.data.success) {
                    setRecords({
                        diagnoses: recordsRes.data.diagnoses,
                        prescriptions: recordsRes.data.prescriptions,
                        vitals: recordsRes.data.vitals
                    });
                }
                
                const appointmentsRes = await axios.get(`${API_URL}/patient/appointments`, { headers });
                if (appointmentsRes.data.success) {
                    setAppointments(appointmentsRes.data.appointments);
                }
            } else if (role === 'nurse') {
                const patientsRes = await axios.get(`${API_URL}/nurse/patients`, { headers });
                if (patientsRes.data.success) {
                    setPatients(patientsRes.data.patients);
                }
            } else if (role === 'admin') {
                const appointmentsRes = await axios.get(`${API_URL}/admin/appointments`, { headers });
                if (appointmentsRes.data.success) {
                    setAppointments(appointmentsRes.data.appointments);
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response?.data);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleViewPatientDetails = async (patientId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/doctor/patient/${patientId}`, { headers });
            if (res.data.success) {
                setSelectedPatient(res.data);
                setActiveTab('patient-details');
            }
        } catch (error) {
            console.error('Error fetching patient details:', error);
        }
    };

    if (loading) {
        return <div className="dashboard-container"><p>Loading...</p></div>;
    }

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="navbar-brand">🏥 HMS</div>
                <div className="navbar-center">
                    <span className="role-badge">{user?.role?.toUpperCase()}</span>
                </div>
                <div className="navbar-menu">
                    <span className="user-info">{user?.username}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="tabs-nav">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    {user?.role === 'doctor' && (
                        <>
                            <button
                                className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
                                onClick={() => setActiveTab('patients')}
                            >
                                👥 My Patients ({patients.length})
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('appointments')}
                            >
                                📅 Schedule ({appointments.length})
                            </button>
                        </>
                    )}
                    {user?.role === 'patient' && (
                        <>
                            <button
                                className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
                                onClick={() => setActiveTab('records')}
                            >
                                📋 Medical Records
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('appointments')}
                            >
                                📅 Appointments ({appointments.length})
                            </button>
                        </>
                    )}
                    {user?.role === 'nurse' && (
                        <>
                            <button
                                className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
                                onClick={() => setActiveTab('vitals')}
                            >
                                ❤️ Record Vitals
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
                                onClick={() => setActiveTab('patients')}
                            >
                                👥 Patients ({patients.length})
                            </button>
                        </>
                    )}
                </div>

                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <h1>Welcome, {user?.username}! 👋</h1>
                        <div className="summary-grid">
                            {user?.role === 'doctor' && (
                                <>
                                    <div className="summary-card">
                                        <div className="card-icon">👥</div>
                                        <div className="card-content">
                                            <div className="card-number">{summary.patientCount || 0}</div>
                                            <div className="card-label">Assigned Patients</div>
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <div className="card-icon">📅</div>
                                        <div className="card-content">
                                            <div className="card-number">{summary.upcomingAppointments || 0}</div>
                                            <div className="card-label">Upcoming Appointments</div>
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <div className="card-icon">🔬</div>
                                        <div className="card-content">
                                            <div className="card-number">{summary.diagnosesCount || 0}</div>
                                            <div className="card-label">Total Diagnoses</div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {user?.role === 'patient' && (
                                <>
                                    <div className="summary-card">
                                        <div className="card-icon">📅</div>
                                        <div className="card-content">
                                            <div className="card-number">{summary.upcomingAppointments || 0}</div>
                                            <div className="card-label">Upcoming Appointments</div>
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <div className="card-icon">🔬</div>
                                        <div className="card-content">
                                            <div className="card-number">{summary.diagnosesCount || 0}</div>
                                            <div className="card-label">Your Diagnoses</div>
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <div className="card-icon">💊</div>
                                        <div className="card-content">
                                            <div className="card-number">{summary.prescriptionsCount || 0}</div>
                                            <div className="card-label">Active Prescriptions</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'patients' && user?.role === 'doctor' && (
                    <div className="tab-content">
                        <h2>👥 My Assigned Patients</h2>
                        {patients.length === 0 ? (
                            <p className="no-data">No patients assigned yet</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Blood Group</th>
                                            <th>Phone</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map(patient => (
                                            <tr key={patient.id}>
                                                <td><strong>{patient.first_name} {patient.last_name}</strong></td>
                                                <td>{patient.email}</td>
                                                <td><span className="badge">{patient.blood_group}</span></td>
                                                <td>{patient.phone}</td>
                                                <td>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleViewPatientDetails(patient.patient_id)}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'patient-details' && selectedPatient && (
                    <div className="tab-content">
                        <button className="back-btn" onClick={() => setActiveTab('patients')}>← Back to Patients</button>
                        <h2>Patient: <strong>{selectedPatient.patient.first_name} {selectedPatient.patient.last_name}</strong></h2>
                        
                        <div className="patient-details">
                            <div className="detail-section">
                                <h3>📋 Patient Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="label">Email:</span>
                                        <span>{selectedPatient.patient.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Blood Group:</span>
                                        <span><strong>{selectedPatient.patient.blood_group}</strong></span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Phone:</span>
                                        <span>{selectedPatient.patient.phone}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Allergies:</span>
                                        <span>{selectedPatient.patient.allergies || 'None known'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>🔬 Recent Diagnoses</h3>
                                {selectedPatient.diagnoses.length === 0 ? (
                                    <p>No diagnoses recorded</p>
                                ) : (
                                    <ul className="list">
                                        {selectedPatient.diagnoses.map(d => (
                                            <li key={d.id}>
                                                <strong>{d.diagnosis_name}</strong>
                                                <span className={`severity-${d.severity}`}>{d.severity.toUpperCase()}</span>
                                                <p><small>{d.description}</small></p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="detail-section">
                                <h3>💊 Current Prescriptions</h3>
                                {selectedPatient.prescriptions.length === 0 ? (
                                    <p>No prescriptions</p>
                                ) : (
                                    <div className="prescriptions-list">
                                        {selectedPatient.prescriptions.map(p => (
                                            <div key={p.id} className="prescription-card">
                                                <h4>{p.medication_name}</h4>
                                                <p><strong>Strength:</strong> {p.strength}</p>
                                                <p><strong>Dosage:</strong> {p.dosage}</p>
                                                <p><strong>Frequency:</strong> {p.frequency}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="detail-section">
                                <h3>❤️ Latest Vital Signs</h3>
                                {selectedPatient.vitals.length === 0 ? (
                                    <p>No vital signs recorded</p>
                                ) : (
                                    <div className="vitals-grid">
                                        {selectedPatient.vitals.slice(0, 1).map(v => (
                                            <div key={v.id} className="vital-card">
                                                <h4>Latest Reading</h4>
                                                <div className="vital-row">
                                                    <span>🌡️ Temperature:</span>
                                                    <strong>{v.temperature}°F</strong>
                                                </div>
                                                <div className="vital-row">
                                                    <span>💓 Heart Rate:</span>
                                                    <strong>{v.heart_rate} bpm</strong>
                                                </div>
                                                <div className="vital-row">
                                                    <span>🩸 Blood Pressure:</span>
                                                    <strong>{v.blood_pressure_systolic}/{v.blood_pressure_diastolic} mmHg</strong>
                                                </div>
                                                <div className="vital-row">
                                                    <span>💨 O₂ Saturation:</span>
                                                    <strong>{v.oxygen_saturation}%</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="tab-content">
                        <h2>📅 {user?.role === 'doctor' ? 'My Schedule' : 'My Appointments'}</h2>
                        {appointments.length === 0 ? (
                            <p className="no-data">No appointments scheduled</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{user?.role === 'doctor' ? 'Patient' : 'Doctor'}</th>
                                            <th>Date & Time</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map(appt => (
                                            <tr key={appt.id}>
                                                <td>
                                                    {user?.role === 'doctor'
                                                        ? `${appt.first_name} ${appt.last_name}`
                                                        : `Dr. ${appt.doctor_first_name} ${appt.doctor_last_name}`}
                                                </td>
                                                <td>{new Date(appt.appointment_date).toLocaleString()}</td>
                                                <td>{appt.reason}</td>
                                                <td><span className={`status-${appt.status}`}>{appt.status.replace('_', ' ').toUpperCase()}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'records' && user?.role === 'patient' && (
                    <div className="tab-content">
                        <h2>📋 My Medical Records</h2>
                        
                        <div className="records-section">
                            <h3>🔬 Diagnoses</h3>
                            {records.diagnoses && records.diagnoses.length > 0 ? (
                                <ul className="list">
                                    {records.diagnoses.map(d => (
                                        <li key={d.id}>
                                            <strong>{d.diagnosis_name}</strong> (ICD: {d.icd_code})
                                            <span className={`severity-${d.severity}`}>{d.severity}</span>
                                            <p>{d.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No diagnoses recorded</p>
                            )}
                        </div>

                        <div className="records-section">
                            <h3>💊 Prescriptions</h3>
                            {records.prescriptions && records.prescriptions.length > 0 ? (
                                <div className="prescriptions-list">
                                    {records.prescriptions.map(p => (
                                        <div key={p.id} className="prescription-card">
                                            <h4>{p.medication_name}</h4>
                                            <p><strong>Strength:</strong> {p.strength}</p>
                                            <p><strong>Dosage:</strong> {p.dosage}</p>
                                            <p><strong>Frequency:</strong> {p.frequency}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No prescriptions</p>
                            )}
                        </div>

                        <div className="records-section">
                            <h3>❤️ Vital Signs History</h3>
                            {records.vitals && records.vitals.length > 0 ? (
                                <div className="vitals-grid">
                                    {records.vitals.slice(0, 5).map(v => (
                                        <div key={v.id} className="vital-card-small">
                                            <small>{new Date(v.recorded_at).toLocaleString()}</small>
                                            <div className="vital-row">
                                                <span>🌡️ Temp:</span>
                                                <strong>{v.temperature}°F</strong>
                                            </div>
                                            <div className="vital-row">
                                                <span>💓 HR:</span>
                                                <strong>{v.heart_rate} bpm</strong>
                                            </div>
                                            <div className="vital-row">
                                                <span>🩸 BP:</span>
                                                <strong>{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</strong>
                                            </div>
                                            <div className="vital-row">
                                                <span>💨 O₂:</span>
                                                <strong>{v.oxygen_saturation}%</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No vital signs recorded</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'vitals' && user?.role === 'nurse' && (
                    <div className="tab-content">
                        <h2>❤️ Record Vital Signs</h2>
                        <div className="form-section">
                            <p className="info-text">Select a patient to record their vital signs</p>
                            <select className="form-select">
                                <option value="">-- Select Patient --</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name} ({p.blood_group})
                                    </option>
                                ))}
                            </select>
                            <button className="btn-primary">Record Vitals</button>
                        </div>
                    </div>
                )}

                {activeTab === 'patients' && user?.role === 'nurse' && (
                    <div className="tab-content">
                        <h2>👥 Patients for Care</h2>
                        {patients.length === 0 ? (
                            <p className="no-data">No patients assigned</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Patient Name</th>
                                            <th>Blood Group</th>
                                            <th>Email</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map(p => (
                                            <tr key={p.id}>
                                                <td><strong>{p.first_name} {p.last_name}</strong></td>
                                                <td><span className="badge">{p.blood_group}</span></td>
                                                <td>{p.email}</td>
                                                <td>
                                                    <button className="action-btn">Record Vitals</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ComprehensiveDashboard;
