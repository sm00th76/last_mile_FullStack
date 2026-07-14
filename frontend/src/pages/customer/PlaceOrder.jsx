import { useState } from 'react';
import api from '../../api/axios';

const PlaceOrder = () => {
  const [form, setForm] = useState({
    orderType: 'B2C',
    paymentType: 'Prepaid',
    pickupLine: '',
    pickupPincode: '',
    dropLine: '',
    dropPincode: '',
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
  });
  const [quote, setQuote] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Reset quote when form changes
    setQuote(null);
    setOrderResult(null);
  };

  const buildPayload = () => ({
    orderType: form.orderType,
    paymentType: form.paymentType,
    pickupAddress: { line: form.pickupLine, pincode: form.pickupPincode },
    dropAddress: { line: form.dropLine, pincode: form.dropPincode },
    packageDimensions: {
      length: Number(form.length),
      breadth: Number(form.breadth),
      height: Number(form.height),
    },
    actualWeight: Number(form.actualWeight),
  });

  const handleGetQuote = async (e) => {
    e.preventDefault();
    setError('');
    setQuote(null);
    setLoading(true);
    try {
      const { data } = await api.post('/orders/quote', buildPayload());
      setQuote(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/orders', buildPayload());
      setOrderResult(data);
      setQuote(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (orderResult) {
    return (
      <div style={{ padding: '24px', maxWidth: 600 }}>
        <h2>Order Placed Successfully!</h2>
        <p><strong>Order Number:</strong> {orderResult.order?.orderNumber || orderResult.orderNumber}</p>
        <p><strong>Status:</strong> {orderResult.order?.status || orderResult.status}</p>
        <button onClick={() => { setOrderResult(null); setForm({ orderType: 'B2C', paymentType: 'Prepaid', pickupLine: '', pickupPincode: '', dropLine: '', dropPincode: '', length: '', breadth: '', height: '', actualWeight: '' }); }}>
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 600 }}>
      <h2>Place Order</h2>
      {error && <div style={{ color: 'red', marginBottom: 12, padding: 8, background: '#fee' }}>{error}</div>}

      <form onSubmit={handleGetQuote}>
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Order Details</legend>
          <div className="form-group">
            <label>Order Type</label>
            <select name="orderType" value={form.orderType} onChange={handleChange}>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Type</label>
            <select name="paymentType" value={form.paymentType} onChange={handleChange}>
              <option value="Prepaid">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Pickup Address</legend>
          <div className="form-group">
            <label>Address Line</label>
            <input type="text" name="pickupLine" value={form.pickupLine} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input type="text" name="pickupPincode" value={form.pickupPincode} onChange={handleChange} required />
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Drop Address</legend>
          <div className="form-group">
            <label>Address Line</label>
            <input type="text" name="dropLine" value={form.dropLine} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input type="text" name="dropPincode" value={form.dropPincode} onChange={handleChange} required />
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Package Dimensions (cm)</legend>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Length</label>
              <input type="number" name="length" value={form.length} onChange={handleChange} min="0" step="any" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Breadth</label>
              <input type="number" name="breadth" value={form.breadth} onChange={handleChange} min="0" step="any" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Height</label>
              <input type="number" name="height" value={form.height} onChange={handleChange} min="0" step="any" required />
            </div>
          </div>
        </fieldset>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Actual Weight (kg)</label>
          <input type="number" name="actualWeight" value={form.actualWeight} onChange={handleChange} min="0" step="any" required />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Getting Quote...' : 'Get Quote'}
        </button>
      </form>

      {quote && (
        <div style={{ marginTop: 20, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
          <h3>Quote Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {quote.breakdown && Object.entries(quote.breakdown).map(([key, val]) => (
                <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{val}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', borderTop: '2px solid #333' }}>
                <td style={{ padding: '6px 8px' }}>Total</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{quote.totalCharge ?? quote.total}</td>
              </tr>
            </tbody>
          </table>
          <button onClick={handlePlaceOrder} className="btn-primary" style={{ marginTop: 12 }} disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
