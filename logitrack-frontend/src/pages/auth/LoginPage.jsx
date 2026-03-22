import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Truck } from 'lucide-react'

function getErrorMessage(err) {
  // Spring Boot validation errors — map of field -> message
  if (err.response?.data?.data && typeof err.response.data.data === 'object') {
    const fieldErrors = Object.values(err.response.data.data)
    if (fieldErrors.length > 0) return fieldErrors[0]
  }
  // Our ApiResponse message field
  if (err.response?.data?.message) return err.response.data.message
  // Spring Security default error body
  if (err.response?.data?.error) return err.response.data.error
  // Network / no response
  if (!err.response) return 'Cannot connect to server. Make sure the backend is running.'
  // HTTP status fallbacks
  if (err.response?.status === 401) return 'Invalid email or password.'
  if (err.response?.status === 403) return 'Access denied.'
  if (err.response?.status === 500) return 'Server error. Please try again later.'
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = k => e => {
    setError('')
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!form.email)    return setError('Email address is required.')
    if (!form.password) return setError('Password is required.')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:6 }}>
            <div style={{ background:'#0f4539', padding:8, borderRadius:10 }}>
              <Truck size={22} color="#fff" />
            </div>
            <h1>Logi<span>Track</span></h1>
          </div>
          <p>Shipment &amp; Supply Chain Management</p>
        </div>

        <h2 className="auth-title">Sign in to your account</h2>
        <p className="auth-sub">Enter your credentials to continue</p>

        {error && (
          <div style={{
            background:'#fee2e2', border:'1px solid #fca5a5',
            borderRadius:8, padding:'10px 14px', marginBottom:16,
            color:'#991b1b', fontSize:13.5,
            display:'flex', alignItems:'flex-start', gap:8,
          }}>
            <span style={{ flexShrink:0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Enter your password"
              value={form.password} onChange={set('password')} />
          </div>

          <button className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:'11px' }}
            disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}
