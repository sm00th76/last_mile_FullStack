import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const AssignedOrders = () => {
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
        setError(err.response?.data?.error || 'Failed to fetch assigned orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading assigned orders...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Assigned Orders</h2>
      {orders.length === 0 ? (
        <p>No orders assigned to you.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Order #</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Pickup Address</th>
              <th style={{ padding: 8 }}>Drop Address</th>
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
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: 8 }}>
                  {order.pickupAddress?.line}, {order.pickupAddress?.pincode}
                </td>
                <td style={{ padding: 8 }}>
                  {order.dropAddress?.line}, {order.dropAddress?.pincode}
                </td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => navigate(`/agent/update-status/${order._id}`)}>
                    Update Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AssignedOrders;
