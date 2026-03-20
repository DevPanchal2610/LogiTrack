import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { adminApi } from '../../services/api'
import { Users, Trash2, Search, ShieldCheck, Truck, User } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_ICON = { ADMIN: ShieldCheck, VENDOR: Truck, CUSTOMER: User }
const ROLE_CLASS = { ADMIN: 'role-admin', VENDOR: 'role-vendor', CUSTOMER: 'role-customer' }

export default function AdminUsersPage() {
  const [users, setUsers]     = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAllUsers()
      setUsers(res.data.data || [])
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = users
    if (roleFilter !== 'ALL') data = data.filter(u => u.role === roleFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      )
    }
    setFiltered(data)
  }, [users, search, roleFilter])

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await adminApi.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success(`User "${name}" deleted`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally { setDeleting(null) }
  }

  const counts = {
    ALL:      users.length,
    ADMIN:    users.filter(u => u.role === 'ADMIN').length,
    VENDOR:   users.filter(u => u.role === 'VENDOR').length,
    CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
  }

  return (
    <AppLayout title="Manage Users">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Users</h2>
          <p>{users.length} registered user{users.length !== 1 ? 's' : ''} in the system</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { role:'ADMIN',    label:'Admins',    color:'#7c3aed', bg:'#ede9fe' },
          { role:'VENDOR',   label:'Vendors',   color:'#1e40af', bg:'#dbeafe' },
          { role:'CUSTOMER', label:'Customers', color:'#065f46', bg:'#d1fae5' },
        ].map(({ role, label, color, bg }) => {
          const Icon = ROLE_ICON[role]
          return (
            <div key={role} className="stat-card">
              <div className="stat-icon" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div className="stat-value">{counts[role]}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div className="search-bar">
          <Search size={14} />
          <input placeholder="Search name, email, phone..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['ALL','ADMIN','VENDOR','CUSTOMER'].map(r => (
            <button key={r}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding:'5px 12px' }}
              onClick={() => setRoleFilter(r)}>
              {r === 'ALL' ? `All (${counts.ALL})` : `${r} (${counts[r]})`}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><span className="spinner spinner-lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>No users found</h3>
            <p>{search || roleFilter !== 'ALL' ? 'Try adjusting your filters' : 'No users registered yet'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const Icon = ROLE_ICON[u.role] || User
                  return (
                    <tr key={u.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:32, height:32, borderRadius:'50%',
                            background:'#f3f4f6', display:'flex', alignItems:'center',
                            justifyContent:'center', flexShrink:0, fontWeight:700,
                            fontSize:12, color:'#6b7280',
                          }}>
                            {u.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <span style={{ fontWeight:500 }}>{u.fullName}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td className="text-muted">{u.phone || '—'}</td>
                      <td>
                        <span className={`badge ${ROLE_CLASS[u.role] || 'badge-gray'}`}
                          style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                          <Icon size={10} /> {u.role}
                        </span>
                      </td>
                      <td className="text-muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {u.role !== 'ADMIN' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color:'#dc2626', borderColor:'#fca5a5' }}
                            onClick={() => deleteUser(u.id, u.fullName)}
                            disabled={deleting === u.id}>
                            {deleting === u.id
                              ? <span className="spinner" style={{ width:13, height:13, borderTopColor:'#dc2626' }} />
                              : <Trash2 size={13} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
