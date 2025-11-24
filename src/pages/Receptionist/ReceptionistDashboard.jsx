import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ReceptionistDashboard.css';

function ReceptionistDashboard() {
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [staffAbsences, setStaffAbsences] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
    address: '', city: '', postalCode: '', medicalHistory: '', allergies: '',
    emergencyContact: '', email: '', phone: ''
  });
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '', doctorId: '', appointmentDate: '', reason: ''
  });
  const [staffAbsenceForm, setStaffAbsenceForm] = useState({
    staffId: '', absenceType: 'leave', startDate: '', endDate: '', reason: ''
  });

  useEffect(() => {
    console.log('🔄 ReceptionistDashboard mounted');
    loadAllData();
    // Don't refresh automatically - only load once
  }, []);

  const loadAllData = async () => {
    if (isLoadingRef.current) {
      console.log('⏭️ Request already in progress, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    console.log('📡 Starting fetch...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch only patients and doctors for the form
      console.log('Fetching patients...');
      const patientsRes = await axios.get('http://localhost:5000/api/receptionist/patients', { headers, timeout: 5000 });
      console.log('✅ Patients:', patientsRes.data.patients?.length);
      setPatients(patientsRes.data.patients || []);

      console.log('Fetching doctors...');
      const doctorsRes = await axios.get('http://localhost:5000/api/receptionist/doctors/available', { headers, timeout: 5000 });
      console.log('✅ Doctors:', doctorsRes.data.doctors?.length);
      setDoctors(doctorsRes.data.doctors || []);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading data:', error.message);
      setLoading(false);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        'http://localhost:5000/api/receptionist/patients/register',
        formData,
        { headers }
      );

      setMessage({ type: 'success', text: `✅ Patient registered!\nUsername: ${response.data.tempUsername}\nPassword: ${response.data.tempPassword}` });
      setFormData({
        firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
        address: '', city: '', postalCode: '', medicalHistory: '', allergies: '',
        emergencyContact: '', email: '', phone: ''
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + (error.response?.data?.error || error.message) });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        'http://localhost:5000/api/receptionist/appointments/book',
        appointmentForm,
        { headers }
      );

      setMessage({ type: 'success', text: '✅ Appointment booked successfully!' });
      setAppointmentForm({ patientId: '', doctorId: '', appointmentDate: '', reason: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      loadAllData();
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error: ' + (error.response?.data?.error || error.message) });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleMarkStaffAbsence = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        'http://localhost:5000/api/receptionist/staff-absence/mark',
        staffAbsenceForm,
        { headers }
      );

      setMessage({ type: 'success', text: '✅ Staff absence marked successfully!' });
      setStaffAbsenceForm({ staffId: '', absenceType: 'leave', startDate: '', endDate: '', reason: '' });
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

  if (loading) return <div className="receptionist-loading">Loading...</div>;

  return (
    <div className="receptionist-container">
      <div className="receptionist-header">
        <div className="header-content">
          <h1>👨‍💼 Receptionist Dashboard</h1>
          <p>Manage patients, appointments, and staff</p>
        </div>
        <button onClick={handleLogout} className="logout-button">🚪 Logout</button>
      </div>

      {message.text && (
        <div className={`receptionist-message receptionist-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="receptionist-tabs">
        <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          📊 Dashboard
        </button>
        <button className={`tab-button ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
          📝 Register Patient
        </button>
        <button className={`tab-button ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
          📅 Book Appointment
        </button>
        <button className={`tab-button ${activeTab === 'absence' ? 'active' : ''}`} onClick={() => setActiveTab('absence')}>
          ⚠️ Mark Absence
        </button>
        <button className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
          👥 Patients ({patients.length})
        </button>
        <button className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
          📋 Appointments ({appointments.length})
        </button>
        <button className={`tab-button ${activeTab === 'staff-absences' ? 'active' : ''}`} onClick={() => setActiveTab('staff-absences')}>
          📅 Staff Absences ({staffAbsences.length})
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="receptionist-dashboard-cards">
          <div className="dashboard-card card-patients">
            <div className="card-icon">👥</div>
            <div className="card-number">{patients.length}</div>
            <div className="card-label">Registered Patients</div>
          </div>
          <div className="dashboard-card card-appointments">
            <div className="card-icon">📅</div>
            <div className="card-number">{appointments.length}</div>
            <div className="card-label">Total Appointments</div>
          </div>
          <div className="dashboard-card card-doctors">
            <div className="card-icon">👨‍⚕️</div>
            <div className="card-number">{doctors.length}</div>
            <div className="card-label">Available Doctors</div>
          </div>
          <div className="dashboard-card card-staff">
            <div className="card-icon">👔</div>
            <div className="card-number">{staff.length}</div>
            <div className="card-label">Total Staff</div>
          </div>
          <div className="dashboard-card card-absences">
            <div className="card-icon">⚠️</div>
            <div className="card-number">{staffAbsences.length}</div>
            <div className="card-label">Active Absences</div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button onClick={() => setActiveTab('register')} className="action-button action-register">
              ➕ Register New Patient
            </button>
            <button onClick={() => setActiveTab('book')} className="action-button action-book">
              ➕ Book Appointment
            </button>
            <button onClick={() => setActiveTab('absence')} className="action-button action-absence">
              ⚠️ Mark Staff Absence
            </button>
          </div>
        </div>
      )}

      {activeTab === 'register' && (
        <div className="receptionist-form-container">
          <form onSubmit={handleRegisterPatient} className="receptionist-form">
            <h2>📝 Register New Patient Onsite</h2>
            <p className="form-description">Register a new patient with their basic information</p>
            
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <input 
                  placeholder="First Name" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                  required 
                  className="form-input"
                />
                <input 
                  placeholder="Last Name" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                  required 
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <input 
                  placeholder="Email" 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  className="form-input"
                />
                <input 
                  placeholder="Phone" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <input 
                  placeholder="Age" 
                  type="number" 
                  value={formData.age} 
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })} 
                  required 
                  className="form-input"
                />
                <select 
                  value={formData.gender} 
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })} 
                  required 
                  className="form-input"
                >
                  <option>Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Medical Information</h3>
              <div className="form-row">
                <input 
                  placeholder="Blood Group (e.g., O+)" 
                  value={formData.bloodGroup} 
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} 
                  className="form-input"
                />
                <input 
                  placeholder="Allergies" 
                  value={formData.allergies} 
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} 
                  className="form-input"
                />
              </div>
              <textarea 
                placeholder="Medical History" 
                value={formData.medicalHistory} 
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })} 
                className="form-textarea"
              />
            </div>

            <div className="form-section">
              <h3>Address Information</h3>
              <div className="form-row">
                <input 
                  placeholder="Address" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  className="form-input"
                />
                <input 
                  placeholder="City" 
                  value={formData.city} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <input 
                  placeholder="Postal Code" 
                  value={formData.postalCode} 
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} 
                  className="form-input"
                />
                <input 
                  placeholder="Emergency Contact" 
                  value={formData.emergencyContact} 
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} 
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="form-submit-button">
              ✅ Register Patient
            </button>
          </form>
        </div>
      )}

      {activeTab === 'book' && (
        <div className="receptionist-form-container">
          <form onSubmit={handleBookAppointment} className="receptionist-form">
            <h2>📅 Book Appointment</h2>
            <p className="form-description">Schedule a new appointment for a patient</p>
            
            {/* Debug Info */}
            <div style={{padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '10px', borderRadius: '5px'}}>
              <p><strong>Debug:</strong> Patients: {patients.length}, Doctors: {doctors.length}</p>
            </div>
            
            <div className="form-row">
              <select 
                value={appointmentForm.patientId} 
                onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })} 
                required 
                className="form-input"
              >
                <option value="">Select Patient ({patients.length} available)</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} (ID: {p.id})
                  </option>
                ))}
              </select>
              <select 
                value={appointmentForm.doctorId} 
                onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })} 
                required 
                className="form-input"
              >
                <option value="">Select Doctor ({doctors.length} available)</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name} - {d.specialization}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <input 
                type="datetime-local" 
                value={appointmentForm.appointmentDate} 
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })} 
                required 
                className="form-input"
              />
              <input 
                placeholder="Reason for visit" 
                value={appointmentForm.reason} 
                onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })} 
                required 
                className="form-input"
              />
            </div>
            
            <button type="submit" className="form-submit-button">
              ✅ Book Appointment
            </button>
          </form>
        </div>
      )}

      {activeTab === 'absence' && (
        <div className="receptionist-form-container">
          <form onSubmit={handleMarkStaffAbsence} className="receptionist-form">
            <h2>⚠️ Mark Staff Absence</h2>
            <p className="form-description">Record staff absence (leave, sick day, etc.)</p>
            
            <div className="form-row">
              <select 
                value={staffAbsenceForm.staffId} 
                onChange={(e) => setStaffAbsenceForm({ ...staffAbsenceForm, staffId: e.target.value })} 
                required 
                className="form-input"
              >
                <option value="">Select Staff Member</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} - {s.department || 'General'}
                  </option>
                ))}
              </select>
              <select 
                value={staffAbsenceForm.absenceType} 
                onChange={(e) => setStaffAbsenceForm({ ...staffAbsenceForm, absenceType: e.target.value })} 
                className="form-input"
              >
                <option value="leave">Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="emergency">Emergency</option>
                <option value="training">Training</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-row">
              <input 
                type="date" 
                placeholder="Start Date" 
                value={staffAbsenceForm.startDate} 
                onChange={(e) => setStaffAbsenceForm({ ...staffAbsenceForm, startDate: e.target.value })} 
                required 
                className="form-input"
              />
              <input 
                type="date" 
                placeholder="End Date" 
                value={staffAbsenceForm.endDate} 
                onChange={(e) => setStaffAbsenceForm({ ...staffAbsenceForm, endDate: e.target.value })} 
                required 
                className="form-input"
              />
            </div>
            
            <textarea 
              placeholder="Reason for absence" 
              value={staffAbsenceForm.reason} 
              onChange={(e) => setStaffAbsenceForm({ ...staffAbsenceForm, reason: e.target.value })} 
              className="form-textarea"
            />
            
            <button type="submit" className="form-submit-button">
              ✅ Mark Absence
            </button>
          </form>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="receptionist-table-container">
          <h2>👥 Registered Patients ({patients.length})</h2>
          {patients.length === 0 ? (
            <p className="empty-state">No patients registered yet</p>
          ) : (
            <div className="table-wrapper">
              <table className="receptionist-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Phone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.first_name} {p.last_name}</strong></td>
                      <td>{p.age}</td>
                      <td>{p.gender || '-'}</td>
                      <td>{p.blood_group || '-'}</td>
                      <td>{p.phone || '-'}</td>
                      <td>{p.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="receptionist-table-container">
          <h2>📋 Appointments ({appointments.length})</h2>
          {appointments.length === 0 ? (
            <p className="empty-state">No appointments scheduled</p>
          ) : (
            <div className="table-wrapper">
              <table className="receptionist-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className={`status-${a.status?.toLowerCase()}`}>
                      <td><strong>{a.patient_name}</strong></td>
                      <td>{a.doctor_name}</td>
                      <td>{a.specialization}</td>
                      <td>{new Date(a.appointment_date).toLocaleString()}</td>
                      <td>{a.reason}</td>
                      <td>
                        <span className={`status-badge status-${a.status?.toLowerCase()}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'staff-absences' && (
        <div className="receptionist-table-container">
          <h2>📅 Staff Absences ({staffAbsences.length})</h2>
          {staffAbsences.length === 0 ? (
            <p className="empty-state">No staff absences recorded</p>
          ) : (
            <div className="table-wrapper">
              <table className="receptionist-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {staffAbsences.map((a) => (
                    <tr key={a.id} className={`absence-type-${a.absence_type?.toLowerCase()}`}>
                      <td><strong>{a.staff_name}</strong></td>
                      <td>{a.department || '-'}</td>
                      <td>
                        <span className={`absence-badge absence-${a.absence_type?.toLowerCase()}`}>
                          {a.absence_type}
                        </span>
                      </td>
                      <td>{new Date(a.start_date).toLocaleDateString()}</td>
                      <td>{new Date(a.end_date).toLocaleDateString()}</td>
                      <td>{a.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReceptionistDashboard;
