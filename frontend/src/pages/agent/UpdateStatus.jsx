import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

// State machine transitions: current status -> allowed next statuses
const TRANSITION_MAP = {
  Created: ['Assigned'],
  Assigned: ['PickedUp'],
  PickedUp: ['InTransit'],
  InTransit: ['OutForDelivery'],
  OutForDelivery: ['Delivered', 'Failed'],
  Failed: ['Rescheduled'],
  Rescheduled: ['Assigned'],
};

const UpdateStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        const orderData = data.order || data;
        setOrder(orderData);
        const allowed = TRANSITION_MAP[orderData.status] || [];
        if (allowed.length > 0) setNextStatus(allowed[0]);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (nextStatus === 'Failed' && !note.trim()) {
      setError('Note is required when setting status to Failed');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/orders/${id}/status`, { status: nextStatus, note: note || undefined });
      setSuccess(`Status updated to "${nextStatus}" successfully!`);
      // Refresh order data
      const { data } = await api.get(`/orders/${id}`);
      const orderData = data.order || data;
      setOrder(orderData);
      const allowed = TRANSITION_MAP[orderData.status] || [];
      setNextStatus(allowed.length > 0 ? allowed[0] : '');
      setNote('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading order...</div>;
  if (error && !order) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  const allowedStatuses = TRANSITION_MAP[order?.status] || [];

  return (
    <div style={{ padding: '24px', maxWidth: 500 }}>
      <h2>Update Order Status</h2>

      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
        <p><strong>Order Number:</strong> {order.orderNumber}</p>
        <p><strong>Current Status:</strong>{' '}
          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#cce5ff', fontWeight: 'bold' }}>
            {order.status}
          </span>
        </p>
      </div>

      {success && (
        <div style={{ color: 'green', padding: 12, background: '#d4edda', borderRadius: 4, marginBottom: 16 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ color: 'red', padding: 12, background: '#f8d7da', borderRadius: 4, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {allowedStatuses.length === 0 ? (
        <p>No further status transitions available for this order.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Next Status</label>
            <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Note {nextStatus === 'Failed' && <span style={{ color: 'red' }}>*</span>}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={nextStatus === 'Failed' ? 'Required: explain why the delivery failed' : 'Optional note'}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : `Update to ${nextStatus}`}
          </button>
          <button type="button" onClick={() => navigate('/agent/orders')} style={{ marginLeft: 8 }}>
            Back
          </button>
        </form>
      )}
    </div>
  );
};

export default UpdateStatus;
