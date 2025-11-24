import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientDashboard.css';

function EnhancedPatientDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('prescription');
    const [documentDescription, setDocumentDescription] = useState('');
    
    const [myData, setMyData] = useState({
        appointments: [],
        labResults: [],
        prescriptions: [],
        documents: [],
        records: {}
    });

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
        loadPatientData(token);
    }, [navigate]);

    const loadPatientData = async (token) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            // Load appointments
            const appointmentsRes = await axios.get(`${API_URL}/patient/my-appointments`, { 
                headers, 
                timeout: 10000 
            }).catch(() => ({ data: { success: true, appointments: [] } }));

            // Load lab results
            const labRes = await axios.get(`${API_URL}/patient/lab-results`, { 
                headers, 
                timeout: 10000 
            }).catch(() => ({ data: { success: true, labResults: [] } }));

            // Load prescriptions
            const prescriptionsRes = await axios.get(`${API_URL}/patient/prescriptions`, { 
                headers, 
                timeout: 10000 
            }).catch(() => ({ data: { success: true, prescriptions: [] } }));

            // Load medical records
            const recordsRes = await axios.get(`${API_URL}/patient/my-records`, { 
                headers, 
                timeout: 10000 
            }).catch(() => ({ data: { success: true, diagnoses: [], prescriptions: [], vitals: [] } }));

            // Load documents (uploaded prescriptions, etc)
            const documentsRes = await axios.get(`${API_URL}/patient/documents`, { 
                headers, 
                timeout: 10000 
            }).catch(() => ({ data: { success: true, documents: [] } }));

            setMyData({
                appointments: appointmentsRes.data.appointments || [],
                labResults: labRes.data.labResults || [],
                prescriptions: prescriptionsRes.data.prescriptions || [],
                documents: documentsRes.data.documents || [],
                records: {
                    diagnoses: recordsRes.data.diagnoses || [],
                    prescriptions: recordsRes.data.prescriptions || [],
                    vitals: recordsRes.data.vitals || []
                }
            });

            setLoading(false);
        } catch (error) {
            console.error('Error loading patient data:', error);
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUploadPrescription = async (e) => {
        e.preventDefault();
        setUploadMessage('');
        setUploadError('');

        if (!selectedFile) {
            setUploadError('Please select a file');
            return;
        }

        if (!documentType) {
            setUploadError('Please select document type');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('documentType', documentType);
            formData.append('filename', selectedFile.name);
            formData.append('description', documentDescription);
            formData.append('fileContent', selectedFile);

            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const response = await axios.post(
                `${API_URL}/patient/documents/upload`,
                formData,
                { headers, timeout: 30000 }
            );

            if (response.data.success) {
                setUploadMessage('✅ Document uploaded successfully!');
                setSelectedFile(null);
                setDocumentDescription('');
                document.querySelector('input[type="file"]').value = '';
                
                // Reload documents
                setTimeout(() => {
                    const token = localStorage.getItem('token');
                    loadPatientData(token);
                }, 1500);
            }
        } catch (error) {
            setUploadError(error.response?.data?.error || 'Failed to upload document');
        }
    };

    const downloadDocument = async (documentId, filename) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/patient/documents/${documentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentElement.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) {
        return <div className="patient-dashboard-container"><p>Loading...</p></div>;
    }

    return (
        <div className="patient-dashboard-container">
            <nav className="patient-navbar">
                <div className="navbar-brand">🏥 Patient Portal</div>
                <div className="navbar-right">
                    <span className="user-greeting">Welcome, {user?.username}!</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="patient-dashboard-content">
                <div className="tabs-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appointments')}
                    >
                        📅 Appointments ({myData.appointments.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('prescriptions')}
                    >
                        💊 Prescriptions ({myData.prescriptions.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'lab-results' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lab-results')}
                    >
                        🔬 Lab Results ({myData.labResults.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'medical-records' ? 'active' : ''}`}
                        onClick={() => setActiveTab('medical-records')}
                    >
                        📋 Medical Records
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        📤 Upload Documents
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <h1>Your Health Dashboard</h1>
                        <div className="dashboard-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📅</div>
                                <div className="stat-info">
                                    <div className="stat-number">{myData.appointments.length}</div>
                                    <div className="stat-label">Appointments</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💊</div>
                                <div className="stat-info">
                                    <div className="stat-number">{myData.prescriptions.length}</div>
                                    <div className="stat-label">Active Prescriptions</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🔬</div>
                                <div className="stat-info">
                                    <div className="stat-number">{myData.labResults.length}</div>
                                    <div className="stat-label">Lab Results</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📄</div>
                                <div className="stat-info">
                                    <div className="stat-number">{myData.documents.length}</div>
                                    <div className="stat-label">Uploaded Documents</div>
                                </div>
                            </div>
                        </div>

                        <div className="quick-access">
                            <h2>Quick Access</h2>
                            <div className="quick-buttons">
                                <button 
                                    className="quick-btn"
                                    onClick={() => setActiveTab('appointments')}
                                >
                                    View Appointments →
                                </button>
                                <button 
                                    className="quick-btn"
                                    onClick={() => setActiveTab('prescriptions')}
                                >
                                    View Prescriptions →
                                </button>
                                <button 
                                    className="quick-btn"
                                    onClick={() => setActiveTab('upload')}
                                >
                                    Upload Document →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="tab-content">
                        <h2>📅 My Appointments</h2>
                        {myData.appointments.length === 0 ? (
                            <div className="empty-state">
                                <p>No appointments scheduled</p>
                            </div>
                        ) : (
                            <div className="appointments-grid">
                                {myData.appointments.map(apt => (
                                    <div key={apt.id} className="appointment-card">
                                        <div className="appointment-header">
                                            <h3>Dr. {apt.doctor_first_name} {apt.doctor_last_name}</h3>
                                            <span className={`status-badge status-${apt.status}`}>
                                                {apt.status?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="appointment-details">
                                            <p><strong>📅 Date & Time:</strong> {new Date(apt.appointment_date).toLocaleString()}</p>
                                            <p><strong>🏥 Reason:</strong> {apt.reason}</p>
                                            {apt.notes && <p><strong>📝 Notes:</strong> {apt.notes}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div className="tab-content">
                        <h2>💊 My Active Prescriptions</h2>
                        {myData.prescriptions.length === 0 ? (
                            <div className="empty-state">
                                <p>No active prescriptions</p>
                            </div>
                        ) : (
                            <div className="prescriptions-grid">
                                {myData.prescriptions.map(rx => (
                                    <div key={rx.id} className="prescription-card">
                                        <div className="card-header">
                                            <h3>{rx.medication_name}</h3>
                                            <button 
                                                className="download-btn"
                                                onClick={() => downloadDocument(rx.id, `${rx.medication_name}.pdf`)}
                                            >
                                                ⬇️ Download
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            <p><strong>💪 Strength:</strong> {rx.strength}</p>
                                            <p><strong>📊 Dosage:</strong> {rx.dosage}</p>
                                            <p><strong>⏰ Frequency:</strong> {rx.frequency}</p>
                                            <p><strong>📅 Prescribed:</strong> {new Date(rx.prescribed_date).toLocaleDateString()}</p>
                                            {rx.end_date && (
                                                <p><strong>⏹️ Valid Until:</strong> {new Date(rx.end_date).toLocaleDateString()}</p>
                                            )}
                                            {rx.instructions && (
                                                <p><strong>📝 Instructions:</strong> {rx.instructions}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Lab Results Tab */}
                {activeTab === 'lab-results' && (
                    <div className="tab-content">
                        <h2>🔬 Lab Test Results</h2>
                        {myData.labResults.length === 0 ? (
                            <div className="empty-state">
                                <p>No lab results available</p>
                            </div>
                        ) : (
                            <div className="lab-results-grid">
                                {myData.labResults.map(result => (
                                    <div key={result.id} className="lab-result-card">
                                        <div className="result-header">
                                            <h3>{result.test_name}</h3>
                                            <span className={`result-status ${result.status}`}>
                                                {result.status?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="result-body">
                                            <p><strong>📅 Test Date:</strong> {new Date(result.test_date).toLocaleDateString()}</p>
                                            <p><strong>🔍 Type:</strong> {result.test_type}</p>
                                            {result.result_value && (
                                                <p><strong>📊 Result:</strong> {result.result_value}</p>
                                            )}
                                            {result.normal_range && (
                                                <p><strong>📍 Normal Range:</strong> {result.normal_range}</p>
                                            )}
                                            {result.remarks && (
                                                <p><strong>📝 Remarks:</strong> {result.remarks}</p>
                                            )}
                                        </div>
                                        {result.report_url && (
                                            <button 
                                                className="download-btn-small"
                                                onClick={() => downloadDocument(result.id, `${result.test_name}_Report.pdf`)}
                                            >
                                                ⬇️ Download Report
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Medical Records Tab */}
                {activeTab === 'medical-records' && (
                    <div className="tab-content">
                        <h2>📋 Medical History</h2>
                        
                        <div className="records-section">
                            <h3>🔬 Diagnoses</h3>
                            {myData.records.diagnoses && myData.records.diagnoses.length > 0 ? (
                                <div className="diagnoses-list">
                                    {myData.records.diagnoses.map(d => (
                                        <div key={d.id} className="diagnosis-item">
                                            <div className="diagnosis-header">
                                                <h4>{d.diagnosis_name}</h4>
                                                <span className={`severity-badge severity-${d.severity}`}>
                                                    {d.severity?.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="diagnosis-desc">{d.description}</p>
                                            <small className="icd-code">ICD Code: {d.icd_code}</small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No diagnoses recorded</p>
                            )}
                        </div>

                        <div className="records-section">
                            <h3>❤️ Vital Signs History</h3>
                            {myData.records.vitals && myData.records.vitals.length > 0 ? (
                                <div className="vitals-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Temp</th>
                                                <th>Heart Rate</th>
                                                <th>BP</th>
                                                <th>O₂ Sat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myData.records.vitals.map(v => (
                                                <tr key={v.id}>
                                                    <td>{new Date(v.recorded_at).toLocaleString()}</td>
                                                    <td>{v.temperature}°F</td>
                                                    <td>{v.heart_rate} bpm</td>
                                                    <td>{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</td>
                                                    <td>{v.oxygen_saturation}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="no-data">No vital signs recorded</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Upload Documents Tab */}
                {activeTab === 'upload' && (
                    <div className="tab-content">
                        <h2>📤 Upload Medical Documents</h2>
                        
                        <div className="upload-form-section">
                            <h3>Upload Historical Prescriptions or Other Medical Documents</h3>
                            
                            {uploadMessage && <div className="success-message">{uploadMessage}</div>}
                            {uploadError && <div className="error-message">{uploadError}</div>}

                            <form onSubmit={handleUploadPrescription} className="upload-form">
                                <div className="form-group">
                                    <label>Document Type</label>
                                    <select 
                                        value={documentType} 
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="prescription">Prescription</option>
                                        <option value="lab_report">Lab Report</option>
                                        <option value="medical_certificate">Medical Certificate</option>
                                        <option value="discharge_summary">Discharge Summary</option>
                                        <option value="other">Other Document</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Select File</label>
                                    <input 
                                        type="file" 
                                        onChange={handleFileSelect}
                                        className="form-control"
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    />
                                    <small>Accepted formats: PDF, JPG, PNG, DOC, DOCX</small>
                                </div>

                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea 
                                        value={documentDescription}
                                        onChange={(e) => setDocumentDescription(e.target.value)}
                                        placeholder="Add any notes about this document..."
                                        className="form-control"
                                        rows="3"
                                    />
                                </div>

                                <button type="submit" className="btn-upload">
                                    ☁️ Upload Document
                                </button>
                            </form>
                        </div>

                        <div className="uploaded-documents-section">
                            <h3>📄 Your Uploaded Documents ({myData.documents.length})</h3>
                            {myData.documents.length === 0 ? (
                                <div className="empty-state">
                                    <p>No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="documents-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Document Name</th>
                                                <th>Type</th>
                                                <th>Upload Date</th>
                                                <th>Description</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myData.documents.map(doc => (
                                                <tr key={doc.id}>
                                                    <td><strong>{doc.filename}</strong></td>
                                                    <td>
                                                        <span className="doc-type-badge">
                                                            {doc.document_type?.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                                                    <td>{doc.description || '-'}</td>
                                                    <td>
                                                        <button 
                                                            className="action-download"
                                                            onClick={() => downloadDocument(doc.id, doc.filename)}
                                                        >
                                                            ⬇️ Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EnhancedPatientDashboard;
