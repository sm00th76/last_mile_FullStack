import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin/orders');
      else if (user.role === 'agent') navigate('/agent/orders');
      else navigate('/customer/my-orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2>Login</h2>
        {error && <div className='error-msg'>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label>Email</label>
            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className='form-group'>
            <label>Password</label>
            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type='submit' className='btn-primary'>Login</button>
        </form>
        <p>Don't have an account? <Link to='/register'>Register</Link></p>
      </div>
    </div>
  );
};

export default Login;
