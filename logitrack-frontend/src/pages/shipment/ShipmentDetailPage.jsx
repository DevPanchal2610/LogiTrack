import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { shipmentApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, MapPin, Package, Calendar, User, CheckCircle, Edit3, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNotif } from '../../context/NotifContext'

const STATUSES = ['CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY','RETURNED','CANCELLED']

function TimelineDot({ status }) {
  const active = ['IN_TRANSIT','OUT_FOR_DELIVERY','PICKED_UP'].includes(status)
  const failed = ['FAILED_DELIVERY','RETURNED','CANCELLED'].includes(status)
  const done   = status === 'DELIVERED'
  const cls = done ? 'done' : active ? 'active' : failed ? 'failed' : 'done'
  return <div className={`timeline-dot ${cls}`}>{done ? <CheckCircle size={14} /> : '●'}</div>
}

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isVendor } = useAuth()
  const { addNotif } = useNotif()

  const [shipment, setShipment] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [updating, setUpdating] = useState(false)
  const [statusForm, setStatusForm] = useState({ newStatus:'', location:'', remarks:'' })

  const load = async () => {
    try {
      const res = await shipmentApi.getById(id)
      setShipment(res.data.data)
    } catch { toast.error('Shipment not found') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const submitStatus = async e => {
    e.preventDefault()
    if (!statusForm.newStatus || !statusForm.location) return toast.error('Status and location are required')
    setUpdating(true)
    try {
      const res = await shipmentApi.updateStatus(id, statusForm)
      setShipment(res.data.data)
      addNotif(`Shipment ${shipment.trackingNumber} updated to ${statusForm.newStatus.replace(/_/g,' ')}`)
      toast.success('Status updated successfully')
      setModal(false)
      setStatusForm({ newStatus:'', location:'', remarks:'' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally { setUpdating(false) }
  }

  if (loading) return <AppLayout title="Shipment Detail"><div className="loading-center"><span className="spinner spinner-lg" /></div></AppLayout>
  if (!shipment) return <AppLayout title="Not Found"><div className="empty-state"><h3>Shipment not found</h3></div></AppLayout>

  const canUpdate = isAdmin || isVendor
  const isDone = ['DELIVERED','CANCELLED'].includes(shipment.currentStatus)

  return (
    <AppLayout title="Shipment Detail">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:8 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
          <h2 style={{ display:'flex', alignItems:'center', gap:10 }}>
            <code style={{ fontSize:20, color:'#0e5484' }}>{shipment.trackingNumber}</code>
            <StatusBadge status={shipment.currentStatus} />
          </h2>
          <p>Created {new Date(shipment.createdAt).toLocaleString()}</p>
        </div>
        {canUpdate && !isDone && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Edit3 size={14} /> Update Status
          </button>
        )}
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Left — details */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Shipment Info</span></div>
            <div className="card-body">
              {[
                ['Description',   shipment.description,                         Package],
                ['Origin',        shipment.originAddress,                        MapPin],
                ['Destination',   shipment.destinationAddress,                   MapPin],
                ['Weight',        `${shipment.weightKg} kg`,                     Package],
                ['Vendor',        shipment.vendorName,                           User],
                ['Customer',      `${shipment.customerName} (${shipment.customerEmail})`, User],
                ['Est. Delivery', shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : '—', Calendar],
                ['Actual Delivery', shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleString() : '—', Calendar],
              ].map(([label, value, Icon]) => (
                <div key={label} style={{ display:'flex', gap:10, marginBottom:14, alignItems:'flex-start' }}>
                  <div style={{ width:32, height:32, background:'#f3f4f6', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={14} color="#6b7280" />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</div>
                    <div style={{ fontSize:13.5, color:'#111827', marginTop:1 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Status History</span>
            <span className="text-muted text-small">{shipment.statusHistory?.length || 0} events</span>
          </div>
          <div className="card-body">
            {shipment.statusHistory?.length === 0 ? (
              <div className="empty-state" style={{ padding:'24px' }}>
                <p>No history recorded yet</p>
              </div>
            ) : (
              <div className="timeline">
                {shipment.statusHistory?.map((h, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-line" />
                    <TimelineDot status={h.status} />
                    <div className="timeline-content">
                      <div className="timeline-status">{h.status.replace(/_/g,' ')}</div>
                      <div className="timeline-meta">
                        📍 {h.location} &nbsp;·&nbsp; 👤 {h.updatedBy}<br />
                        🕐 {new Date(h.changedAt).toLocaleString()}
                        {h.remarks && <><br />💬 {h.remarks}</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Update Shipment Status</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={submitStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">New Status <span style={{ color:'red' }}>*</span></label>
                  <select className="form-select" value={statusForm.newStatus}
                    onChange={e => setStatusForm(f => ({ ...f, newStatus: e.target.value }))}>
                    <option value="">— Select status —</option>
                    {STATUSES.filter(s => s !== shipment.currentStatus).map(s => (
                      <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Current Location <span style={{ color:'red' }}>*</span></label>
                  <input className="form-input" placeholder="e.g. Surat Hub, Gujarat"
                    value={statusForm.location}
                    onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks (optional)</label>
                  <textarea className="form-textarea" placeholder="Any notes about this status update..."
                    value={statusForm.remarks}
                    onChange={e => setStatusForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? <><span className="spinner" /> Updating...</> : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
