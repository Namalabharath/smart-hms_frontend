import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ReceptionistDashboard.css';

function ReceptionistDashboard() {
  const navigate = useNavigate();
  const isLoadingRef = useRef(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
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
  const buildFullName = (first, last, fallback = 'Unknown') => {
    const name = [first, last].filter(Boolean).join(' ').trim();
    return name || fallback;
  };

  useEffect(() => {
    console.log('🔄 ReceptionistDashboard mounted');
    loadAllData();
    // Don't refresh automatically - only load once
  }, []);

  const flashMessage = (type, text, duration = 5000) => {
    setMessage({ type, text });
    if (duration) {
      setTimeout(() => setMessage({ type: '', text: '' }), duration);
    }
  };

  const fetchPatientsData = async () => {
    try {
      const response = await api.get('/receptionist/patients', { timeout: 8000 });
      return response.data?.patients || [];
    } catch (primaryError) {
      console.warn('Primary patient fetch failed, falling back to /patients-all', primaryError);
      try {
        const fallbackResponse = await api.get('/receptionist/patients-all', { timeout: 8000 });
        flashMessage('warning', 'Showing basic patient list while primary service recovers.');
        return fallbackResponse.data?.patients || [];
      } catch (fallbackError) {
        console.error('Fallback patient fetch also failed', fallbackError);
        throw fallbackError;
      }
    }
  };

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
        setLoading(false);
        navigate('/login');
        return;
      }

      const safeFetch = async (label, fetcher, fallback = []) => {
        try {
          const data = await fetcher();
          console.log(`✅ ${label} fetched:`, Array.isArray(data) ? data.length : data);
          return data;
        } catch (err) {
          console.error(`❌ Error fetching ${label}:`, err.response?.data || err.message);
          flashMessage('error', `❌ Unable to load ${label}. Please try again.`);
          return fallback;
        }
      };

      const patientPromise = (async () => {
        try {
          return await fetchPatientsData();
        } catch (err) {
          flashMessage('error', '❌ Unable to load patients. Please try again.');
          return patients;
        }
      })();

      const [patientsData, doctorsData, appointmentsData, staffData] = await Promise.all([
        patientPromise,
        safeFetch('doctors', async () => {
          const response = await api.get('/receptionist/doctors/available', { timeout: 8000 });
          return response.data?.doctors || [];
        }, doctors),
        safeFetch('appointments', async () => {
          const response = await api.get('/receptionist/appointments', { timeout: 8000 });
          return response.data?.appointments || [];
        }, appointments),
        safeFetch('staff', async () => {
          const response = await api.get('/receptionist/staff', { timeout: 8000 });
          return response.data?.staff || [];
        }, staff),
      ]);

      const normalizedAppointments = (appointmentsData || []).map((appointment) => ({
        ...appointment,
        patientFullName:
          appointment.patientFullName ||
          buildFullName(appointment.patient_name, appointment.patient_last_name, 'Unknown patient'),
        doctorFullName:
          appointment.doctorFullName ||
          buildFullName(appointment.doctor_name, appointment.doctor_last_name, 'Unknown doctor')
      }));

      const normalizedStaff = (staffData || []).map((member) => ({
        ...member,
        fullName: member.fullName || buildFullName(member.first_name, member.last_name, 'Unnamed staff')
      }));

      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
      setAppointments(normalizedAppointments);
      setStaff(normalizedStaff);
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
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.post('/receptionist/patients/register', formData);

      setPatients((prev) => [
        {
          id: response.data.patientId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          blood_group: formData.bloodGroup,
          age: formData.age
        },
        ...prev
      ]);

      flashMessage(
        'success',
        `✅ Patient registered!\nUsername: ${response.data.tempUsername}\nPassword: ${response.data.tempPassword}`
      );
      setFormData({
        firstName: '', lastName: '', age: '', gender: '', bloodGroup: '',
        address: '', city: '', postalCode: '', medicalHistory: '', allergies: '',
        emergencyContact: '', email: '', phone: ''
      });
      loadAllData();
    } catch (error) {
      flashMessage('error', '❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Convert datetime-local format (YYYY-MM-DDTHH:MM) to MySQL format (YYYY-MM-DD HH:MM:SS)
      const appointmentDateTime = appointmentForm.appointmentDate.replace('T', ' ') + ':00';

      const payload = {
        patientId: parseInt(appointmentForm.patientId),
        doctorId: parseInt(appointmentForm.doctorId),
        appointmentDate: appointmentDateTime,
        reason: appointmentForm.reason
      };

      console.log('📅 Sending appointment booking request:', payload);

      await api.post('/receptionist/appointments/book', payload);

      flashMessage('success', '✅ Appointment booked successfully!');
      setAppointmentForm({ patientId: '', doctorId: '', appointmentDate: '', reason: '' });
      loadAllData();
    } catch (error) {
      flashMessage('error', '❌ Error: ' + (error.response?.data?.error || error.message));
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
        <button className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
          👥 Patients ({patients.length})
        </button>
        <button className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
          📋 Appointments ({appointments.length})
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
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button onClick={() => setActiveTab('register')} className="action-button action-register">
              ➕ Register New Patient
            </button>
            <button onClick={() => setActiveTab('book')} className="action-button action-book">
              ➕ Book Appointment
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
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
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
                      <td><strong>{a.patientFullName || a.patient_name || 'Unknown patient'}</strong></td>
                      <td>{a.doctorFullName || a.doctor_name || 'Unknown doctor'}</td>
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

    </div>
  );
}

export default ReceptionistDashboard;
