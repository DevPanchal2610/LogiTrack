import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('lt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    // AFTER — only redirect if user was already logged in
    if (err.response?.status === 401 && localStorage.getItem('lt_token')) {
      localStorage.removeItem('lt_token')
      localStorage.removeItem('lt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──
export const authApi = {
  login:    data => api.post('/auth/login', data),
  register: data => api.post('/auth/register', data),
}

// ── Shipments ──
export const shipmentApi = {
  create:       data         => api.post('/shipments/create', data),
  updateStatus: (id, data)   => api.put(`/shipments/${id}/status`, data),
  track:        trackingNum  => api.get(`/shipments/track/${trackingNum}`),
  getById:      id           => api.get(`/shipments/${id}`),
  getMine:      ()           => api.get('/shipments/my'),
  delete:       id           => api.delete(`/shipments/${id}`),
}

// ── Admin ──
export const adminApi = {
  getAllShipments: () => api.get('/admin/shipments'),
  getAllUsers:     () => api.get('/admin/users'),
  getVendors:     () => api.get('/admin/users/vendors'),
  getCustomers:   () => api.get('/admin/users/customers'),
  deleteUser:     id => api.delete(`/admin/users/${id}`),
}

export function createNotificationStream(onMessage, onError) {
  const token = localStorage.getItem('lt_token')
  if (!token) return null

  const baseUrl = import.meta.env.VITE_API_URL || ''
  const url = `${baseUrl}/api/notifications/subscribe?token=${token}`
  const eventSource = new EventSource(url)

  eventSource.addEventListener('notification', (e) => {
    try {
      const data = JSON.parse(e.data)
      onMessage(data)
    } catch {}
  })

  eventSource.addEventListener('connected', () => {
    console.log('Connected to notification stream')
  })

  eventSource.onerror = (e) => {
    if (onError) onError(e)
    // Auto-reconnect after 3 seconds
    setTimeout(() => eventSource.close(), 3000)
  }

  return eventSource
}

export default api
