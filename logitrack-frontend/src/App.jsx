import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotifProvider } from './context/NotifContext'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// App
import DashboardPage      from './pages/dashboard/DashboardPage'
import ShipmentsPage      from './pages/shipment/ShipmentsPage'
import ShipmentDetailPage from './pages/shipment/ShipmentDetailPage'
import CreateShipmentPage from './pages/shipment/CreateShipmentPage'
import TrackPage          from './pages/shipment/TrackPage'

// Admin
import AdminUsersPage     from './pages/admin/AdminUsersPage'
import AdminShipmentsPage from './pages/admin/AdminShipmentsPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'

// ── Guards ──────────────────────────────────────────────────

function PrivateRoute({ children }) {
  const { user }   = useAuth()
  const { pathname } = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />
  return children
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user)    return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function VendorOrAdminRoute({ children }) {
  const { user, isAdmin, isVendor } = useAuth()
  if (!user)              return <Navigate to="/login" replace />
  if (!isAdmin && !isVendor) return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// ── App ─────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public */}
      <Route path="/track" element={<TrackPage />} />

      {/* Guest only */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Authenticated */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/shipments" element={<PrivateRoute><ShipmentsPage /></PrivateRoute>} />
      <Route path="/shipments/:id" element={<PrivateRoute><ShipmentDetailPage /></PrivateRoute>} />

      {/* Vendor + Admin */}
      <Route path="/shipments/create" element={
        <VendorOrAdminRoute><CreateShipmentPage /></VendorOrAdminRoute>
      } />

      {/* Admin only */}
      <Route path="/admin/users"      element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/shipments"  element={<AdminRoute><AdminShipmentsPage /></AdminRoute>} />
      <Route path="/admin/analytics"  element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotifProvider>
        <AppRoutes />
      </NotifProvider>
    </AuthProvider>
  )
}
