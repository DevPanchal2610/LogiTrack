import { createContext, useContext, useState, useCallback } from 'react'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Shipment LGT-A1B2C3D4E5F6 is now OUT FOR DELIVERY', time: '2 min ago', read: false },
    { id: 2, text: 'New shipment LGT-X9Y8Z7W6V5U4 created by Vendor', time: '18 min ago', read: false },
    { id: 3, text: 'Shipment LGT-P3Q2R1S0T9U8 has been DELIVERED', time: '1 hr ago', read: true },
  ])

  const addNotif = useCallback((text) => {
    setNotifications(prev => [
      { id: Date.now(), text, time: 'Just now', read: false },
      ...prev
    ])
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotifContext.Provider value={{ notifications, addNotif, markAllRead, unreadCount }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotif() {
  return useContext(NotifContext)
}
