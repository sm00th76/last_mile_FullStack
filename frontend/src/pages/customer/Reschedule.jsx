import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Reschedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/orders/${id}/reschedule`, { newDate, reason });
      setSuccess(true);
      setTimeout(() => navigate('/customer/my-orders'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reschedule order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 500 }}>
      <h2>Reschedule Order</h2>

      {success && (
        <div style={{ color: 'green', padding: 12, background: '#d4edda', borderRadius: 4, marginBottom: 16 }}>
          Order rescheduled successfully! Redirecting to My Orders...
        </div>
      )}

      {error && (
        <div style={{ color: 'red', padding: 12, background: '#f8d7da', borderRadius: 4, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>New Delivery Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Why are you rescheduling this order?"
              required
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Rescheduling...' : 'Reschedule'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/customer/my-orders')}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default Reschedule;
