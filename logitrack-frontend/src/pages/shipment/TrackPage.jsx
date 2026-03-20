import { useState } from 'react'
import { shipmentApi } from '../../services/api'
import StatusBadge from '../../components/ui/StatusBadge'
import { Search, Package, MapPin, Truck, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const STEPS = [
  { status: 'CREATED',          label: 'Order Created',     icon: Package },
  { status: 'PICKED_UP',        label: 'Picked Up',         icon: Package },
  { status: 'IN_TRANSIT',       label: 'In Transit',        icon: Truck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',  icon: MapPin },
  { status: 'DELIVERED',        label: 'Delivered',         icon: CheckCircle },
]

const ORDER = ['CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED']

function ProgressBar({ currentStatus }) {
  const idx = ORDER.indexOf(currentStatus)
  const failed = ['FAILED_DELIVERY','RETURNED','CANCELLED'].includes(currentStatus)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, margin:'32px 0 24px' }}>
      {STEPS.map((step, i) => {
        const done    = !failed && idx >= i
        const active  = !failed && idx === i
        const Icon    = step.icon
        return (
          <div key={step.status} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: done ? '#0f4539' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: active ? '3px solid #0e9f6e' : '2px solid transparent',
                transition: 'all .3s',
                boxShadow: active ? '0 0 0 4px rgba(14,159,110,.2)' : 'none',
              }}>
                <Icon size={16} color={done ? '#fff' : '#9ca3af'} />
              </div>
              <span style={{ fontSize:11, fontWeight: active ? 700 : 500, color: done ? '#0f4539' : '#9ca3af', textAlign:'center', whiteSpace:'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 3, margin: '-18px 4px 0',
                background: done && idx > i ? '#0f4539' : '#e5e7eb',
                transition: 'background .3s',
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
    if (!query.trim()) return toast.error('Enter a tracking number')
    setLoading(true); setError(''); setShipment(null)
    try {
      const res = await shipmentApi.track(query.trim().toUpperCase())
      setShipment(res.data.data)
    } catch (err) {
      setError(err.response?.status === 404
        ? `No shipment found for tracking number "${query}"`
        : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const latest = shipment?.statusHistory?.at(-1)

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb' }}>
      {/* Hero */}
      <div className="track-hero">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 }}>
          <Truck size={28} color="#fff" />
          <h1>Track Your Shipment</h1>
        </div>
        <p>Enter your tracking number to get real-time updates</p>

        <div className="track-search">
          <input
            placeholder="e.g. LGT-A1B2C3D4E5F6"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && track()}
          />
          <button className="btn btn-primary" onClick={track} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,.3)' }} /> : <><Search size={14} /> Track</>}
          </button>
        </div>

        <p style={{ color:'rgba(255,255,255,.45)', fontSize:12, marginTop:12 }}>
          Already have an account? <Link to="/login" style={{ color:'rgba(255,255,255,.8)', fontWeight:600 }}>Sign in</Link> for full details.
        </p>
      </div>

      {/* Result */}
      <div className="track-result">
        {error && (
          <div className="card" style={{ padding:32, textAlign:'center' }}>
            <AlertTriangle size={36} color="#dc2626" style={{ margin:'0 auto 12px' }} />
            <p style={{ color:'#dc2626', fontWeight:600 }}>{error}</p>
          </div>
        )}

        {shipment && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Header card */}
            <div className="card">
              <div className="card-body">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600 }}>Tracking Number</div>
                    <div style={{ fontSize:22, fontWeight:800, color:'#0e5484', letterSpacing:1 }}>{shipment.trackingNumber}</div>
                  </div>
                  <StatusBadge status={shipment.currentStatus} />
                </div>

                <ProgressBar currentStatus={shipment.currentStatus} />

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                  {[
                    ['Description', shipment.description],
                    ['From', shipment.originAddress],
                    ['To', shipment.destinationAddress],
                    ['Weight', `${shipment.weightKg} kg`],
                    ['Est. Delivery', shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : '—'],
                    ['Actual Delivery', shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleDateString() : '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background:'#f9fafb', borderRadius:8, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</div>
                      <div style={{ fontSize:13.5, color:'#111827', marginTop:3, fontWeight:500 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header"><span className="card-title">Shipment Journey</span></div>
              <div className="card-body">
                {shipment.statusHistory?.length === 0 ? (
                  <p className="text-muted">No updates recorded yet</p>
                ) : (
                  <div className="timeline">
                    {[...shipment.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-line" />
                        <div className={`timeline-dot ${i === 0 ? 'active' : 'done'}`} style={{ fontSize:10 }}>●</div>
                        <div className="timeline-content">
                          <div className="timeline-status">{h.status.replace(/_/g,' ')}</div>
                          <div className="timeline-meta">
                            📍 {h.location} &nbsp;·&nbsp; 🕐 {new Date(h.changedAt).toLocaleString()}
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
      </div>
    </div>
  )
}
