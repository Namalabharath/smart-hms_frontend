import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';
import './PharmacistDashboard.css';

function PharmacistDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newStock, setNewStock] = useState({ medicineId: '', quantity: '', action: 'add' });

  useEffect(() => {
    loadAllData();
  }, []);

  const flashMessage = (type, text, duration = 5000) => {
    setMessage({ type, text });
    if (duration) {
      setTimeout(() => setMessage({ type: '', text: '' }), duration);
    }
  };

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      const [statsRes, medicinesRes, prescriptionsRes] = await Promise.all([
        axios.get(`${API_BASE}/pharmacist/dashboard/stats`, { headers }).catch(() => ({ data: { success: false, stats: {} } })),
        axios.get(`${API_BASE}/pharmacist/medicines`, { headers }).catch(() => ({ data: { success: false, medicines: [] } })),
        axios.get(`${API_BASE}/pharmacist/prescriptions`, { headers }).catch(() => ({ data: { success: false, prescriptions: [] } }))
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats || {});
      }

      if (medicinesRes.data.success) {
        // Remove duplicates by id
        const medicinesData = medicinesRes.data.medicines || [];
        const uniqueMedicines = medicinesData.reduce((acc, medicine) => {
          if (!acc.find(m => m.id === medicine.id)) {
            acc.push(medicine);
          }
          return acc;
        }, []);
        setMedicines(uniqueMedicines);
      }

      if (prescriptionsRes.data.success) {
        const normalizedPrescriptions = (prescriptionsRes.data.prescriptions || []).map(p => ({
          ...p,
          patient_name: p.patient_name && p.patient_last_name 
            ? `${p.patient_name} ${p.patient_last_name}` 
            : p.patient_name || 'Unknown Patient',
          doctor_name: p.doctor_name && p.doctor_last_name 
            ? `Dr. ${p.doctor_name} ${p.doctor_last_name}` 
            : p.doctor_name || 'Unknown Doctor'
        }));
        setPrescriptions(normalizedPrescriptions);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      flashMessage('error', 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    
    if (!newStock.medicineId) {
      flashMessage('error', 'Please select a medicine');
      return;
    }

    if (!newStock.quantity || parseInt(newStock.quantity) <= 0) {
      flashMessage('error', 'Please enter a valid quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      const response = await axios.post(
        `${API_BASE}/pharmacist/medicines/${newStock.medicineId}/stock`,
        { 
          quantity: parseInt(newStock.quantity), 
          action: newStock.action 
        },
        { headers }
      );

      if (response.data.success) {
        const actionText = newStock.action === 'add' ? 'added' : 'removed';
        flashMessage('success', `✅ Stock ${actionText} successfully! New stock: ${response.data.medicine?.stock_quantity || 'N/A'}`);
        setNewStock({ medicineId: '', quantity: '', action: 'add' });
        // Reload data after a short delay to see the update
        setTimeout(() => {
          loadAllData();
        }, 500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      flashMessage('error', '❌ Error: ' + errorMsg);
      console.error('Stock update error:', error);
    }
  };

  const handleDispense = async (prescriptionId) => {
    const quantity = prompt('Enter quantity to dispense:');
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      flashMessage('error', 'Invalid quantity entered');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      await axios.post(
        `${API_BASE}/pharmacist/prescriptions/${prescriptionId}/dispense`,
        { quantity: parseInt(quantity) },
        { headers }
      );

      flashMessage('success', '✅ Medicine dispensed successfully!');
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

  if (loading) {
    return (
      <div className="pharmacist-container">
        <div className="loading">Loading pharmacist dashboard...</div>
      </div>
    );
  }

  return (
    <div className="pharmacist-container">
      <div className="pharmacist-header">
        <h1>💊 Pharmacist Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="pharmacist-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory ({medicines.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'prescriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('prescriptions')}
        >
          📋 Prescriptions ({prescriptions.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => setActiveTab('update')}
        >
          ➕ Update Stock
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="tab-content">
          <h2>📊 Dashboard Overview</h2>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.totalMedicines || 0}</div>
              <div className="stat-label">Total Medicines</div>
            </div>
            <div className="stat-card low-stock">
              <div className="stat-number">{stats.lowStock || 0}</div>
              <div className="stat-label">Low Stock Items</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-number">{stats.pendingPrescriptions || 0}</div>
              <div className="stat-label">Pending Prescriptions</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="tab-content">
          <h2>📦 Medicine Inventory ({medicines.length})</h2>
          {medicines.length === 0 ? (
            <div className="empty-state">No medicines in inventory</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Generic Name</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {medicines
                  .filter((m, index, self) => 
                    index === self.findIndex(med => med.id === m.id)
                  )
                  .map((m) => {
                    const stock = m.stock_quantity || m.quantity_in_stock || 0;
                    const reorderLevel = m.reorder_level || 20;
                    const isLowStock = stock < reorderLevel;
                    
                    return (
                      <tr key={`medicine-${m.id}`}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.generic_name || '-'}</td>
                        <td><strong>{stock}</strong></td>
                        <td>{reorderLevel}</td>
                        <td>₹{m.price || m.unit_price || '0.00'}</td>
                        <td>
                          <span className={`status-badge ${isLowStock ? 'low' : 'ok'}`}>
                            {isLowStock ? '⚠️ Low Stock' : '✓ In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="tab-content">
          <h2>📋 Pending Prescriptions ({prescriptions.filter(p => p.status !== 'dispensed').length})</h2>
          {prescriptions.length === 0 ? (
            <div className="empty-state">No prescriptions available</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.patient_name}</strong></td>
                    <td>{p.medicine_name}</td>
                    <td>{p.dosage || '-'}</td>
                    <td>{p.frequency || '-'}</td>
                    <td>{p.duration || '-'}</td>
                    <td>{p.doctor_name}</td>
                    <td>{p.prescription_date ? new Date(p.prescription_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`status-badge ${p.status === 'dispensed' ? 'ok' : 'low'}`}>
                        {p.status === 'dispensed' ? '✓ Dispensed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      {p.status !== 'dispensed' && (
                        <button
                          onClick={() => handleDispense(p.id)}
                          className="action-btn dispense"
                        >
                          Dispense
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'update' && (
        <div className="tab-content">
          <h2>➕ Update Medicine Stock</h2>
          <form onSubmit={handleStockUpdate} className="form-container">
            <div className="form-group">
              <label>Select Medicine</label>
              <select
                value={newStock.medicineId}
                onChange={(e) => setNewStock({ ...newStock, medicineId: e.target.value })}
                required
                className="form-control"
              >
                <option value="">-- Select Medicine --</option>
                {medicines
                  .filter((m, index, self) => 
                    index === self.findIndex(med => med.id === m.id)
                  )
                  .map((m) => {
                    const stock = m.stock_quantity || m.quantity_in_stock || 0;
                    return (
                      <option key={`select-${m.id}`} value={m.id}>
                        {m.name} (Current Stock: {stock})
                      </option>
                    );
                  })}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  value={newStock.quantity}
                  onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                  required
                  min="1"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Action</label>
                <select
                  value={newStock.action}
                  onChange={(e) => setNewStock({ ...newStock, action: e.target.value })}
                  className="form-control"
                >
                  <option value="add">➕ Add Stock</option>
                  <option value="remove">➖ Remove Stock</option>
                </select>
              </div>
            </div>
            <button type="submit" className="submit-btn">
              Update Stock
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PharmacistDashboard;
