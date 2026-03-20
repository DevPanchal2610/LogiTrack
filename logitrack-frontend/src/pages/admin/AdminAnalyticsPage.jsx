import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminApi } from '../../services/api'
import { Package, TrendingUp, CheckCircle, AlertTriangle, Users, Truck, BarChart3 } from 'lucide-react'

function DonutChart({ segments, size = 140 }) {
  const r = 50, cx = 70, cy = 70
  const circumference = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="22" />
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference
        const gap  = circumference - dash
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="22"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray .5s ease' }}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

function BarChart({ data, max, color }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, color:'#6b7280', fontWeight:600 }}>{item.value}</span>
          <div style={{
            width:'100%', borderRadius:'4px 4px 0 0',
            background: color,
            height: max > 0 ? `${(item.value / max) * 80}px` : '4px',
            minHeight: 4,
            transition: 'height .4s ease',
            opacity: 0.75 + (i / data.length) * 0.25,
          }} />
          <span style={{ fontSize:10, color:'#9ca3af', textAlign:'center', whiteSpace:'nowrap' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [shipments, setShipments] = useState([])
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getAllShipments(), adminApi.getAllUsers()])
      .then(([s, u]) => {
        setShipments(s.data.data || [])
        setUsers(u.data.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Status breakdown
  const STATUS_COLORS = {
    CREATED: '#6b7280', PICKED_UP: '#3b82f6', IN_TRANSIT: '#f59e0b',
    OUT_FOR_DELIVERY: '#8b5cf6', DELIVERED: '#10b981',
    FAILED_DELIVERY: '#ef4444', RETURNED: '#f97316', CANCELLED: '#dc2626',
  }
  const statusCounts = Object.entries(
    shipments.reduce((acc, s) => {
      acc[s.currentStatus] = (acc[s.currentStatus] || 0) + 1; return acc
    }, {})
  ).sort((a,b) => b[1] - a[1])

  const total     = shipments.length
  const delivered = shipments.filter(s => s.currentStatus === 'DELIVERED').length
  const issues    = shipments.filter(s => ['FAILED_DELIVERY','RETURNED','CANCELLED'].includes(s.currentStatus)).length
  const inTransit = shipments.filter(s => ['IN_TRANSIT','OUT_FOR_DELIVERY','PICKED_UP'].includes(s.currentStatus)).length
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0

  // Monthly shipments (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleString('default', { month: 'short' })
    const value = shipments.filter(s => {
      const sd = new Date(s.createdAt)
      return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()
    }).length
    return { label, value }
  })
  const maxMonthly = Math.max(...monthlyData.map(m => m.value), 1)

  // Vendor performance
  const vendorMap = shipments.reduce((acc, s) => {
    if (!acc[s.vendorName]) acc[s.vendorName] = { total:0, delivered:0 }
    acc[s.vendorName].total++
    if (s.currentStatus === 'DELIVERED') acc[s.vendorName].delivered++
    return acc
  }, {})
  const vendorData = Object.entries(vendorMap)
    .map(([name, d]) => ({ name, ...d, rate: d.total > 0 ? Math.round((d.delivered/d.total)*100) : 0 }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 5)

  // Donut segments
  const donutSegs = statusCounts.slice(0,5).map(([status, count]) => ({
    pct:   total > 0 ? (count / total) * 100 : 0,
    color: STATUS_COLORS[status] || '#6b7280',
    label: status,
    count,
  }))

  const kpis = [
    { label:'Total Shipments',  value: total,          icon: Package,       color:'#1e40af', bg:'#dbeafe' },
    { label:'Delivery Rate',    value: `${deliveryRate}%`, icon: TrendingUp, color:'#065f46', bg:'#d1fae5' },
    { label:'In Transit',       value: inTransit,      icon: Truck,         color:'#92400e', bg:'#fef3c7' },
    { label:'Issues / Failed',  value: issues,         icon: AlertTriangle, color:'#991b1b', bg:'#fee2e2' },
    { label:'Total Users',      value: users.length,   icon: Users,         color:'#5b21b6', bg:'#ede9fe' },
    { label:'Active Vendors',   value: users.filter(u => u.role === 'VENDOR').length, icon: BarChart3, color:'#0f4539', bg:'#d1fae5' },
  ]

  if (loading) return (
    <AppLayout title="Analytics">
      <div className="loading-center"><span className="spinner spinner-lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout title="Analytics">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Analytics Overview</h2>
          <p>System-wide shipment performance and trends</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} className="stat-card">
            <div className="stat-icon" style={{ background: k.bg }}>
              <k.icon size={20} color={k.color} />
            </div>
            <div>
              <div className="stat-value">{k.value}</div>
              <div className="stat-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap:20 }}>
        {/* Monthly Shipments Bar Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Shipments (Last 6 Months)</span>
          </div>
          <div className="card-body">
            <BarChart data={monthlyData} max={maxMonthly} color="#0f4539" />
          </div>
        </div>

        {/* Status Donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Shipment Status Breakdown</span>
          </div>
          <div className="card-body">
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <DonutChart segments={donutSegs} />
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  flexDirection:'column', alignItems:'center', justifyContent:'center',
                }}>
                  <span style={{ fontSize:22, fontWeight:800, color:'#111827' }}>{total}</span>
                  <span style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>total</span>
                </div>
              </div>
              <div style={{ flex:1 }}>
                {donutSegs.map(seg => (
                  <div key={seg.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background: seg.color, flexShrink:0 }} />
                      <span style={{ fontSize:12.5, color:'#374151' }}>{seg.label.replace(/_/g,' ')}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{
                        width: 60, height:6, borderRadius:3, background:'#f3f4f6', overflow:'hidden'
                      }}>
                        <div style={{ width:`${seg.pct}%`, height:'100%', background:seg.color, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:'#111827', minWidth:20, textAlign:'right' }}>{seg.count}</span>
                    </div>
                  </div>
                ))}
                {donutSegs.length === 0 && (
                  <p style={{ color:'#9ca3af', fontSize:13 }}>No data yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="card" style={{ gridColumn:'1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Top Vendor Performance</span>
            <span className="text-muted text-small">By total shipments</span>
          </div>
          {vendorData.length === 0 ? (
            <div className="empty-state" style={{ padding:32 }}>
              <p>No vendor data yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Total Shipments</th>
                    <th>Delivered</th>
                    <th>Delivery Rate</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorData.map((v, i) => (
                    <tr key={v.name}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:28, height:28, borderRadius:'50%', background:'#dbeafe',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:11, fontWeight:700, color:'#1e40af', flexShrink:0,
                          }}>{i + 1}</div>
                          <span style={{ fontWeight:500 }}>{v.name}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight:600 }}>{v.total}</td>
                      <td>{v.delivered}</td>
                      <td>
                        <span style={{
                          fontWeight:700,
                          color: v.rate >= 80 ? '#065f46' : v.rate >= 50 ? '#92400e' : '#991b1b'
                        }}>{v.rate}%</span>
                      </td>
                      <td style={{ width:180 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:8, borderRadius:4, background:'#f3f4f6', overflow:'hidden' }}>
                            <div style={{
                              width:`${v.rate}%`, height:'100%', borderRadius:4,
                              background: v.rate >= 80 ? '#10b981' : v.rate >= 50 ? '#f59e0b' : '#ef4444',
                              transition:'width .4s ease',
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
