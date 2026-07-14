import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className='auth-page'>
    <div className='auth-card'>
      <h2>🚫 Unauthorized</h2>
      <p>You don't have permission to access this page.</p>
      <Link to='/' className='btn-primary'>Go Home</Link>
    </div>
  </div>
);

export default Unauthorized;
