import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [newStock, setNewStock] = useState({ medicineId: '', quantity: '', action: 'add' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, medicinesRes, prescriptionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/pharmacist/dashboard/stats', { headers }).catch(() => ({ data: { stats: {} } })),
        axios.get('http://localhost:5000/api/pharmacist/medicines', { headers }).catch(() => ({ data: { medicines: [] } })),
        axios.get('http://localhost:5000/api/pharmacist/prescriptions', { headers }).catch(() => ({ data: { prescriptions: [] } }))
      ]);

      setStats(statsRes.data.stats || {});
      setMedicines(medicinesRes.data.medicines || []);
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `http://localhost:5000/api/pharmacist/medicines/${newStock.medicineId}/stock`,
        { quantity: parseInt(newStock.quantity), action: newStock.action },
        { headers }
      );

      alert('✅ Stock updated successfully!');
      setNewStock({ medicineId: '', quantity: '', action: 'add' });
      loadAllData();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleDispense = async (prescriptionId) => {
    const quantity = prompt('Enter quantity to dispense:');
    if (!quantity) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `http://localhost:5000/api/pharmacist/prescriptions/${prescriptionId}/dispense`,
        { quantity: parseInt(quantity) },
        { headers }
      );

      alert('✅ Medicine dispensed successfully!');
      loadAllData();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>💊 Pharmacist Dashboard</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ padding: '10px 15px', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', backgroundColor: activeTab === 'dashboard' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          📊 Dashboard
        </button>
        <button onClick={() => setActiveTab('inventory')} style={{ padding: '10px 15px', fontWeight: activeTab === 'inventory' ? 'bold' : 'normal', backgroundColor: activeTab === 'inventory' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          📦 Inventory ({medicines.length})
        </button>
        <button onClick={() => setActiveTab('prescriptions')} style={{ padding: '10px 15px', fontWeight: activeTab === 'prescriptions' ? 'bold' : 'normal', backgroundColor: activeTab === 'prescriptions' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          📋 Prescriptions ({prescriptions.length})
        </button>
        <button onClick={() => setActiveTab('update')} style={{ padding: '10px 15px', fontWeight: activeTab === 'update' ? 'bold' : 'normal', backgroundColor: activeTab === 'update' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          ➕ Update Stock
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>{stats.totalMedicines || 0}</div>
            <div>Total Medicines</div>
          </div>
          <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#c62828' }}>{stats.lowStock || 0}</div>
            <div>Low Stock Items</div>
          </div>
          <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e65100' }}>{stats.pendingPrescriptions || 0}</div>
            <div>Pending Prescriptions</div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <h2>Medicine Inventory ({medicines.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead style={{ backgroundColor: '#f0f0f0' }}>
              <tr>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Medicine Name</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Stock</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Unit Price</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.category}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.quantity_in_stock}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{m.unit_price}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: m.quantity_in_stock < m.reorder_level ? '#ffcdd2' : '#c8e6c9', color: m.quantity_in_stock < m.reorder_level ? '#c62828' : '#2e7d32' }}>
                      {m.quantity_in_stock < m.reorder_level ? '⚠️ Low' : '✓ OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div>
          <h2>Prescriptions ({prescriptions.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead style={{ backgroundColor: '#f0f0f0' }}>
              <tr>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Patient</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Medicine</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Dosage</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Duration</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Doctor</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.patient_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.medicine_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.dosage}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.duration}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.doctor_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button onClick={() => handleDispense(p.id)} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>
                      Dispense
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'update' && (
        <form onSubmit={handleStockUpdate} style={{ maxWidth: '600px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Update Medicine Stock</h2>
          <select value={newStock.medicineId} onChange={(e) => setNewStock({ ...newStock, medicineId: e.target.value })} required style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option value="">Select Medicine</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <input type="number" placeholder="Quantity" value={newStock.quantity} onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <select value={newStock.action} onChange={(e) => setNewStock({ ...newStock, action: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '4px' }}>
            Update Stock
          </button>
        </form>
      )}
    </div>
  );
}

export default PharmacistDashboard;
