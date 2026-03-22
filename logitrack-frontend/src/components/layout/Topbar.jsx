import { useState, useRef, useEffect } from 'react'
import { Bell, X, Package, Truck } from 'lucide-react'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'

function timeAgo(id) {
  const diff = Math.floor((Date.now() - id) / 1000)
  if (diff < 60)  return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return `${Math.floor(diff / 3600)} hr ago`
}

function NotifIcon({ type }) {
  if (type === 'SHIPMENT_CREATED') return <Package size={14} color="#0e5484" />
  if (type === 'STATUS_UPDATE')    return <Truck size={14} color="#0f4539" />
  return <Bell size={14} color="#6b7280" />
}

export default function Topbar({ title }) {
  const [open, setOpen]   = useState(false)
  const { notifications, markAllRead, markOneRead, unreadCount } = useNotif()
  const navigate = useNavigate()
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => setOpen(o => !o)

  const handleClickNotif = (notif) => {
    markOneRead(notif.id)
    setOpen(false)
    if (notif.shipmentId) {
      navigate(`/shipments/${notif.shipmentId}`)
    } else if (notif.type === 'SHIPMENT_CREATED' || notif.type === 'STATUS_UPDATE') {
      navigate('/shipments')
    }
  }

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>

      <div className="topbar-right">
        <div style={{ position: 'relative' }} ref={ref}>
          <button className="notif-btn" onClick={handleOpen}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge" />}
          </button>

          {open && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="badge badge-green" style={{ marginLeft: 6, fontSize: 10 }}>
                      {unreadCount} new
                    </span>
                  )}
                </h4>
                <button
                  className="notif-clear"
                  onClick={(e) => { e.stopPropagation(); markAllRead() }}
                >
                  Mark all read
                </button>
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: .3 }} />
                    No notifications yet
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item${!n.read ? ' unread' : ''}`}
                    onClick={() => handleClickNotif(n)}
                    style={{ cursor: n.shipmentId || n.type ? 'pointer' : 'default' }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: !n.read ? '#dbeafe' : '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="notif-item-text">{n.text}</div>
                      <div className="notif-item-time">{timeAgo(n.id)}</div>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#0e9f6e', flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {notifications.length > 0 && (
                <div style={{
                  padding: '10px 16px', borderTop: '1px solid var(--border)',
                  textAlign: 'center',
                }}>
                  <button
                    className="notif-clear"
                    onClick={(e) => { e.stopPropagation(); markAllRead(); setOpen(false) }}
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
