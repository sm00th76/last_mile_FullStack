import { useState, useEffect } from 'react';
import api from '../../api/axios';

const Override = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');

  const STATUSES = [
    'Created', 'Assigned', 'PickedUp', 'InTransit',
    'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'Cancelled'
  ];

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOverride = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;
    setError('');
    setSuccess('');

    try {
      await api.patch(`/orders/${selectedOrder._id}/override`, {
        status: newStatus,
        note: note || undefined,
      });
      setSuccess(`Successfully overrode status of ${selectedOrder.orderNumber} to ${newStatus}`);
      setSelectedOrder(null);
      setNewStatus('');
      setNote('');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Override failed');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading orders...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Administrative Override Portal</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Bypass standard order state machine rules and force update status with automatic tracking audit trail.
      </p>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 1fr' : '1fr', gap: 24 }}>
        <div>
          <h3>Select Order to Override</h3>
          <table className="data-table" style={{ width: '100%', marginTop: 12 }}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Current Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o.orderNumber}</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>{o.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedOrder(o);
                        setNewStatus(o.status);
                      }}
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <div className="card">
            <h3>Override Order: {selectedOrder.orderNumber}</h3>
            <form onSubmit={handleOverride} style={{ marginTop: 12 }}>
              <div className="form-group">
                <label>Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reason / Audit Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter reason for overriding the status transition rules..."
                  rows={4}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Force Transition
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Override;
