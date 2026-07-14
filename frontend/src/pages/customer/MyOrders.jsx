import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/mine');
        setOrders(data.orders || data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading orders...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet. <a href="/customer/place-order">Place your first order</a></p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Order #</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Type</th>
              <th style={{ padding: 8 }}>Payment</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{order.orderNumber}</td>
                <td style={{ padding: 8 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 13,
                    background: order.status === 'Delivered' ? '#d4edda' :
                      order.status === 'Failed' ? '#f8d7da' : '#fff3cd',
                    color: order.status === 'Delivered' ? '#155724' :
                      order.status === 'Failed' ? '#721c24' : '#856404',
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{order.orderType}</td>
                <td style={{ padding: 8 }}>{order.paymentType}</td>
                <td style={{ padding: 8 }}>₹{order.pricing.totalCharge ?? '—'}</td>
                <td style={{ padding: 8 }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => navigate(`/customer/track/${order._id}`)}
                    style={{ marginRight: 8 }}
                  >
                    Track
                  </button>
                  {order.status === 'Failed' && (
                    <button onClick={() => navigate(`/customer/reschedule/${order._id}`)}>
                      Reschedule
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyOrders;
