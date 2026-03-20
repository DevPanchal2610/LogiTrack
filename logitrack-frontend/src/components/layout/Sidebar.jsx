import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, PlusSquare, Search, Users, BarChart3, LogOut, Settings, Truck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { user, logout, isAdmin, isVendor } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const go = (path) => navigate(path)
  const active = (path) => pathname === path ? 'nav-item active' : 'nav-item'

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Logi<span>Track</span></h1>
        <p>Supply Chain Management</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        <button className={active('/dashboard')} onClick={() => go('/dashboard')}>
          <LayoutDashboard size={16} /> Dashboard
        </button>

        <button className={active('/shipments')} onClick={() => go('/shipments')}>
          <Package size={16} /> My Shipments
        </button>

        <button className={active('/track')} onClick={() => go('/track')}>
          <Search size={16} /> Track Shipment
        </button>

        {(isAdmin || isVendor) && (
          <button className={active('/shipments/create')} onClick={() => go('/shipments/create')}>
            <PlusSquare size={16} /> Create Shipment
          </button>
        )}

        {isAdmin && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
            <button className={active('/admin/users')} onClick={() => go('/admin/users')}>
              <Users size={16} /> Manage Users
            </button>
            <button className={active('/admin/shipments')} onClick={() => go('/admin/shipments')}>
              <Truck size={16} /> All Shipments
            </button>
            <button className={active('/admin/analytics')} onClick={() => go('/admin/analytics')}>
              <BarChart3 size={16} /> Analytics
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{user?.fullName}</div>
            <div className="user-chip-role">{user?.role?.toLowerCase()}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  )
}
