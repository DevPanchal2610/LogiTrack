import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Truck } from 'lucide-react'

function getErrorMessage(err) {
  // Spring Boot validation errors — map of field -> message
  if (err.response?.data?.data && typeof err.response.data.data === 'object') {
    const entries = Object.entries(err.response.data.data)
    if (entries.length > 0) {
      // Show all field errors, one per line
      return entries.map(([field, msg]) => `${field}: ${msg}`).join('\n')
    }
  }
  // Our ApiResponse message field
  if (err.response?.data?.message) return err.response.data.message
  // Spring Security default error body
  if (err.response?.data?.error) return err.response.data.error
  // Network / no response
  if (!err.response) return 'Cannot connect to server. Make sure the backend is running.'
  if (err.response?.status === 409) return 'An account with this email already exists.'
  if (err.response?.status === 400) return 'Invalid details. Please check your input.'
  if (err.response?.status === 500) return 'Server error. Please try again later.'
  return 'Registration failed. Please try again.'
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName:'', email:'', password:'', phone:'', role:'CUSTOMER' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = k => e => {
    setError('')
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    const { fullName, email, password, phone } = form
    if (!fullName) return setError('Full name is required.')
    if (!email)    return setError('Email address is required.')
    if (!phone)    return setError('Phone number is required.')
    if (!password) return setError('Password is required.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Account created! Welcome, ${user.fullName.split(' ')[0]}!`)
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
          <p>Create your account</p>
        </div>

        <h2 className="auth-title">Get started</h2>
        <p className="auth-sub">Fill in the details below to register</p>

        {error && (
          <div style={{
            background:'#fee2e2', border:'1px solid #fca5a5',
            borderRadius:8, padding:'10px 14px', marginBottom:16,
            color:'#991b1b', fontSize:13.5,
            display:'flex', alignItems:'flex-start', gap:8,
            whiteSpace: 'pre-line',
          }}>
            <span style={{ flexShrink:0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Dev Panchal" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 9316510025" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="At least 6 characters" value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-select" value={form.role} onChange={set('role')}>
              <option value="CUSTOMER">Customer — I receive shipments</option>
              <option value="VENDOR">Vendor — I send shipments</option>
            </select>
          </div>

          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px' }}
            disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
