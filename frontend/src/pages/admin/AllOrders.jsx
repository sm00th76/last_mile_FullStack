import { useState, useEffect } from 'react';
import api from '../../api/axios';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [zones, setZones] = useState([]);

  // Modals
  const [assignModal, setAssignModal] = useState(null); // orderId
  const [selectedAgent, setSelectedAgent] = useState('');
  const [overrideModal, setOverrideModal] = useState(null); // orderId
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const STATUSES = ['Created', 'Assigned', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled'];

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (zoneFilter) params.zone = zoneFilter;
      if (agentFilter) params.agentId = agentFilter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.orders || data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await api.get('/admin/agents');
      setAgents(data.agents || data);
    } catch (err) {
      console.error('Failed to fetch agents');
    }
  };

  const fetchZones = async () => {
    try {
      const { data } = await api.get('/admin/zones');
      setZones(data.zones || data);
    } catch (err) {
      console.error('Failed to fetch zones');
    }
  };

  useEffect(() => {
    Promise.all([fetchOrders(), fetchAgents(), fetchZones()]);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [statusFilter, zoneFilter, agentFilter]);

  // Assign agent
  const handleAssign = async () => {
    if (!selectedAgent) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/orders/${assignModal}/assign`, { agentId: selectedAgent });
      setAssignModal(null);
      setSelectedAgent('');
      fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to assign agent');
    } finally {
      setActionLoading(false);
    }
  };

  // Override status
  const handleOverride = async () => {
    if (!overrideStatus) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/orders/${overrideModal}/override`, {
        status: overrideStatus,
        note: overrideNote || undefined,
      });
      setOverrideModal(null);
      setOverrideStatus('');
      setOverrideNote('');
      fetchOrders();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to override status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && orders.length === 0) return <div style={{ padding: 24 }}>Loading orders...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>All Orders</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="form-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Zone</label>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
            <option value="">All</option>
            {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Agent</label>
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
            <option value="">All</option>
            {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Order #</th>
              <th style={{ padding: 8 }}>Customer</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Type</th>
              <th style={{ padding: 8 }}>Agent</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{order.orderNumber}</td>
                <td style={{ padding: 8 }}>{order.customerId?.name || order.customerName || '—'}</td>
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
                <td style={{ padding: 8 }}>{order.orderType}</td>
                <td style={{ padding: 8 }}>{order.assignedAgentId?.userId?.name || '—'}</td>
                <td style={{ padding: 8 }}>₹{order.pricing?.totalCharge ?? '—'}</td>
                <td style={{ padding: 8 }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 8, display: 'flex', gap: 4 }}>
                  <button onClick={() => window.open(`/customer/track/${order._id}`, '_blank')}>
                    View
                  </button>
                  <button onClick={() => { setAssignModal(order._id); setActionError(''); }}>
                    Assign
                  </button>
                  <button onClick={() => { setOverrideModal(order._id); setActionError(''); }}>
                    Override
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 8, textAlign: 'center' }}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Agent Modal */}
      {assignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 350 }}>
            <h3>Assign Agent</h3>
            {actionError && <div style={{ color: 'red', marginBottom: 8 }}>{actionError}</div>}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Select Agent</label>
              <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                <option value="">Choose an agent</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.status}) — {a.activeOrderCount ?? 0} orders
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleAssign} className="btn-primary" disabled={actionLoading || !selectedAgent}>
              {actionLoading ? 'Assigning...' : 'Assign'}
            </button>
            <button onClick={() => { setAssignModal(null); setSelectedAgent(''); }} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Override Status Modal */}
      {overrideModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 350 }}>
            <h3>Override Status</h3>
            {actionError && <div style={{ color: 'red', marginBottom: 8 }}>{actionError}</div>}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>New Status</label>
              <select value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)}>
                <option value="">Select status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Note</label>
              <textarea
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                rows={3}
                placeholder="Reason for override"
                style={{ width: '100%' }}
              />
            </div>
            <button onClick={handleOverride} className="btn-primary" disabled={actionLoading || !overrideStatus}>
              {actionLoading ? 'Overriding...' : 'Override'}
            </button>
            <button onClick={() => { setOverrideModal(null); setOverrideStatus(''); setOverrideNote(''); }} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
