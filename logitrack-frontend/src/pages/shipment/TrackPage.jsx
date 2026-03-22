import { useState } from 'react'
import { shipmentApi } from '../../services/api'
import StatusBadge from '../../components/ui/StatusBadge'
import AppLayout from '../../components/layout/AppLayout'
import { Search, Package, MapPin, Truck, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

const STEPS = [
  { status: 'CREATED',          label: 'Order Created',    icon: Package },
  { status: 'PICKED_UP',        label: 'Picked Up',        icon: Package },
  { status: 'IN_TRANSIT',       label: 'In Transit',       icon: Truck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
  { status: 'DELIVERED',        label: 'Delivered',        icon: CheckCircle },
]
const ORDER = ['CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED']

function ProgressBar({ currentStatus }) {
  const idx    = ORDER.indexOf(currentStatus)
  const failed = ['FAILED_DELIVERY','RETURNED','CANCELLED'].includes(currentStatus)

  return (
    <div style={{ display:'flex', alignItems:'center', margin:'28px 0 24px' }}>
      {STEPS.map((step, i) => {
        const done   = !failed && idx >= i
        const active = !failed && idx === i
        const Icon   = step.icon
        return (
          <div key={step.status} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{
                width:42, height:42, borderRadius:'50%',
                background: done ? 'var(--primary)' : 'var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center',
                border: active ? '3px solid var(--accent)' : '2px solid transparent',
                boxShadow: active ? '0 0 0 4px rgba(14,159,110,.15)' : 'none',
                transition:'all .3s',
              }}>
                <Icon size={16} color={done ? '#fff' : '#9ca3af'} />
              </div>
              <span style={{
                fontSize:11, fontWeight: active ? 700 : 500,
                color: done ? 'var(--primary)' : 'var(--text-muted)',
                textAlign:'center', whiteSpace:'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex:1, height:3, margin:'-16px 6px 0',
                background: (!failed && idx > i) ? 'var(--primary)' : 'var(--border)',
                transition:'background .3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function TrackPage() {
  const [query, setQuery]     = useState('')
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const track = async () => {
    if (!query.trim()) return setError('Please enter a tracking number.')
    setLoading(true); setError(''); setShipment(null)
    try {
      const res = await shipmentApi.track(query.trim().toUpperCase())
      setShipment(res.data.data)
    } catch (err) {
      setError(err.response?.status === 404
        ? `No shipment found for "${query.trim().toUpperCase()}". Please check the tracking number.`
        : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <AppLayout title="Track Shipment">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Track Shipment</h2>
          <p>Enter a tracking number to get real-time status updates</p>
        </div>
      </div>

      {/* Search bar card */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-body">
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ position:'relative', flex:1 }}>
              <Search size={15} style={{
                position:'absolute', left:12, top:'50%',
                transform:'translateY(-50%)', color:'var(--text-muted)',
              }} />
              <input
                className="form-input"
                style={{ paddingLeft:36, fontSize:14 }}
                placeholder="e.g. LGT-A1B2C3D4E5F6"
                value={query}
                onChange={e => { setQuery(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && track()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={track} disabled={loading}
              style={{ padding:'10px 24px', flexShrink:0 }}>
              {loading
                ? <span className="spinner" />
                : <><Search size={14} /> Track</>}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop:12, background:'var(--danger-light)',
              border:'1px solid #fca5a5', borderRadius:8,
              padding:'10px 14px', color:'var(--danger)',
              fontSize:13.5, display:'flex', alignItems:'center', gap:8,
            }}>
              <AlertTriangle size={15} style={{ flexShrink:0 }} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {shipment && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Status header card */}
          <div className="card">
            <div className="card-body">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:4 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:4 }}>
                    Tracking Number
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color:'var(--blue)', letterSpacing:1 }}>
                    {shipment.trackingNumber}
                  </div>
                </div>
                <StatusBadge status={shipment.currentStatus} />
              </div>

              <ProgressBar currentStatus={shipment.currentStatus} />

              {/* Info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
                {[
                  ['Description',    shipment.description],
                  ['From',           shipment.originAddress],
                  ['To',             shipment.destinationAddress],
                  ['Weight',         `${shipment.weightKg} kg`],
                  ['Est. Delivery',  shipment.estimatedDelivery
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                    : '—'],
                  ['Actual Delivery', shipment.actualDelivery
                    ? new Date(shipment.actualDelivery).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                    : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    background:'var(--bg)', borderRadius:8, padding:'12px 14px',
                    border:'1px solid var(--border)',
                  }}>
                    <div style={{ fontSize:10.5, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize:13.5, color:'var(--text-primary)', fontWeight:500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Journey timeline card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Clock size={15} color="var(--primary)" /> Shipment Journey
              </span>
              <span className="text-muted text-small">{shipment.statusHistory?.length || 0} events</span>
            </div>
            <div className="card-body">
              {!shipment.statusHistory?.length ? (
                <p className="text-muted">No updates recorded yet.</p>
              ) : (
                <div className="timeline">
                  {[...shipment.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-line" />
                      <div className={`timeline-dot ${i === 0 ? 'active' : 'done'}`} style={{ fontSize:10 }}>●</div>
                      <div className="timeline-content">
                        <div className="timeline-status">{h.status.replace(/_/g,' ')}</div>
                        <div className="timeline-meta">
                          📍 {h.location}&nbsp;·&nbsp;🕐 {new Date(h.changedAt).toLocaleString('en-IN')}
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
      )}

      {/* Empty state before search */}
      {!shipment && !error && !loading && (
        <div className="empty-state" style={{ marginTop:40 }}>
          <Truck size={48} />
          <h3>Enter a tracking number above</h3>
          <p>You'll see full shipment details and live status history here</p>
        </div>
      )}
    </AppLayout>
  )
}
