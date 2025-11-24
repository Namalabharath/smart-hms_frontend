import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LabTechnicianDashboard.css';

function LabTechnicianDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [samples, setSamples] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [stats, setStats] = useState({
    totalSamples: 0,
    collectedSamples: 0,
    pendingTests: 0,
    completedTests: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [sampleForm, setSampleForm] = useState({
    patientId: '',
    sampleType: 'blood',
    collectionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [reportForm, setReportForm] = useState({
    testRequestId: '',
    testName: '',
    result: '',
    referenceRange: '',
    unit: '',
    status: 'normal',
    remarks: '',
    reportFile: null
  });
  
  const [selectedTestForReport, setSelectedTestForReport] = useState(null);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [samplesRes, testsRes, patientsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/lab-technician/samples', { headers }).catch(() => ({ data: { samples: [] } })),
        axios.get('http://localhost:5000/api/lab-technician/test-requests', { headers }).catch(() => ({ data: { requests: [] } })),
        axios.get('http://localhost:5000/api/lab-technician/patients', { headers }).catch(() => ({ data: { patients: [] } }))
      ]);

      const samplesData = samplesRes.data.samples || [];
      const testsData = testsRes.data.requests || [];
      const patientsData = patientsRes.data.patients || [];

      setSamples(samplesData);
      setTestRequests(testsData);
      setPatients(patientsData);

      // Calculate stats
      const collectedCount = samplesData.filter(s => s.status === 'collected').length;
      const completedTestsCount = testsData.filter(t => t.status === 'completed').length;
      const pendingTestsCount = testsData.filter(t => t.status === 'pending').length;

      setStats({
        totalSamples: samplesData.length,
        collectedSamples: collectedCount,
        pendingTests: pendingTestsCount,
        completedTests: completedTestsCount
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleCollectSample = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        'http://localhost:5000/api/lab-technician/samples/collect',
        sampleForm,
        { headers }
      );

      setMessage({ type: 'success', text: '✅ Sample collected successfully!' });
      setSampleForm({
        patientId: '',
        sampleType: 'blood',
        collectionDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + (error.response?.data?.error || error.message) });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleUpdateSampleStatus = async (sampleId, status) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `http://localhost:5000/api/lab-technician/samples/${sampleId}/status`,
        { status },
        { headers }
      );

      setMessage({ type: 'success', text: '✅ Sample status updated!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + (error.response?.data?.error || error.message) });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!selectedTestForReport) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const formData = new FormData();
      formData.append('testRequestId', selectedTestForReport.id);
      formData.append('testName', reportForm.testName);
      formData.append('result', reportForm.result);
      formData.append('referenceRange', reportForm.referenceRange);
      formData.append('unit', reportForm.unit);
      formData.append('status', reportForm.status);
      formData.append('remarks', reportForm.remarks);
      if (reportForm.reportFile) {
        formData.append('reportFile', reportForm.reportFile);
      }

      await axios.post(
        'http://localhost:5000/api/lab-technician/test-requests/upload-report',
        formData,
        { headers, 'Content-Type': 'multipart/form-data' }
      );

      setMessage({ type: 'success', text: '✅ Test report uploaded successfully!' });
      setReportForm({
        testRequestId: '',
        testName: '',
        result: '',
        referenceRange: '',
        unit: '',
        status: 'normal',
        remarks: '',
        reportFile: null
      });
      setSelectedTestForReport(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + (error.response?.data?.error || error.message) });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="lab-tech-loading">Loading...</div>;

  return (
    <div className="lab-technician-container">
      <div className="lab-tech-header">
        <div className="header-content">
          <h1>🧪 Lab Technician Dashboard</h1>
          <p>Manage patient samples and test reports</p>
        </div>
        <button onClick={handleLogout} className="logout-button">🚪 Logout</button>
      </div>

      {message.text && (
        <div className={`lab-tech-message lab-tech-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="lab-tech-tabs">
        <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          📊 Dashboard
        </button>
        <button className={`tab-button ${activeTab === 'collect' ? 'active' : ''}`} onClick={() => setActiveTab('collect')}>
          🩸 Collect Sample
        </button>
        <button className={`tab-button ${activeTab === 'samples' ? 'active' : ''}`} onClick={() => setActiveTab('samples')}>
          📦 Samples ({samples.length})
        </button>
        <button className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
          🧬 Test Requests ({testRequests.length})
        </button>
        <button className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          📄 Upload Report
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="lab-tech-dashboard-cards">
          <div className="dashboard-card card-total-samples">
            <div className="card-icon">📦</div>
            <div className="card-number">{stats.totalSamples}</div>
            <div className="card-label">Total Samples</div>
          </div>
          <div className="dashboard-card card-collected">
            <div className="card-icon">✅</div>
            <div className="card-number">{stats.collectedSamples}</div>
            <div className="card-label">Collected Samples</div>
          </div>
          <div className="dashboard-card card-pending">
            <div className="card-icon">⏳</div>
            <div className="card-number">{stats.pendingTests}</div>
            <div className="card-label">Pending Tests</div>
          </div>
          <div className="dashboard-card card-completed">
            <div className="card-icon">🎯</div>
            <div className="card-number">{stats.completedTests}</div>
            <div className="card-label">Completed Tests</div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button onClick={() => setActiveTab('collect')} className="action-button action-collect">
              🩸 Collect New Sample
            </button>
            <button onClick={() => setActiveTab('reports')} className="action-button action-report">
              📄 Upload Test Report
            </button>
          </div>
        </div>
      )}

      {/* Collect Sample Tab */}
      {activeTab === 'collect' && (
        <div className="lab-tech-form-container">
          <form onSubmit={handleCollectSample} className="lab-tech-form">
            <h2>🩸 Collect Patient Sample</h2>
            <p className="form-description">Register a new patient sample collection</p>

            <div className="form-section">
              <h3>Sample Information</h3>
              <div className="form-row">
                <select
                  value={sampleForm.patientId}
                  onChange={(e) => setSampleForm({ ...sampleForm, patientId: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <select
                  value={sampleForm.sampleType}
                  onChange={(e) => setSampleForm({ ...sampleForm, sampleType: e.target.value })}
                  className="form-input"
                >
                  <option value="blood">Blood</option>
                  <option value="urine">Urine</option>
                  <option value="stool">Stool</option>
                  <option value="saliva">Saliva</option>
                  <option value="tissue">Tissue</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="date"
                  value={sampleForm.collectionDate}
                  onChange={(e) => setSampleForm({ ...sampleForm, collectionDate: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <textarea
                placeholder="Collection Notes (if any)"
                value={sampleForm.notes}
                onChange={(e) => setSampleForm({ ...sampleForm, notes: e.target.value })}
                className="form-textarea"
              />
            </div>

            <button type="submit" className="submit-button">🩸 Collect Sample</button>
          </form>
        </div>
      )}

      {/* Samples Tab */}
      {activeTab === 'samples' && (
        <div className="lab-tech-table-container">
          <h2>📦 Patient Samples ({samples.length})</h2>
          {samples.length === 0 ? (
            <p className="no-data">No samples collected yet</p>
          ) : (
            <table className="lab-tech-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Sample Type</th>
                  <th>Collection Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample) => (
                  <tr key={sample.id} className={`sample-status-${sample.status}`}>
                    <td><strong>{sample.patient_name}</strong></td>
                    <td>{sample.sample_type}</td>
                    <td>{new Date(sample.collection_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${sample.status}`}>
                        {sample.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{sample.notes || '-'}</td>
                    <td>
                      <select
                        value={sample.status}
                        onChange={(e) => handleUpdateSampleStatus(sample.id, e.target.value)}
                        className="status-dropdown"
                      >
                        <option value="pending">Pending</option>
                        <option value="collected">Collected</option>
                        <option value="processing">Processing</option>
                        <option value="analyzed">Analyzed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Test Requests Tab */}
      {activeTab === 'tests' && (
        <div className="lab-tech-table-container">
          <h2>🧬 Test Requests ({testRequests.length})</h2>
          {testRequests.length === 0 ? (
            <p className="no-data">No test requests available</p>
          ) : (
            <table className="lab-tech-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Doctor</th>
                  <th>Test Type</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {testRequests.map((test) => (
                  <tr key={test.id} className={`test-status-${test.status}`}>
                    <td><strong>{test.patient_name}</strong></td>
                    <td>{test.doctor_name}</td>
                    <td>{test.test_type}</td>
                    <td>{new Date(test.request_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${test.status}`}>
                        {test.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedTestForReport(test)}
                        className="action-btn"
                      >
                        📤 Upload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Upload Report Tab */}
      {activeTab === 'reports' && (
        <div className="lab-tech-form-container">
          <form onSubmit={handleUploadReport} className="lab-tech-form">
            <h2>📄 Upload Test Report</h2>
            <p className="form-description">Upload test results and attach report file</p>

            {!selectedTestForReport ? (
              <div className="form-section">
                <p style={{ color: '#d32f2f', fontWeight: '500' }}>👈 Please select a test request from the "Test Requests" tab first</p>
              </div>
            ) : (
              <>
                <div className="form-section" style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4>Selected Test</h4>
                  <p><strong>Patient:</strong> {selectedTestForReport.patient_name}</p>
                  <p><strong>Doctor:</strong> {selectedTestForReport.doctor_name}</p>
                  <p><strong>Test Type:</strong> {selectedTestForReport.test_type}</p>
                  <p><strong>Request Date:</strong> {new Date(selectedTestForReport.request_date).toLocaleDateString()}</p>
                </div>

                <div className="form-section">
                  <h3>Test Results</h3>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Test Name (e.g., Blood Sugar Level)"
                      value={reportForm.testName}
                      onChange={(e) => setReportForm({ ...reportForm, testName: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Result Value (e.g., 95)"
                      value={reportForm.result}
                      onChange={(e) => setReportForm({ ...reportForm, result: e.target.value })}
                      required
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., mg/dL)"
                      value={reportForm.unit}
                      onChange={(e) => setReportForm({ ...reportForm, unit: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Reference Range (e.g., 70-100)"
                      value={reportForm.referenceRange}
                      onChange={(e) => setReportForm({ ...reportForm, referenceRange: e.target.value })}
                      className="form-input"
                    />
                    <select
                      value={reportForm.status}
                      onChange={(e) => setReportForm({ ...reportForm, status: e.target.value })}
                      className="form-input"
                    >
                      <option value="normal">Normal</option>
                      <option value="abnormal">Abnormal</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Remarks and Notes"
                    value={reportForm.remarks}
                    onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                <div className="form-section">
                  <h3>Attach Report File</h3>
                  <input
                    type="file"
                    onChange={(e) => setReportForm({ ...reportForm, reportFile: e.target.files[0] })}
                    accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
                    className="form-file-input"
                  />
                  <small>Accepted formats: PDF, DOC, DOCX, XLSX, JPG, PNG</small>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="submit-button">📤 Upload Report</button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTestForReport(null);
                      setReportForm({
                        testRequestId: '',
                        testName: '',
                        result: '',
                        referenceRange: '',
                        unit: '',
                        status: 'normal',
                        remarks: '',
                        reportFile: null
                      });
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default LabTechnicianDashboard;
