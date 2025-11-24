import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NurseDashboard.css';

const NurseDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [progressNotes, setProgressNotes] = useState([]);
    const [stats, setStats] = useState({
        totalPatients: 0,
        vitalRecordings: 0,
        progressNotesAdded: 0,
        patientsMonitored: 0
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // Form states
    const [vitalForm, setVitalForm] = useState({
        patientId: '',
        systolic: '',
        diastolic: '',
        pulse: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        notes: ''
    });

    const [progressForm, setProgressForm] = useState({
        patientId: '',
        condition: 'stable',
        mood: 'normal',
        activity: 'moderate',
        appetite: 'normal',
        sleep: 'adequate',
        notes: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch patients
    useEffect(() => {
        fetchPatients();
        fetchStats();
        const refreshInterval = setInterval(() => {
            fetchPatients();
            fetchStats();
        }, 30000); // Refresh every 30 seconds
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/nurse/patients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPatients(data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setPatients([]);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/nurse/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats || stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchPatientVitals = async (patientId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/nurse/vitals/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setVitals(data.vitals || []);
        } catch (error) {
            console.error('Error fetching vitals:', error);
            setVitals([]);
        }
    };

    const fetchPatientProgressNotes = async (patientId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/nurse/progress/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProgressNotes(data.progressNotes || []);
        } catch (error) {
            console.error('Error fetching progress notes:', error);
            setProgressNotes([]);
        }
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        fetchPatientVitals(patient.id);
        fetchPatientProgressNotes(patient.id);
        setVitalForm({ ...vitalForm, patientId: patient.id });
        setProgressForm({ ...progressForm, patientId: patient.id });
    };

    const handleRecordVitals = async (e) => {
        e.preventDefault();
        if (!vitalForm.patientId) {
            showMessage('error', 'Please select a patient');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/nurse/vitals', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: vitalForm.patientId,
                    systolic: parseInt(vitalForm.systolic),
                    diastolic: parseInt(vitalForm.diastolic),
                    pulse: parseInt(vitalForm.pulse),
                    temperature: parseFloat(vitalForm.temperature),
                    respiratoryRate: parseInt(vitalForm.respiratoryRate),
                    oxygenSaturation: parseInt(vitalForm.oxygenSaturation),
                    notes: vitalForm.notes
                })
            });

            const data = await response.json();
            if (data.success) {
                showMessage('success', 'Vital signs recorded successfully');
                setVitalForm({
                    patientId: vitalForm.patientId,
                    systolic: '',
                    diastolic: '',
                    pulse: '',
                    temperature: '',
                    respiratoryRate: '',
                    oxygenSaturation: '',
                    notes: ''
                });
                fetchPatientVitals(vitalForm.patientId);
                fetchStats();
            } else {
                showMessage('error', data.message || 'Failed to record vitals');
            }
        } catch (error) {
            showMessage('error', error.message || 'Error recording vitals');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProgressNote = async (e) => {
        e.preventDefault();
        if (!progressForm.patientId) {
            showMessage('error', 'Please select a patient');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/nurse/progress', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patientId: progressForm.patientId,
                    condition: progressForm.condition,
                    mood: progressForm.mood,
                    activity: progressForm.activity,
                    appetite: progressForm.appetite,
                    sleep: progressForm.sleep,
                    notes: progressForm.notes
                })
            });

            const data = await response.json();
            if (data.success) {
                showMessage('success', 'Progress note added successfully');
                setProgressForm({
                    patientId: progressForm.patientId,
                    condition: 'stable',
                    mood: 'normal',
                    activity: 'moderate',
                    appetite: 'normal',
                    sleep: 'adequate',
                    notes: ''
                });
                fetchPatientProgressNotes(progressForm.patientId);
                fetchStats();
            } else {
                showMessage('error', data.message || 'Failed to add progress note');
            }
        } catch (error) {
            showMessage('error', error.message || 'Error adding progress note');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Get color for vital sign status
    const getVitalStatusColor = (value, min, max) => {
        if (value < min || value > max) return '#e74c3c'; // Red
        if (value < min + 5 || value > max - 5) return '#f39c12'; // Orange
        return '#27ae60'; // Green
    };

    return (
        <div className="nurse-dashboard">
            {/* Header */}
            <div className="nurse-header">
                <div className="nurse-header-content">
                    <div>
                        <h1>🏥 Nurse Dashboard</h1>
                        <p>Patient Care & Vital Signs Monitoring</p>
                    </div>
                    <button className="nurse-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Message Display */}
            {message.text && (
                <div className={`nurse-message nurse-message-${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="nurse-tabs">
                <button
                    className={`nurse-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    📊 Dashboard
                </button>
                <button
                    className={`nurse-tab ${activeTab === 'patients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('patients')}
                >
                    👥 My Patients
                </button>
                <button
                    className={`nurse-tab ${activeTab === 'vitals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vitals')}
                >
                    ❤️ Record Vitals
                </button>
                <button
                    className={`nurse-tab ${activeTab === 'progress' ? 'active' : ''}`}
                    onClick={() => setActiveTab('progress')}
                >
                    📝 Progress Notes
                </button>
                <button
                    className={`nurse-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📋 Patient History
                </button>
            </div>

            {/* Tab Content */}
            <div className="nurse-content">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="nurse-tab-content">
                        <h2>Welcome, {user.first_name}!</h2>
                        <div className="nurse-stats-grid">
                            <div className="nurse-stat-card">
                                <div className="nurse-stat-icon">👥</div>
                                <div className="nurse-stat-info">
                                    <div className="nurse-stat-value">{stats.totalPatients}</div>
                                    <div className="nurse-stat-label">Total Patients</div>
                                </div>
                            </div>
                            <div className="nurse-stat-card">
                                <div className="nurse-stat-icon">❤️</div>
                                <div className="nurse-stat-info">
                                    <div className="nurse-stat-value">{stats.vitalRecordings}</div>
                                    <div className="nurse-stat-label">Vital Recordings</div>
                                </div>
                            </div>
                            <div className="nurse-stat-card">
                                <div className="nurse-stat-icon">📝</div>
                                <div className="nurse-stat-info">
                                    <div className="nurse-stat-value">{stats.progressNotesAdded}</div>
                                    <div className="nurse-stat-label">Progress Notes</div>
                                </div>
                            </div>
                            <div className="nurse-stat-card">
                                <div className="nurse-stat-icon">📊</div>
                                <div className="nurse-stat-info">
                                    <div className="nurse-stat-value">{stats.patientsMonitored}</div>
                                    <div className="nurse-stat-label">Monitored Today</div>
                                </div>
                            </div>
                        </div>

                        <div className="nurse-quick-actions">
                            <h3>Quick Actions</h3>
                            <button onClick={() => setActiveTab('patients')}>View My Patients</button>
                            <button onClick={() => setActiveTab('vitals')}>Record Vitals</button>
                            <button onClick={() => setActiveTab('progress')}>Add Progress Note</button>
                        </div>
                    </div>
                )}

                {/* My Patients Tab */}
                {activeTab === 'patients' && (
                    <div className="nurse-tab-content">
                        <h2>My Assigned Patients</h2>
                        {patients.length > 0 ? (
                            <div className="nurse-patients-grid">
                                {patients.map(patient => (
                                    <div
                                        key={patient.id}
                                        className={`nurse-patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                                        onClick={() => handlePatientSelect(patient)}
                                    >
                                        <div className="nurse-patient-header">
                                            <h4>{patient.first_name} {patient.last_name}</h4>
                                            <span className="nurse-patient-age">Age: {patient.age || 'N/A'}</span>
                                        </div>
                                        <div className="nurse-patient-info">
                                            <p><strong>Blood Group:</strong> {patient.blood_group || 'N/A'}</p>
                                            <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
                                            <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
                                            <p><strong>Gender:</strong> {patient.gender || 'N/A'}</p>
                                        </div>
                                        <button className="nurse-view-btn" onClick={() => setActiveTab('history')}>
                                            View History
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="nurse-no-data">No assigned patients</p>
                        )}
                    </div>
                )}

                {/* Record Vitals Tab */}
                {activeTab === 'vitals' && (
                    <div className="nurse-tab-content">
                        <h2>Record Patient Vital Signs</h2>
                        
                        {!selectedPatient ? (
                            <div className="nurse-select-patient">
                                <p>Select a patient first:</p>
                                <div className="nurse-patient-select-grid">
                                    {patients.map(patient => (
                                        <button
                                            key={patient.id}
                                            className="nurse-patient-select"
                                            onClick={() => handlePatientSelect(patient)}
                                        >
                                            {patient.first_name} {patient.last_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="nurse-selected-patient">
                                    <strong>Selected Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                                </div>

                                <form onSubmit={handleRecordVitals} className="nurse-form">
                                    <div className="nurse-form-grid">
                                        <div className="nurse-form-group">
                                            <label>Systolic BP (mmHg)</label>
                                            <input
                                                type="number"
                                                value={vitalForm.systolic}
                                                onChange={(e) => setVitalForm({ ...vitalForm, systolic: e.target.value })}
                                                placeholder="e.g., 120"
                                                required
                                            />
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Diastolic BP (mmHg)</label>
                                            <input
                                                type="number"
                                                value={vitalForm.diastolic}
                                                onChange={(e) => setVitalForm({ ...vitalForm, diastolic: e.target.value })}
                                                placeholder="e.g., 80"
                                                required
                                            />
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Pulse (bpm)</label>
                                            <input
                                                type="number"
                                                value={vitalForm.pulse}
                                                onChange={(e) => setVitalForm({ ...vitalForm, pulse: e.target.value })}
                                                placeholder="e.g., 72"
                                                required
                                            />
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Temperature (°C)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={vitalForm.temperature}
                                                onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                                                placeholder="e.g., 37.0"
                                                required
                                            />
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Respiratory Rate (breaths/min)</label>
                                            <input
                                                type="number"
                                                value={vitalForm.respiratoryRate}
                                                onChange={(e) => setVitalForm({ ...vitalForm, respiratoryRate: e.target.value })}
                                                placeholder="e.g., 16"
                                                required
                                            />
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Oxygen Saturation (%)</label>
                                            <input
                                                type="number"
                                                value={vitalForm.oxygenSaturation}
                                                onChange={(e) => setVitalForm({ ...vitalForm, oxygenSaturation: e.target.value })}
                                                placeholder="e.g., 98"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="nurse-form-group full">
                                        <label>Notes (Optional)</label>
                                        <textarea
                                            value={vitalForm.notes}
                                            onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })}
                                            placeholder="Add any additional observations..."
                                            rows="3"
                                        />
                                    </div>

                                    <button type="submit" className="nurse-submit-btn" disabled={loading}>
                                        {loading ? 'Recording...' : 'Record Vital Signs'}
                                    </button>
                                </form>

                                {vitals.length > 0 && (
                                    <div className="nurse-vitals-history">
                                        <h3>Recent Vital Signs (Last 7 Days)</h3>
                                        <table className="nurse-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>BP</th>
                                                    <th>Pulse</th>
                                                    <th>Temp</th>
                                                    <th>RR</th>
                                                    <th>O₂ Sat</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vitals.slice(-7).reverse().map((vital, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(vital.recorded_at).toLocaleDateString()}</td>
                                                        <td>{vital.systolic}/{vital.diastolic}</td>
                                                        <td>{vital.pulse}</td>
                                                        <td>{vital.temperature}</td>
                                                        <td>{vital.respiratory_rate}</td>
                                                        <td>{vital.oxygen_saturation}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Progress Notes Tab */}
                {activeTab === 'progress' && (
                    <div className="nurse-tab-content">
                        <h2>Add Patient Progress Note</h2>

                        {!selectedPatient ? (
                            <div className="nurse-select-patient">
                                <p>Select a patient first:</p>
                                <div className="nurse-patient-select-grid">
                                    {patients.map(patient => (
                                        <button
                                            key={patient.id}
                                            className="nurse-patient-select"
                                            onClick={() => handlePatientSelect(patient)}
                                        >
                                            {patient.first_name} {patient.last_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="nurse-selected-patient">
                                    <strong>Selected Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                                </div>

                                <form onSubmit={handleAddProgressNote} className="nurse-form">
                                    <div className="nurse-form-grid">
                                        <div className="nurse-form-group">
                                            <label>Overall Condition</label>
                                            <select
                                                value={progressForm.condition}
                                                onChange={(e) => setProgressForm({ ...progressForm, condition: e.target.value })}
                                            >
                                                <option value="critical">Critical</option>
                                                <option value="serious">Serious</option>
                                                <option value="stable">Stable</option>
                                                <option value="improving">Improving</option>
                                                <option value="good">Good</option>
                                            </select>
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Mood</label>
                                            <select
                                                value={progressForm.mood}
                                                onChange={(e) => setProgressForm({ ...progressForm, mood: e.target.value })}
                                            >
                                                <option value="anxious">Anxious</option>
                                                <option value="depressed">Depressed</option>
                                                <option value="normal">Normal</option>
                                                <option value="happy">Happy</option>
                                                <option value="irritable">Irritable</option>
                                            </select>
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Activity Level</label>
                                            <select
                                                value={progressForm.activity}
                                                onChange={(e) => setProgressForm({ ...progressForm, activity: e.target.value })}
                                            >
                                                <option value="bedbound">Bedbound</option>
                                                <option value="limited">Limited</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="active">Active</option>
                                            </select>
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Appetite</label>
                                            <select
                                                value={progressForm.appetite}
                                                onChange={(e) => setProgressForm({ ...progressForm, appetite: e.target.value })}
                                            >
                                                <option value="poor">Poor</option>
                                                <option value="reduced">Reduced</option>
                                                <option value="normal">Normal</option>
                                                <option value="good">Good</option>
                                            </select>
                                        </div>
                                        <div className="nurse-form-group">
                                            <label>Sleep Quality</label>
                                            <select
                                                value={progressForm.sleep}
                                                onChange={(e) => setProgressForm({ ...progressForm, sleep: e.target.value })}
                                            >
                                                <option value="poor">Poor</option>
                                                <option value="disturbed">Disturbed</option>
                                                <option value="adequate">Adequate</option>
                                                <option value="good">Good</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="nurse-form-group full">
                                        <label>Detailed Notes</label>
                                        <textarea
                                            value={progressForm.notes}
                                            onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                                            placeholder="Detailed progress observations, patient feedback, care plan adjustments..."
                                            rows="5"
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="nurse-submit-btn" disabled={loading}>
                                        {loading ? 'Adding...' : 'Add Progress Note'}
                                    </button>
                                </form>

                                {progressNotes.length > 0 && (
                                    <div className="nurse-progress-history">
                                        <h3>Recent Progress Notes</h3>
                                        <div className="nurse-notes-list">
                                            {progressNotes.slice(-5).reverse().map((note, index) => (
                                                <div key={index} className="nurse-note-item">
                                                    <div className="nurse-note-date">
                                                        {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString()}
                                                    </div>
                                                    <div className="nurse-note-badges">
                                                        <span className={`nurse-badge nurse-badge-${note.condition}`}>{note.condition}</span>
                                                        <span className={`nurse-badge nurse-badge-mood`}>{note.mood}</span>
                                                    </div>
                                                    <p>{note.notes}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Patient History Tab */}
                {activeTab === 'history' && (
                    <div className="nurse-tab-content">
                        <h2>Patient Monitoring History</h2>

                        {!selectedPatient ? (
                            <div className="nurse-select-patient">
                                <p>Select a patient to view their history:</p>
                                <div className="nurse-patient-select-grid">
                                    {patients.map(patient => (
                                        <button
                                            key={patient.id}
                                            className="nurse-patient-select"
                                            onClick={() => handlePatientSelect(patient)}
                                        >
                                            {patient.first_name} {patient.last_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="nurse-selected-patient">
                                    <strong>Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name} | 
                                    <strong> Blood Group:</strong> {selectedPatient.blood_group} | 
                                    <strong> Age:</strong> {selectedPatient.age}
                                </div>

                                <div className="nurse-history-sections">
                                    {vitals.length > 0 ? (
                                        <div className="nurse-history-section">
                                            <h3>Vital Signs Record</h3>
                                            <table className="nurse-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date & Time</th>
                                                        <th>BP (Systolic/Diastolic)</th>
                                                        <th>Pulse (bpm)</th>
                                                        <th>Temperature (°C)</th>
                                                        <th>RR (breaths/min)</th>
                                                        <th>O₂ Sat (%)</th>
                                                        <th>Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vitals.slice().reverse().map((vital, index) => (
                                                        <tr key={index}>
                                                            <td>{new Date(vital.recorded_at).toLocaleString()}</td>
                                                            <td>{vital.systolic}/{vital.diastolic}</td>
                                                            <td>{vital.pulse}</td>
                                                            <td>{vital.temperature}</td>
                                                            <td>{vital.respiratory_rate}</td>
                                                            <td>{vital.oxygen_saturation}</td>
                                                            <td>{vital.notes || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="nurse-no-data">No vital signs recorded yet</p>
                                    )}

                                    {progressNotes.length > 0 ? (
                                        <div className="nurse-history-section">
                                            <h3>Progress Notes History</h3>
                                            <div className="nurse-notes-timeline">
                                                {progressNotes.slice().reverse().map((note, index) => (
                                                    <div key={index} className="nurse-timeline-item">
                                                        <div className="nurse-timeline-date">
                                                            {new Date(note.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="nurse-timeline-content">
                                                            <div className="nurse-timeline-badges">
                                                                <span className="nurse-badge">Condition: {note.condition}</span>
                                                                <span className="nurse-badge">Mood: {note.mood}</span>
                                                                <span className="nurse-badge">Activity: {note.activity}</span>
                                                                <span className="nurse-badge">Appetite: {note.appetite}</span>
                                                                <span className="nurse-badge">Sleep: {note.sleep}</span>
                                                            </div>
                                                            <p>{note.notes}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="nurse-no-data">No progress notes recorded yet</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NurseDashboard;
