import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate('/customer/my-orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h2>Register</h2>
        {error && <div className='error-msg'>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label>Name</label>
            <input name='name' value={form.name} onChange={handleChange} required />
          </div>
          <div className='form-group'>
            <label>Email</label>
            <input name='email' type='email' value={form.email} onChange={handleChange} required />
          </div>
          <div className='form-group'>
            <label>Password</label>
            <input name='password' type='password' value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className='form-group'>
            <label>Phone</label>
            <input name='phone' value={form.phone} onChange={handleChange} />
          </div>
          <button type='submit' className='btn-primary'>Register</button>
        </form>
        <p>Already have an account? <Link to='/login'>Login</Link></p>
      </div>
    </div>
  );
};

export default Register;
