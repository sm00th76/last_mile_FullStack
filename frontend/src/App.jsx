import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Customer Pages
import PlaceOrder from './pages/customer/PlaceOrder';
import MyOrders from './pages/customer/MyOrders';
import TrackOrder from './pages/customer/TrackOrder';
import Reschedule from './pages/customer/Reschedule';

// Agent Pages
import AssignedOrders from './pages/agent/AssignedOrders';
import UpdateStatus from './pages/agent/UpdateStatus';

// Admin Pages
import Zones from './pages/admin/Zones';
import Areas from './pages/admin/Areas';
import RateCards from './pages/admin/RateCards';
import Agents from './pages/admin/Agents';
import AllOrders from './pages/admin/AllOrders';
import Override from './pages/admin/Override';

// Root Route Helper
const HomeRedirect = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return <Navigate to="/login" replace />;
  const user = JSON.parse(storedUser);
  if (user.role === 'admin') return <Navigate to="/admin/orders" replace />;
  if (user.role === 'agent') return <Navigate to="/agent/orders" replace />;
  return <Navigate to="/customer/my-orders" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<Layout />}>
            {/* Root Route Redirect */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Customer Routes */}
            <Route
              path="/customer/place-order"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <PlaceOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/my-orders"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/track/:id"
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin', 'agent']}>
                  <TrackOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/reschedule/:id"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Reschedule />
                </ProtectedRoute>
              }
            />

            {/* Agent Routes */}
            <Route
              path="/agent/orders"
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AssignedOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/update-status/:id"
              element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <UpdateStatus />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AllOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/zones"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Zones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/areas"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Areas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rate-cards"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RateCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agents"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Agents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/override"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Override />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
