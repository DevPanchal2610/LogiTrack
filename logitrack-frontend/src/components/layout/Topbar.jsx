import { useState, useRef, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotif } from '../../context/NotifContext'

export default function Topbar({ title }) {
  const [open, setOpen] = useState(false)
  const { notifications, markAllRead, unreadCount } = useNotif()
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => { setOpen(o => !o); if (!open) markAllRead() }

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
                <h4>Notifications {unreadCount > 0 && <span className="badge badge-green" style={{ marginLeft: 6 }}>{unreadCount} new</span>}</h4>
                <button className="notif-clear" onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                    {!n.read && <span className="notif-dot" />}
                    <div style={{ paddingLeft: n.read ? 18 : 0 }}>
                      <div className="notif-item-text">{n.text}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
