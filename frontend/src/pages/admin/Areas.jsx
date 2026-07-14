import { useState, useEffect } from 'react';
import api from '../../api/axios';

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ pincode: '', city: '', zoneId: '' });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  const fetchAreas = async () => {
    try {
      const { data } = await api.get('/admin/areas');
      setAreas(data.areas || data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch areas');
    }
  };

  const fetchZones = async () => {
    try {
      const { data } = await api.get('/admin/zones');
      setZones(data.zones || data);
    } catch (err) {
      console.error('Failed to fetch zones for dropdown');
    }
  };

  useEffect(() => {
    Promise.all([fetchAreas(), fetchZones()]).then(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ pincode: '', city: '', zoneId: '' });
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        await api.put(`/admin/areas/${editingId}`, form);
      } else {
        await api.post('/admin/areas', form);
      }
      resetForm();
      fetchAreas();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save area');
    }
  };

  const handleEdit = (area) => {
    setForm({
      pincode: area.pincode,
      city: area.city,
      zoneId: area.zoneId?._id || area.zoneId || '',
    });
    setEditingId(area._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this area?')) return;
    try {
      await api.delete(`/admin/areas/${id}`);
      fetchAreas();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete area');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading areas...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Areas</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {/* Form */}
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
        <h3>{editingId ? 'Edit Area' : 'Add Area'}</h3>
        {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label>Pincode</label>
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Zone</label>
            <select
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
              required
            >
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </form>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Pincode</th>
            <th style={{ padding: 8 }}>City</th>
            <th style={{ padding: 8 }}>Zone</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{area.pincode}</td>
              <td style={{ padding: 8 }}>{area.city}</td>
              <td style={{ padding: 8 }}>{area.zoneId?.name || area.zoneName || '—'}</td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleEdit(area)} style={{ marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDelete(area._id)} style={{ color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
          {areas.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 8, textAlign: 'center' }}>No areas found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Areas;
