import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Truck } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName:'', email:'', password:'', phone:'', role:'CUSTOMER' })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    const { fullName, email, password, phone, role } = form
    if (!fullName || !email || !password || !phone) return toast.error('Please fill all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Account created! Welcome, ${user.fullName.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
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
