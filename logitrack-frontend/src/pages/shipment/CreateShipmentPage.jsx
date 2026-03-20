import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { shipmentApi, adminApi } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Package } from 'lucide-react'

export default function CreateShipmentPage() {
  const navigate  = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(false)
  const [form, setForm] = useState({
    description: '', originAddress: '', destinationAddress: '',
    weightKg: '', customerId: '', estimatedDelivery: ''
  })

useEffect(() => {
    adminApi.getCustomers()
      .then(r => setCustomers(r.data.data || []))
      .catch(() => toast.error('Could not load customers. Check permissions.'))
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    const { description, originAddress, destinationAddress, weightKg, customerId } = form
    if (!description || !originAddress || !destinationAddress || !weightKg || !customerId)
      return toast.error('Please fill all required fields')

    setLoading(true)
    try {
      const payload = {
        ...form,
        weightKg: parseFloat(weightKg),
        customerId: parseInt(customerId),
        estimatedDelivery: form.estimatedDelivery || null,
      }
      const res = await shipmentApi.create(payload)
      toast.success(`Shipment created! Tracking: ${res.data.data.trackingNumber}`)
      navigate('/shipments')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Create Shipment">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Create New Shipment</h2>
          <p>Fill in the details below to register a new shipment</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div style={{ maxWidth: 680 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Package size={16} color="#0f4539" /> Shipment Details
            </span>
          </div>
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Description <span style={{ color:'red' }}>*</span></label>
                <input className="form-input" placeholder="e.g. Electronics – Laptop, 1 unit"
                  value={form.description} onChange={set('description')} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Origin Address <span style={{ color:'red' }}>*</span></label>
                  <input className="form-input" placeholder="Warehouse address"
                    value={form.originAddress} onChange={set('originAddress')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Address <span style={{ color:'red' }}>*</span></label>
                  <input className="form-input" placeholder="Delivery address"
                    value={form.destinationAddress} onChange={set('destinationAddress')} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Weight (kg) <span style={{ color:'red' }}>*</span></label>
                  <input className="form-input" type="number" step="0.1" min="0.1" placeholder="e.g. 2.5"
                    value={form.weightKg} onChange={set('weightKg')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Delivery</label>
                  <input className="form-input" type="datetime-local"
                    value={form.estimatedDelivery} onChange={set('estimatedDelivery')} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Customer <span style={{ color:'red' }}>*</span></label>
                <select className="form-select" value={form.customerId} onChange={set('customerId')}>
                  <option value="">— Select a customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                  ))}
                </select>
                <p className="form-hint">Only registered customers appear in this list</p>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" /> Creating...</> : 'Create Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
