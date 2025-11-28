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
    const [activeTab, setActiveTab] = useState('appointments');
    const [loading, setLoading] = useState(true);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('prescription');
    const [documentDescription, setDocumentDescription] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [aiError, setAiError] = useState(null);
    
    const [myData, setMyData] = useState({
        appointments: [],
        documents: []
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

            // Load documents
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
                documents: documentsRes.data.documents || []
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

    const handleUploadDocument = async (e) => {
        e.preventDefault();
        setUploadMessage('');
        setUploadError('');

        if (!selectedFile) {
            setUploadError('Please select a file');
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
                        className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appointments')}
                    >
                        📅 Appointments ({myData.appointments.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'prescription-analysis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('prescription-analysis')}
                    >
                        🤖 Prescription Analysis
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        📄 Documents ({myData.documents.length})
                    </button>
                </div>

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
                {activeTab === 'prescription-analysis' && (
                    <div className="tab-content">
                        <h2>🤖 AI Prescription Analysis</h2>
                        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0 }}>Upload Prescription for AI Analysis</h3>
                            <p style={{ color: '#666', marginBottom: '15px' }}>Upload a prescription image or PDF to get AI-powered medication instructions and guidance.</p>
                            
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!selectedFile) {
                                    setUploadError('Please select a file');
                                    return;
                                }
                                
                                setLoadingAI(true);
                                setAiError(null);
                                setAiSuggestions(null);
                                setUploadMessage('');
                                setUploadError('');
                                
                                try {
                                    const formData = new FormData();
                                    formData.append('file', selectedFile);
                                    formData.append('notes', documentDescription);
                                    
                                    const token = localStorage.getItem('token');
                                    const response = await axios.post(
                                        `${API_URL}/prescription-analyze`,
                                        formData,
                                        {
                                            headers: { 
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'multipart/form-data'
                                            },
                                            timeout: 60000
                                        }
                                    );
                                    
                                    if (response.data.success) {
                                        setAiSuggestions(response.data.analysis);
                                        setUploadMessage('✅ Analysis complete!');
                                        setSelectedFile(null);
                                        setDocumentDescription('');
                                        document.querySelector('input[type="file"]').value = '';
                                    } else {
                                        setAiError(response.data.error || 'Analysis failed');
                                    }
                                } catch (error) {
                                    console.error('Analysis error:', error);
                                    setAiError(error.response?.data?.error || error.message || 'Failed to analyze prescription');
                                } finally {
                                    setLoadingAI(false);
                                }
                            }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Prescription File:</label>
                                    <input 
                                        type="file" 
                                        onChange={handleFileSelect}
                                        accept="image/*,.pdf"
                                        style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Additional Notes (optional):</label>
                                    <textarea
                                        value={documentDescription}
                                        onChange={(e) => setDocumentDescription(e.target.value)}
                                        placeholder="Any additional information about the prescription..."
                                        style={{ width: '100%', maxWidth: '400px', minHeight: '60px', padding: '8px' }}
                                    />
                                </div>
                                
                                <button 
                                    type="submit"
                                    disabled={loadingAI || !selectedFile}
                                    style={{
                                        backgroundColor: loadingAI ? '#ccc' : '#4CAF50',
                                        color: 'white',
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: loadingAI || !selectedFile ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loadingAI ? '🤖 Analyzing...' : '🤖 Analyze Prescription'}
                                </button>
                            </form>
                            
                            {uploadMessage && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
                                    {uploadMessage}
                                </div>
                            )}
                            
                            {uploadError && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
                                    {uploadError}
                                </div>
                            )}
                            
                            {aiError && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
                                    ❌ {aiError}
                                </div>
                            )}
                        </div>
                        
                        {aiSuggestions && (
                            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                                <h3 style={{ color: '#4CAF50', marginTop: 0 }}>📋 Analysis Results</h3>
                                
                                {typeof aiSuggestions === 'object' ? (
                                    <>
                                        {aiSuggestions.howToTake && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ color: '#2196F3' }}>💊 How to Take:</h4>
                                                <p style={{ color: '#555', lineHeight: '1.6' }}>{aiSuggestions.howToTake}</p>
                                            </div>
                                        )}
                                        
                                        {aiSuggestions.importantNotes && aiSuggestions.importantNotes.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ color: '#FF9800' }}>⚠️ Important Notes:</h4>
                                                <ul style={{ color: '#555', lineHeight: '1.6' }}>
                                                    {aiSuggestions.importantNotes.map((note, i) => <li key={i}>{note}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {aiSuggestions.sideEffects && aiSuggestions.sideEffects.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ color: '#F44336' }}>🚨 Possible Side Effects:</h4>
                                                <ul style={{ color: '#555', lineHeight: '1.6' }}>
                                                    {aiSuggestions.sideEffects.map((effect, i) => <li key={i}>{effect}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {aiSuggestions.precautions && aiSuggestions.precautions.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ color: '#9C27B0' }}>🛡️ Precautions:</h4>
                                                <ul style={{ color: '#555', lineHeight: '1.6' }}>
                                                    {aiSuggestions.precautions.map((precaution, i) => <li key={i}>{precaution}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {aiSuggestions.whenToContactDoctor && aiSuggestions.whenToContactDoctor.length > 0 && (
                                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                                                <h4 style={{ color: '#E65100', marginTop: 0 }}>🏥 When to Contact Your Doctor:</h4>
                                                <ul style={{ color: '#555', lineHeight: '1.6', marginBottom: 0 }}>
                                                    {aiSuggestions.whenToContactDoctor.map((situation, i) => <li key={i}>{situation}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {aiSuggestions.warnings && aiSuggestions.warnings.length > 0 && (
                                            <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '6px', border: '1px solid #f44336' }}>
                                                <h4 style={{ color: '#D32F2F', marginTop: 0 }}>⛔ Warnings:</h4>
                                                <ul style={{ color: '#c62828', lineHeight: '1.6', fontWeight: '500', marginBottom: 0 }}>
                                                    {aiSuggestions.warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: '1.6' }}>
                                        {typeof aiSuggestions === 'string' ? aiSuggestions : JSON.stringify(aiSuggestions, null, 2)}
                                    </div>
                                )}
                                
                                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '13px', color: '#1565c0' }}>
                                    <strong>ℹ️ Disclaimer:</strong> This is AI-generated information for educational purposes only. Always follow your doctor's instructions and consult your healthcare provider for medical advice.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="tab-content">
                        <h2>📄 My Documents</h2>
                        
                        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0 }}>Upload New Document</h3>
                            <form onSubmit={handleUploadDocument}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Document Type:</label>
                                    <select 
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                                    >
                                        <option value="prescription">Prescription</option>
                                        <option value="lab_report">Lab Report</option>
                                        <option value="medical_record">Medical Record</option>
                                        <option value="insurance">Insurance Document</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select File:</label>
                                    <input 
                                        type="file" 
                                        onChange={handleFileSelect}
                                        style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description (optional):</label>
                                    <textarea
                                        value={documentDescription}
                                        onChange={(e) => setDocumentDescription(e.target.value)}
                                        placeholder="Add any notes about this document..."
                                        style={{ width: '100%', maxWidth: '400px', minHeight: '60px', padding: '8px' }}
                                    />
                                </div>
                                
                                <button 
                                    type="submit"
                                    disabled={!selectedFile}
                                    style={{
                                        backgroundColor: !selectedFile ? '#ccc' : '#2196F3',
                                        color: 'white',
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: !selectedFile ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    📤 Upload Document
                                </button>
                            </form>
                            
                            {uploadMessage && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
                                    {uploadMessage}
                                </div>
                            )}
                            
                            {uploadError && (
                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
                                    {uploadError}
                                </div>
                            )}
                        </div>
                        
                        <h3>Uploaded Documents</h3>
                        {myData.documents.length === 0 ? (
                            <div className="empty-state">
                                <p>No documents uploaded yet</p>
                            </div>
                        ) : (
                            <div className="documents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {myData.documents.map((doc) => (
                                    <div key={doc.id} style={{ 
                                        padding: '15px', 
                                        backgroundColor: 'white', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <h4 style={{ marginTop: 0, color: '#2196F3' }}>📄 {doc.filename}</h4>
                                        <p><strong>Type:</strong> {doc.document_type?.replace('_', ' ').toUpperCase() || 'Document'}</p>
                                        {doc.description && <p><strong>Description:</strong> {doc.description}</p>}
                                        <p><strong>Uploaded:</strong> {new Date(doc.upload_date || doc.created_at).toLocaleDateString()}</p>
                                        <button
                                            onClick={() => downloadDocument(doc.id, doc.filename)}
                                            style={{
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                padding: '8px 16px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                marginTop: '10px'
                                            }}
                                        >
                                            ⬇️ Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EnhancedPatientDashboard;
