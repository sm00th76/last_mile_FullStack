import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

const TrackOrder = () => {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTracking = async () => {
    try {
      const { data } = await api.get(`/orders/${id}/tracking`);
      setTracking(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tracking info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading tracking info...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!tracking) return <div style={{ padding: 24 }}>No tracking data available.</div>;

  const events = tracking.trackingHistory || tracking.events || [];

  return (
    <div style={{ padding: '24px', maxWidth: 700 }}>
      <h2>Track Order</h2>
      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
        <p><strong>Order Number:</strong> {tracking.orderNumber}</p>
        <p><strong>Current Status:</strong>{' '}
          <span style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 'bold',
            background: tracking.currentStatus === 'Delivered' ? '#d4edda' :
              tracking.currentStatus === 'Failed' ? '#f8d7da' : '#cce5ff',
          }}>
            {tracking.currentStatus}
          </span>
        </p>
      </div>

      <h3>Tracking Timeline</h3>
      {events.length === 0 ? (
        <p>No tracking events yet.</p>
      ) : (
        <div style={{ borderLeft: '3px solid #ccc', paddingLeft: 20, marginLeft: 8 }}>
          {events.map((event, idx) => (
            <div key={idx} style={{ marginBottom: 20, position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: -28,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: idx === 0 ? '#007bff' : '#ccc',
              }} />
              <div>
                <strong>{event.status}</strong>
                {event.isOverride && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#dc3545', fontStyle: 'italic' }}>
                    (Override)
                  </span>
                )}
              </div>
              {event.note && <div style={{ color: '#555', fontSize: 14 }}>{event.note}</div>}
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {new Date(event.timestamp).toLocaleString()}
                {event.actor?.role && <span> — by {event.actor.role}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 12, color: '#888', marginTop: 16 }}>Auto-refreshing every 15 seconds</p>
    </div>
  );
};

export default TrackOrder;
