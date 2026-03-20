import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { adminApi, shipmentApi } from '../../services/api'
import { Package, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['ALL','CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','RETURNED','CANCELLED']

export default function AdminShipmentsPage() {
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [deleting, setDeleting]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAllShipments()
      setShipments(res.data.data || [])
    } catch { toast.error('Failed to load shipments') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = shipments
    if (statusFilter !== 'ALL') data = data.filter(s => s.currentStatus === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(s =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.vendorName?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
  }, [shipments, search, statusFilter])

  const deleteShipment = async (id, trackingNumber) => {
    if (!window.confirm(`Delete shipment ${trackingNumber}?`)) return
    setDeleting(id)
    try {
      await shipmentApi.delete(id)
      setShipments(prev => prev.filter(s => s.id !== id))
      toast.success('Shipment deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this shipment')
    } finally { setDeleting(null) }
  }

  return (
    <AppLayout title="All Shipments">
      <div className="page-header">
        <div className="page-header-left">
          <h2>All Shipments</h2>
          <p>{shipments.length} total shipment{shipments.length !== 1 ? 's' : ''} across all vendors</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div className="search-bar">
          <Search size={14} />
          <input placeholder="Search tracking #, vendor, customer..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {STATUSES.map(s => (
            <button key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding:'5px 10px' }}
              onClick={() => setStatusFilter(s)}>
              {s === 'ALL' ? 'All' : s.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><span className="spinner spinner-lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <h3>No shipments found</h3>
            <p>{search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'No shipments in the system yet'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>Vendor</th>
                  <th>Customer</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Est. Delivery</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontSize:12, color:'#0e5484', fontWeight:600, cursor:'pointer' }}
                        onClick={() => navigate(`/shipments/${s.id}`)}>
                        {s.trackingNumber}
                      </code>
                    </td>
                    <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {s.description}
                    </td>
                    <td>{s.vendorName}</td>
                    <td>
                      <div>{s.customerName}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{s.customerEmail}</div>
                    </td>
                    <td className="text-muted">{s.weightKg} kg</td>
                    <td><StatusBadge status={s.currentStatus} /></td>
                    <td className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="text-muted">
                      {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/shipments/${s.id}`)}>View</button>
                        {['CREATED','CANCELLED'].includes(s.currentStatus) && (
                          <button className="btn btn-ghost btn-sm"
                            style={{ color:'#dc2626', borderColor:'#fca5a5' }}
                            onClick={() => deleteShipment(s.id, s.trackingNumber)}
                            disabled={deleting === s.id}>
                            {deleting === s.id
                              ? <span className="spinner" style={{ width:13, height:13, borderTopColor:'#dc2626' }} />
                              : <Trash2 size={13} />}
                          </button>
                        )}
                      </div>
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
