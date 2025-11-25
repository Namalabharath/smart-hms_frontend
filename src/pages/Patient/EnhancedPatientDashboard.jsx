import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientDashboard.css';

const buildFullName = (first, last, fallback = 'Unknown Doctor') => {
    const name = [first, last].filter(Boolean).join(' ').trim();
    return name || fallback;
};

function EnhancedPatientDashboard() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('prescription');
    const [documentDescription, setDocumentDescription] = useState('');
    const [prescriptionAnalysis, setPrescriptionAnalysis] = useState(null); // Store current analysis result
    const [analyzing, setAnalyzing] = useState(false); // Track analysis loading state
    
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

            const normalizedAppointments = (appointmentsRes.data.appointments || []).map((appointment) => ({
                ...appointment,
                doctorFullName:
                    appointment.doctorFullName ||
                    buildFullName(
                        appointment.doctor_first_name ?? appointment.first_name,
                        appointment.doctor_last_name ?? appointment.last_name,
                        'Unknown Doctor'
                    )
            }));

            setMyData({
                appointments: normalizedAppointments,
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
        setPrescriptionAnalysis(null);

        if (!selectedFile) {
            setUploadError('Please select a file');
            return;
        }

        try {
            setAnalyzing(true);
            setUploadMessage('📤 Uploading and analyzing prescription...');
            
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('notes', documentDescription);

            const token = localStorage.getItem('token');
            const headers = { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            };

            const response = await axios.post(
                `${API_URL}/prescription-analyze`,
                formData,
                { headers, timeout: 60000 }
            );

            if (response.data.success) {
                setUploadMessage('✅ Prescription analyzed successfully!');
                setPrescriptionAnalysis(response.data.analysis || response.data.raw || response.data);
                setSelectedFile(null);
                setDocumentDescription('');
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
            } else {
                setUploadError('Analysis completed but no results returned');
            }
        } catch (error) {
            console.error('Upload/Analysis error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to analyze prescription';
            setUploadError(`❌ ${errorMsg}`);
            if (error.response?.data?.details) {
                console.error('Error details:', error.response.data.details);
            }
        } finally {
            setAnalyzing(false);
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
                        💊 Prescription Analysis
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
                                            <h3>Dr. {apt.doctorFullName}</h3>
                                            <span className={`status-badge status-${apt.status || 'scheduled'}`}>
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

                {/* Prescription Analysis Tab */}
                {activeTab === 'prescriptions' && (
                    <div className="tab-content">
                        <h2 style={{ marginBottom: '30px', color: '#1976d2' }}>🤖 Prescription Analysis</h2>
                        
                        {/* Upload Prescription Section */}
                        <div style={{
                            marginBottom: '30px',
                            padding: '25px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '12px',
                            border: '2px dashed #2196F3',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{ marginBottom: '20px', color: '#2196F3', fontSize: '20px' }}>📤 Upload Prescription Document</h3>
                            
                            {uploadMessage && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#e8f5e9',
                                    color: '#2e7d32',
                                    borderRadius: '6px',
                                    marginBottom: '15px',
                                    fontWeight: '500'
                                }}>
                                    {uploadMessage}
                                </div>
                            )}
                            
                            {uploadError && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#ffebee',
                                    color: '#c62828',
                                    borderRadius: '6px',
                                    marginBottom: '15px',
                                    fontWeight: '500'
                                }}>
                                    {uploadError}
                                </div>
                            )}
                            
                            <form onSubmit={handleUploadPrescription} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1', minWidth: '250px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                            Select Prescription File (PDF, Image, or Document)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => {
                                                setSelectedFile(e.target.files[0]);
                                                setUploadError('');
                                                setUploadMessage('');
                                                setPrescriptionAnalysis(null);
                                            }}
                                            disabled={analyzing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: '1', minWidth: '250px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                            Notes (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={documentDescription}
                                            onChange={(e) => setDocumentDescription(e.target.value)}
                                            placeholder="e.g., Prescription from Dr. Smith"
                                            disabled={analyzing}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!selectedFile || analyzing}
                                        style={{
                                            backgroundColor: (selectedFile && !analyzing) ? '#2196F3' : '#ccc',
                                            color: 'white',
                                            padding: '12px 24px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: (selectedFile && !analyzing) ? 'pointer' : 'not-allowed',
                                            whiteSpace: 'nowrap',
                                            height: 'fit-content',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        {analyzing ? '🤖 Analyzing...' : '📤 Upload & Analyze'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* AI Analysis Results */}
                        {prescriptionAnalysis && (
                            <div style={{
                                marginTop: '30px',
                                padding: '25px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '12px',
                                border: '2px solid #2196F3',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <h3 style={{ color: '#1976d2', marginBottom: '20px', fontSize: '22px' }}>
                                    🤖 AI Analysis Results
                                </h3>
                                
                                {typeof prescriptionAnalysis === 'object' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {prescriptionAnalysis.howToTake && (
                                            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                                                <strong style={{ color: '#1976d2', fontSize: '16px' }}>✅ How to Take:</strong>
                                                <p style={{ margin: '8px 0 0 0', color: '#555', fontSize: '15px', lineHeight: '1.6' }}>
                                                    {prescriptionAnalysis.howToTake}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {prescriptionAnalysis.importantNotes && prescriptionAnalysis.importantNotes.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                                                <strong style={{ color: '#388e3c', fontSize: '16px' }}>📌 Important Notes:</strong>
                                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '25px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                                    {prescriptionAnalysis.importantNotes.map((note, i) => (
                                                        <li key={i} style={{ marginBottom: '5px' }}>{note}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {prescriptionAnalysis.sideEffects && prescriptionAnalysis.sideEffects.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                                                <strong style={{ color: '#f57c00', fontSize: '16px' }}>⚠️ Side Effects:</strong>
                                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '25px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                                    {prescriptionAnalysis.sideEffects.map((effect, i) => (
                                                        <li key={i} style={{ marginBottom: '5px' }}>{effect}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {prescriptionAnalysis.precautions && prescriptionAnalysis.precautions.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                                                <strong style={{ color: '#d32f2f', fontSize: '16px' }}>🚫 Precautions:</strong>
                                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '25px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                                    {prescriptionAnalysis.precautions.map((precaution, i) => (
                                                        <li key={i} style={{ marginBottom: '5px' }}>{precaution}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {prescriptionAnalysis.foodInteractions && prescriptionAnalysis.foodInteractions.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                                                <strong style={{ color: '#7b1fa2', fontSize: '16px' }}>🍽️ Food Interactions:</strong>
                                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '25px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                                    {prescriptionAnalysis.foodInteractions.map((interaction, i) => (
                                                        <li key={i} style={{ marginBottom: '5px' }}>{interaction}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {prescriptionAnalysis.whenToContactDoctor && prescriptionAnalysis.whenToContactDoctor.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ff9800' }}>
                                                <strong style={{ color: '#e65100', fontSize: '16px' }}>🏥 When to Contact Doctor:</strong>
                                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '25px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                                    {prescriptionAnalysis.whenToContactDoctor.map((situation, i) => (
                                                        <li key={i} style={{ marginBottom: '5px' }}>{situation}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {prescriptionAnalysis.warnings && prescriptionAnalysis.warnings.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', border: '1px solid #f44336' }}>
                                                <strong style={{ color: '#c62828', fontSize: '16px' }}>⚠️ Warnings:</strong>
                                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '25px', color: '#555', fontSize: '15px', lineHeight: '1.8' }}>
                                                    {prescriptionAnalysis.warnings.map((warning, i) => (
                                                        <li key={i} style={{ marginBottom: '5px' }}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#555', margin: 0 }}>
                                            {typeof prescriptionAnalysis === 'string' ? prescriptionAnalysis : JSON.stringify(prescriptionAnalysis, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                <div style={{
                                    marginTop: '20px',
                                    padding: '12px',
                                    backgroundColor: '#e3f2fd',
                                    border: '1px solid #2196F3',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    color: '#1565c0'
                                }}>
                                    <strong>ℹ️ Disclaimer:</strong> These are AI-generated suggestions for informational purposes only. Always follow your doctor's instructions and consult your healthcare provider for medical advice.
                                </div>
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

                        {/* Medical Certificates Section */}
                        <div className="records-section">
                            <h3>📜 Medical Certificates</h3>
                            {(() => {
                                const medicalCerts = (myData.documents || []).filter(d => 
                                    d.document_type === 'medical_certificate' || d.documentType === 'medical_certificate'
                                );
                                
                                if (medicalCerts.length === 0) {
                                    return <p className="no-data">No medical certificates uploaded</p>;
                                }
                                
                                return (
                                    <div className="documents-grid">
                                        {medicalCerts.map((doc, index) => (
                                            <div key={doc.id || `cert-${index}`} className="document-card">
                                                <div className="card-header">
                                                    <h4>{doc.filename || 'Medical Certificate'}</h4>
                                                    <button
                                                        className="download-btn"
                                                        onClick={() => downloadDocument(doc.id, doc.filename)}
                                                    >
                                                        ⬇️ Download
                                                    </button>
                                                </div>
                                                <div className="card-body">
                                                    {doc.description && <p><strong>Description:</strong> {doc.description}</p>}
                                                    {doc.upload_date && (
                                                        <p><strong>Uploaded:</strong> {new Date(doc.upload_date).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Other Documents Section */}
                        <div className="records-section">
                            <h3>📄 Other Documents</h3>
                            {(() => {
                                const otherDocs = (myData.documents || []).filter(d => {
                                    const docType = d.document_type || d.documentType;
                                    return docType && 
                                           docType !== 'prescription' && 
                                           docType !== 'lab_report' && 
                                           docType !== 'medical_certificate';
                                });
                                
                                if (otherDocs.length === 0) {
                                    return <p className="no-data">No other documents uploaded</p>;
                                }
                                
                                return (
                                    <div className="documents-grid">
                                        {otherDocs.map((doc, index) => (
                                            <div key={doc.id || `doc-${index}`} className="document-card">
                                                <div className="card-header">
                                                    <h4>{doc.filename || 'Document'}</h4>
                                                    <button
                                                        className="download-btn"
                                                        onClick={() => downloadDocument(doc.id, doc.filename)}
                                                    >
                                                        ⬇️ Download
                                                    </button>
                                                </div>
                                                <div className="card-body">
                                                    <p><strong>Type:</strong> {(doc.document_type || doc.documentType || 'Unknown').replace('_', ' ')}</p>
                                                    {doc.description && <p><strong>Description:</strong> {doc.description}</p>}
                                                    {doc.upload_date && (
                                                        <p><strong>Uploaded:</strong> {new Date(doc.upload_date).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
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
