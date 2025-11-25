import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function PrescriptionAnalysis() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError('');
    if (!file) { setError('Select a file!'); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('notes', notes);
      const { data } = await axios.post(`${API_URL}/prescription-analyze`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data.analysis || data.raw || data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to analyze');
      if (err.response?.data?.details) setResult({ details: err.response.data.details });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fafbfc', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ color: '#1976d2' }}>🤖 Prescription Analysis</h2>
      <form onSubmit={handleSubmit} style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" required disabled={loading} onChange={e => setFile(e.target.files[0])} />
        <input type="text" placeholder="Notes (optional)" value={notes} disabled={loading} onChange={e => setNotes(e.target.value)} />
        <button type="submit" disabled={loading || !file} style={{ background: '#1976d2', color: 'white', fontWeight: 'bold', padding: '10px', borderRadius: 5, border: 0, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Analyzing...' : 'Analyze Prescription'}</button>
      </form>
      {error && <div style={{ color: '#b71c1c', marginTop: 16, fontWeight: 'bold' }}>{error}</div>}
      {result && <div style={{ marginTop: 24, background: '#e3f2fd', borderRadius: 7, padding: 16 }}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
      </div>}
    </div>
  );
}
