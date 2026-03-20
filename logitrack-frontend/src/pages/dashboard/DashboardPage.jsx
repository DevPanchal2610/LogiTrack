import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Truck, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus, Search } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { shipmentApi, adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const STATUSES = ['CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','RETURNED','CANCELLED']

export default function DashboardPage() {
  const { user, isAdmin, isVendor } = useAuth()
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = isAdmin
          ? await adminApi.getAllShipments()
          : await shipmentApi.getMine()
        setShipments(res.data.data || [])
      } catch { /* handled by interceptor */ }
      finally { setLoading(false) }
    }
    fetch()
  }, [isAdmin])

  const count = status => shipments.filter(s => s.currentStatus === status).length
  const total     = shipments.length
  const delivered = count('DELIVERED')
  const inTransit = count('IN_TRANSIT') + count('OUT_FOR_DELIVERY') + count('PICKED_UP')
  const issues    = count('FAILED_DELIVERY') + count('RETURNED') + count('CANCELLED')
  const pending   = count('CREATED')

  const recent = [...shipments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  const stats = [
    { label: 'Total Shipments',  value: total,     icon: Package,     color: '#0e5484', bg: '#dbeafe' },
    { label: 'In Transit',       value: inTransit, icon: Truck,       color: '#d97706', bg: '#fef3c7' },
    { label: 'Delivered',        value: delivered, icon: CheckCircle, color: '#065f46', bg: '#d1fae5' },
    { label: 'Pending / Issues', value: pending + issues, icon: AlertTriangle, color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h2>
          <p>{isAdmin ? 'System overview — all shipments across all vendors' : isVendor ? 'Overview of shipments you manage' : 'Track and monitor your deliveries'}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/track')}>
            <Search size={14} /> Track
          </button>
          {(isAdmin || isVendor) && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/shipments/create')}>
              <Plus size={14} /> New Shipment
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div className="stat-value">{loading ? '–' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Shipments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Shipments</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/shipments')}>View all</button>
        </div>
        {loading ? (
          <div className="loading-center"><span className="spinner spinner-lg" /></div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <h3>No shipments yet</h3>
            <p>{isAdmin || isVendor ? 'Create your first shipment to get started' : 'No shipments assigned to you yet'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Description</th>
                  {isAdmin && <th>Vendor</th>}
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s.id}>
                    <td><code style={{ fontSize:12, color:'#0e5484', fontWeight:600 }}>{s.trackingNumber}</code></td>
                    <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.description}</td>
                    {isAdmin && <td>{s.vendorName}</td>}
                    <td>{s.customerName}</td>
                    <td><StatusBadge status={s.currentStatus} /></td>
                    <td className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/shipments/${s.id}`)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
