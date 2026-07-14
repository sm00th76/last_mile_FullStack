import { useState, useEffect } from 'react';
import api from '../../api/axios';

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '' });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  const fetchZones = async () => {
    try {
      const { data } = await api.get('/admin/zones');
      setZones(data.zones || data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const resetForm = () => {
    setForm({ name: '', code: '' });
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        await api.put(`/admin/zones/${editingId}`, form);
      } else {
        await api.post('/admin/zones', form);
      }
      resetForm();
      fetchZones();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save zone');
    }
  };

  const handleEdit = (zone) => {
    setForm({ name: zone.name, code: zone.code });
    setEditingId(zone._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    try {
      await api.delete(`/admin/zones/${id}`);
      fetchZones();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete zone');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading zones...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Zones</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {/* Form */}
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
        <h3>{editingId ? 'Edit Zone' : 'Add Zone'}</h3>
        {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </form>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Code</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{zone.name}</td>
              <td style={{ padding: 8 }}>{zone.code}</td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleEdit(zone)} style={{ marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDelete(zone._id)} style={{ color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
          {zones.length === 0 && (
            <tr><td colSpan={3} style={{ padding: 8, textAlign: 'center' }}>No zones found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Zones;
