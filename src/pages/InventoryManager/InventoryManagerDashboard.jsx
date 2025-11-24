import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InventoryManagerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [newMedicine, setNewMedicine] = useState({
    name: '', category: '', quantity: '', unitPrice: '', reorderLevel: '', expiryDate: '', supplier: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, inventoryRes] = await Promise.all([
        axios.get('http://localhost:5000/api/inventory-manager/dashboard/stats', { headers }).catch(() => ({ data: { stats: {} } })),
        axios.get('http://localhost:5000/api/inventory-manager/inventory', { headers }).catch(() => ({ data: { inventory: [] } }))
      ]);

      setStats(statsRes.data.stats || {});
      setInventory(inventoryRes.data.inventory || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        'http://localhost:5000/api/inventory-manager/inventory/add',
        newMedicine,
        { headers }
      );

      alert('✅ Medicine added successfully!');
      setNewMedicine({ name: '', category: '', quantity: '', unitPrice: '', reorderLevel: '', expiryDate: '', supplier: '' });
      loadAllData();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>📦 Inventory Manager Dashboard</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ padding: '10px 15px', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', backgroundColor: activeTab === 'dashboard' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          📊 Dashboard
        </button>
        <button onClick={() => setActiveTab('inventory')} style={{ padding: '10px 15px', fontWeight: activeTab === 'inventory' ? 'bold' : 'normal', backgroundColor: activeTab === 'inventory' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          📋 Inventory ({inventory.length})
        </button>
        <button onClick={() => setActiveTab('add')} style={{ padding: '10px 15px', fontWeight: activeTab === 'add' ? 'bold' : 'normal', backgroundColor: activeTab === 'add' ? '#4CAF50' : '#f0f0f0', cursor: 'pointer', borderRadius: '4px' }}>
          ➕ Add Medicine
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>{stats.totalItems || 0}</div>
            <div>Total Items</div>
          </div>
          <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#c62828' }}>{stats.lowStockItems || 0}</div>
            <div>Low Stock Items</div>
          </div>
          <div style={{ backgroundColor: '#fce4ec', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ad1457' }}>{stats.expiredItems || 0}</div>
            <div>Expired Items</div>
          </div>
          <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7b1fa2' }}>₹{stats.totalValue || 0}</div>
            <div>Total Inventory Value</div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <h2>Medication Inventory ({inventory.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead style={{ backgroundColor: '#f0f0f0' }}>
              <tr>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Medicine Name</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Quantity</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Unit Price</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Total Value</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Supplier</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((m) => (
                <tr key={m.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.category}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.quantity_in_stock}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{m.unit_price}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{m.quantity_in_stock * m.unit_price}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.supplier}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: m.expiry_date && new Date(m.expiry_date) <= new Date() ? '#ffcdd2' : '#c8e6c9', color: m.expiry_date && new Date(m.expiry_date) <= new Date() ? '#c62828' : '#2e7d32' }}>
                      {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleAddMedicine} style={{ maxWidth: '600px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h2>Add New Medicine</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input placeholder="Medicine Name" value={newMedicine.name} onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <input placeholder="Category" value={newMedicine.category} onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <input placeholder="Quantity" type="number" value={newMedicine.quantity} onChange={(e) => setNewMedicine({ ...newMedicine, quantity: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <input placeholder="Unit Price" type="number" step="0.01" value={newMedicine.unitPrice} onChange={(e) => setNewMedicine({ ...newMedicine, unitPrice: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <input placeholder="Reorder Level" type="number" value={newMedicine.reorderLevel} onChange={(e) => setNewMedicine({ ...newMedicine, reorderLevel: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <input placeholder="Expiry Date" type="date" value={newMedicine.expiryDate} onChange={(e) => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <input placeholder="Supplier" value={newMedicine.supplier} onChange={(e) => setNewMedicine({ ...newMedicine, supplier: e.target.value })} required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '4px', width: '100%' }}>
            Add Medicine
          </button>
        </form>
      )}
    </div>
  );
}

export default InventoryManagerDashboard;
