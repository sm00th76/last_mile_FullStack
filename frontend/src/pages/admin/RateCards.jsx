import { useState, useEffect } from 'react';
import api from '../../api/axios';

const emptyForm = {
  orderType: 'B2C',
  rateType: 'Standard',
  baseRate: '',
  perKgRate: '',
  minCharge: '',
  volumetricDivisor: '5000',
  codSurchargeFlat: '0',
  codSurchargePercent: '0',
  isActive: true,
};

const RateCards = () => {
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  const fetchRateCards = async () => {
    try {
      const { data } = await api.get('/admin/rate-cards');
      setRateCards(data.rateCards || data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch rate cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRateCards(); }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      ...form,
      baseRate: Number(form.baseRate),
      perKgRate: Number(form.perKgRate),
      minCharge: Number(form.minCharge),
      volumetricDivisor: Number(form.volumetricDivisor),
      codSurchargeFlat: Number(form.codSurchargeFlat),
      codSurchargePercent: Number(form.codSurchargePercent),
    };
    try {
      if (editingId) {
        await api.put(`/admin/rate-cards/${editingId}`, payload);
      } else {
        await api.post('/admin/rate-cards', payload);
      }
      resetForm();
      fetchRateCards();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save rate card');
    }
  };

  const handleEdit = (rc) => {
    setForm({
      orderType: rc.orderType,
      rateType: rc.rateType || 'Standard',
      baseRate: String(rc.baseRate),
      perKgRate: String(rc.perKgRate),
      minCharge: String(rc.minCharge),
      volumetricDivisor: String(rc.volumetricDivisor),
      codSurchargeFlat: String(rc.codSurchargeFlat || 0),
      codSurchargePercent: String(rc.codSurchargePercent || 0),
      isActive: rc.isActive,
    });
    setEditingId(rc._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rate card?')) return;
    try {
      await api.delete(`/admin/rate-cards/${id}`);
      fetchRateCards();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete rate card');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading rate cards...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Rate Cards</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {/* Form */}
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
        <h3>{editingId ? 'Edit Rate Card' : 'Add Rate Card'}</h3>
        {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="form-group">
              <label>Order Type</label>
              <select name="orderType" value={form.orderType} onChange={handleChange}>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rate Type</label>
              <input type="text" name="rateType" value={form.rateType} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Base Rate (₹)</label>
              <input type="number" name="baseRate" value={form.baseRate} onChange={handleChange} min="0" step="any" required />
            </div>
            <div className="form-group">
              <label>Per Kg Rate (₹)</label>
              <input type="number" name="perKgRate" value={form.perKgRate} onChange={handleChange} min="0" step="any" required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="form-group">
              <label>Min Charge (₹)</label>
              <input type="number" name="minCharge" value={form.minCharge} onChange={handleChange} min="0" step="any" required />
            </div>
            <div className="form-group">
              <label>Volumetric Divisor</label>
              <input type="number" name="volumetricDivisor" value={form.volumetricDivisor} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group">
              <label>COD Surcharge Flat (₹)</label>
              <input type="number" name="codSurchargeFlat" value={form.codSurchargeFlat} onChange={handleChange} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>COD Surcharge %</label>
              <input type="number" name="codSurchargePercent" value={form.codSurchargePercent} onChange={handleChange} min="0" max="100" step="any" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              {' '}Active
            </label>
          </div>
          <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" onClick={resetForm} style={{ marginLeft: 8 }}>Cancel</button>}
        </form>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Order Type</th>
              <th style={{ padding: 8 }}>Rate Type</th>
              <th style={{ padding: 8 }}>Base Rate</th>
              <th style={{ padding: 8 }}>Per Kg</th>
              <th style={{ padding: 8 }}>Min Charge</th>
              <th style={{ padding: 8 }}>Vol. Divisor</th>
              <th style={{ padding: 8 }}>COD Flat</th>
              <th style={{ padding: 8 }}>COD %</th>
              <th style={{ padding: 8 }}>Active</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rateCards.map((rc) => (
              <tr key={rc._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{rc.orderType}</td>
                <td style={{ padding: 8 }}>{rc.rateType}</td>
                <td style={{ padding: 8 }}>₹{rc.baseRate}</td>
                <td style={{ padding: 8 }}>₹{rc.perKgRate}</td>
                <td style={{ padding: 8 }}>₹{rc.minCharge}</td>
                <td style={{ padding: 8 }}>{rc.volumetricDivisor}</td>
                <td style={{ padding: 8 }}>₹{rc.codSurchargeFlat || 0}</td>
                <td style={{ padding: 8 }}>{rc.codSurchargePercent || 0}%</td>
                <td style={{ padding: 8 }}>{rc.isActive ? '✅' : '❌'}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => handleEdit(rc)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(rc._id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
            {rateCards.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 8, textAlign: 'center' }}>No rate cards found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RateCards;
