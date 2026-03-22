import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { shipmentApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Package, Search, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import useDataSync from '../../hooks/useDataSync'

export default function ShipmentsPage() {
  const { isAdmin, isVendor } = useAuth()
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await shipmentApi.getMine()
      setShipments(res.data.data || [])
    } catch { toast.error('Failed to load shipments') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useDataSync(load)

  useEffect(() => {
    let data = shipments
    if (statusFilter !== 'ALL') data = data.filter(s => s.currentStatus === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(s =>
        s.trackingNumber.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
  }, [shipments, search, statusFilter])

  const STATUSES = ['ALL','CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','CANCELLED']

  return (
    <AppLayout title="My Shipments">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Shipments</h2>
          <p>{shipments.length} total shipment{shipments.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {(isAdmin || isVendor) && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/shipments/create')}>
              <Plus size={14} /> New Shipment
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, flexWrap:'wrap' }}>
        <div className="search-bar">
          <Search size={14} />
          <input placeholder="Search tracking #, description..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {STATUSES.map(s => (
            <button key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding:'5px 11px' }}
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
            <p>{search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'No shipments yet'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Description</th>
                  <th>From → To</th>
                  <th>Customer</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><code style={{ fontSize:12, color:'#0e5484', fontWeight:600 }}>{s.trackingNumber}</code></td>
                    <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.description}</td>
                    <td style={{ fontSize:12 }}>
                      <span style={{ color:'#6b7280' }}>{s.originAddress.split(',')[0]}</span>
                      <span style={{ margin:'0 4px' }}>→</span>
                      <span>{s.destinationAddress.split(',')[0]}</span>
                    </td>
                    <td>{s.customerName}</td>
                    <td className="text-muted">{s.weightKg} kg</td>
                    <td><StatusBadge status={s.currentStatus} /></td>
                    <td className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/shipments/${s.id}`)}>View</button>
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
