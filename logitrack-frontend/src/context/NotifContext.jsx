import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { createNotificationStream } from '../services/api'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const eventSourceRef   = useRef(null)
  const syncListenersRef = useRef([])

  const onDataChange = useCallback((listener) => {
    syncListenersRef.current.push(listener)
    return () => {
      syncListenersRef.current = syncListenersRef.current.filter(l => l !== listener)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const es = createNotificationStream(
      (data) => {
        setNotifications(prev => [{
          id:             Date.now(),
          text:           data.message,
          type:           data.type,
          time:           'Just now',
          read:           false,
          shipmentId:     data.shipmentId     || null,
          trackingNumber: data.trackingNumber || null,
        }, ...prev].slice(0, 50))
        syncListenersRef.current.forEach(fn => fn(data))
      },
      (err) => console.warn('SSE error, will auto-retry...', err)
    )
    eventSourceRef.current = es
    return () => {
      if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null }
    }
  }, [user])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const markOneRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const addNotif = useCallback((text, extra = {}) => {
    setNotifications(prev => [{ id: Date.now(), text, time: 'Just now', read: false, ...extra }, ...prev])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotifContext.Provider value={{ notifications, addNotif, markAllRead, markOneRead, unreadCount, onDataChange }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotif() { return useContext(NotifContext) }
