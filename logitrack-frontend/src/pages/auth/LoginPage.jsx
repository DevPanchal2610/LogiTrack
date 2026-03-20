import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Truck } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
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
          <p>Shipment & Supply Chain Management</p>
        </div>

        <h2 className="auth-title">Sign in to your account</h2>
        <p className="auth-sub">Enter your credentials to continue</p>

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

          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px' }}
            disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider"><span>or try demo</span></div>

        <div style={{ display:'flex', gap:8 }}>
          {[['Admin','admin@logitrack.com'],['Vendor','vendor@logitrack.com'],['Customer','customer@logitrack.com']].map(([role,email]) => (
            <button key={role} className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }}
              onClick={() => setForm({ email, password:'demo123' })}>
              {role}
            </button>
          ))}
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}
