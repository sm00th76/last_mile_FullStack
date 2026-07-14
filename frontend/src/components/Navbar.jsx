import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className='navbar'>
      <div className='nav-brand'>
        <Link to='/'>📦 Delivery Tracker</Link>
      </div>
      <div className='nav-links'>
        {user.role === 'customer' && (
          <>
            <Link to='/customer/place-order'>Place Order</Link>
            <Link to='/customer/my-orders'>My Orders</Link>
          </>
        )}
        {user.role === 'agent' && (
          <>
            <Link to='/agent/orders'>My Assignments</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to='/admin/orders'>Orders</Link>
            <Link to='/admin/zones'>Zones</Link>
            <Link to='/admin/areas'>Areas</Link>
            <Link to='/admin/rate-cards'>Rate Cards</Link>
            <Link to='/admin/agents'>Agents</Link>
            <Link to='/admin/override'>Override</Link>
          </>
        )}
        <span className='nav-user'>👤 {user.name} ({user.role})</span>
        <button onClick={handleLogout} className='btn-logout'>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
