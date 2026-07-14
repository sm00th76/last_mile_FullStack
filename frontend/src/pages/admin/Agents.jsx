import { useState, useEffect } from 'react';
import api from '../../api/axios';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAgents = async () => {
    try {
      const { data } = await api.get('/admin/agents');
      setAgents(data.agents || data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleStatusChange = async (agentId, newStatus) => {
    try {
      await api.patch(`/admin/agents/${agentId}/status`, { status: newStatus });
      fetchAgents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update agent status');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading agents...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Agents</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Zone</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Active Orders</th>
            <th style={{ padding: 8 }}>Change Status</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{agent.userId?.name || '—'}</td>
              <td style={{ padding: 8 }}>{agent.userId?.email || '—'}</td>
              <td style={{ padding: 8 }}>{agent.currentZoneId?.name || '—'}</td>
              <td style={{ padding: 8 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 13,
                  background: agent.status === 'available' ? '#d4edda' :
                    agent.status === 'busy' ? '#fff3cd' : '#e2e3e5',
                  color: agent.status === 'available' ? '#155724' :
                    agent.status === 'busy' ? '#856404' : '#383d41',
                }}>
                  {agent.status}
                </span>
              </td>
              <td style={{ padding: 8 }}>{agent.activeOrderCount ?? '—'}</td>
              <td style={{ padding: 8 }}>
                <select
                  value={agent.status}
                  onChange={(e) => handleStatusChange(agent._id, e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </td>
            </tr>
          ))}
          {agents.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 8, textAlign: 'center' }}>No agents found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Agents;
