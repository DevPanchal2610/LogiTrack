import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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
    if (err.response?.status === 401) {
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

export default api
