import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { categories } from '../data/menu'
import { findMenuImage, menuImages } from '../data/images'
import { useDialog } from '../hooks/useDialog.jsx'
import { useAuth } from '../hooks/useAuth'
import { PERMISSIONS } from '../config/roles'
import StaffManager from '../components/admin/StaffManager'
import ActivityLog from '../components/admin/ActivityLog'
import AccountSettings from '../components/admin/AccountSettings'

const inputClass =
  'rounded-xl border border-chai/30 bg-white/70 px-3 py-2 focus:outline-none focus:border-chai'
const btn = 'px-3 py-1.5 rounded-full border border-chai/30 text-sm hover:border-chai transition-colors'
const pill = 'px-3 py-1.5 rounded-full border text-sm transition-colors'
const pillIdle = `${pill} border-chai/30 hover:border-chai`
const pillGreen = `${pill} bg-leaf text-cream border-leaf hover:opacity-90`
const pillRed = `${pill} bg-brick text-cream border-brick hover:opacity-90`

// Load data from an API path.
function useLoad(path) {
  const [data, setData] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api(path)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  // Run an action and refresh loaded data.
  const act = async (fn) => {
    try {
      await fn()
      setError('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return { data, error, act }
}

function Reservations({ can }) {
  const { data, error, act } = useLoad('/reservations')
  const { dialog, confirm } = useDialog()

  const badge = {
    pending: 'bg-chai/15 text-chai',
    confirmed: 'bg-leaf/15 text-leaf',
    cancelled: 'bg-brick/15 text-brick',
  }

  const setStatus = (id, status) =>
    act(() => api(`/reservations/${id}`, { method: 'PATCH', body: { status } }))

  const toggleConfirm = async (r) => {
    if (r.status !== 'confirmed') return setStatus(r._id, 'confirmed')
    const ok = await confirm(
      `Remove the confirmation for ${r.name}? The reservation will go back to pending.`,
      { title: 'Undo confirmation', confirmLabel: 'Remove confirmation', cancelLabel: 'Keep confirmed', danger: true }
    )
    if (ok) setStatus(r._id, 'pending')
  }

  const toggleCancel = async (r) => {
    if (r.status === 'cancelled') {
      const ok = await confirm(
        `Reopen the reservation for ${r.name}? It will go back to pending.`,
        { title: 'Reopen reservation', confirmLabel: 'Reopen', cancelLabel: 'Keep cancelled' }
      )
      if (ok) setStatus(r._id, 'pending')
      return
    }
    const ok = await confirm(`Cancel the reservation for ${r.name}?`, {
      title: 'Cancel reservation',
      confirmLabel: 'Yes, cancel it',
      cancelLabel: 'Keep it',
      danger: true,
    })
    if (ok) setStatus(r._id, 'cancelled')
  }

  const remove = async (r) => {
    const ok = await confirm(`Delete the reservation for ${r.name}? This cannot be undone.`, {
      title: 'Delete reservation',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) act(() => api(`/reservations/${r._id}`, { method: 'DELETE' }))
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-brick">{error}</p>}
      {data.length === 0 && <p className="text-ink/60">No reservations yet.</p>}
      {data.map((r) => (
        <div key={r._id} className="bg-white/60 border border-chai/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold">
              {r.name}
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${badge[r.status]}`}>{r.status}</span>
            </p>
            <p className="text-sm text-ink/70">
              {r.date} at {r.time} · {r.guests} guests · {r.phone}
            </p>
            {r.email && <p className="text-sm text-ink/60">{r.email}</p>}
            {r.note && <p className="text-sm text-ink/60 mt-1">"{r.note}"</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={r.status === 'confirmed' ? pillGreen : pillIdle} onClick={() => toggleConfirm(r)}>
              {r.status === 'confirmed' ? 'Confirmed ✓' : 'Confirm'}
            </button>
            <button className={r.status === 'cancelled' ? pillRed : pillIdle} onClick={() => toggleCancel(r)}>
              {r.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
            </button>
            {can(PERMISSIONS.reservationsDelete) && (
              <button className={pillIdle} onClick={() => remove(r)}>Delete</button>
            )}
          </div>
        </div>
      ))}
      {dialog}
    </div>
  )
}

function Messages({ can }) {
  const { data, error, act } = useLoad('/messages')
  const { dialog, confirm } = useDialog()

  const remove = async (m) => {
    const ok = await confirm(`Delete the message from ${m.name}? This cannot be undone.`, {
      title: 'Delete message',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) act(() => api(`/messages/${m._id}`, { method: 'DELETE' }))
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-brick">{error}</p>}
      {data.length === 0 && <p className="text-ink/60">No messages yet.</p>}
      {data.map((m) => (
        <div key={m._id} className="bg-white/60 border border-chai/10 rounded-2xl p-5 flex justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold">{m.name}</p>
            <p className="text-sm text-chai">{m.email}</p>
            <p className="mt-2 text-ink/80 whitespace-pre-wrap">{m.message}</p>
            <p className="text-xs text-ink/50 mt-2">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
          {can(PERMISSIONS.messagesDelete) && (
            <button className={`${btn} self-start`} onClick={() => remove(m)}>Delete</button>
          )}
        </div>
      ))}
      {dialog}
    </div>
  )
}

function Orders({ can }) {
  const { data, error, act } = useLoad('/orders')
  const { dialog, confirm } = useDialog()
  const next = { new: 'preparing', preparing: 'ready', ready: 'completed' }

  const badge = {
    new: 'bg-chai/15 text-chai',
    preparing: 'bg-leaf/15 text-leaf',
    ready: 'bg-leaf/15 text-leaf',
    completed: 'bg-ink/10 text-ink',
    cancelled: 'bg-brick/15 text-brick',
  }

  const setStatus = (id, status) =>
    act(() => api(`/orders/${id}`, { method: 'PATCH', body: { status } }))

  const remove = async (o) => {
    const ok = await confirm(`Delete the order from ${o.name}? This cannot be undone.`, {
      title: 'Delete order',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) act(() => api(`/orders/${o._id}`, { method: 'DELETE' }))
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-brick">{error}</p>}
      {data.length === 0 && <p className="text-ink/60">No orders yet.</p>}
      {data.map((o) => (
        <div key={o._id} className="bg-white/60 border border-chai/10 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold">
                {o.name}
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${badge[o.status]}`}>{o.status}</span>
              </p>
              <p className="text-sm text-ink/70">
                {o.phone} · {new Date(o.createdAt).toLocaleString()}
              </p>
              {o.email && <p className="text-sm text-ink/60">{o.email}</p>}
            </div>
            <p className="font-bold text-chai">Rs. {o.total}</p>
          </div>

          <ul className="mt-3 text-sm text-ink/80 space-y-1">
            {o.items.map((line) => (
              <li key={line.menuItem}>
                {line.qty} × {line.name} — Rs. {line.qty * line.price}
              </li>
            ))}
          </ul>
          {o.note && <p className="text-sm text-ink/60 mt-2">"{o.note}"</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {next[o.status] && (
              <button className={pillIdle} onClick={() => setStatus(o._id, next[o.status])}>
                Mark {next[o.status]}
              </button>
            )}
            {o.status !== 'cancelled' && o.status !== 'completed' && (
              <button className={pillIdle} onClick={() => setStatus(o._id, 'cancelled')}>Cancel</button>
            )}
            {can(PERMISSIONS.ordersDelete) && (
              <button className={pillIdle} onClick={() => remove(o)}>Delete</button>
            )}
          </div>
        </div>
      ))}
      {dialog}
    </div>
  )
}

function MenuManager({ can }) {
  const { data, error, act } = useLoad('/menu/admin/all')
  const { dialog, confirm } = useDialog()
  const emptyForm = { name: '', category: 'Coffee', price: '', description: '', tags: '', image: '', isAvailable: true }
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [uploads, setUploads] = useState([])
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    api('/uploads')
      .then(setUploads)
      .catch(() => {})
  }, [])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const reset = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const submit = (e) => {
    e.preventDefault()
    const body = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      image: form.image.trim(),
      isAvailable: form.isAvailable,
    }
    act(async () => {
      if (editing) await api(`/menu/${editing}`, { method: 'PUT', body })
      else await api('/menu', { method: 'POST', body })
      reset()
    })
  }

  const startEdit = (item) => {
    setEditing(item._id)
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      description: item.description || '',
      tags: (item.tags || []).join(', '),
      image: item.image || '',
      isAvailable: item.isAvailable,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleAvailable = (item) =>
    act(() => api(`/menu/${item._id}`, { method: 'PUT', body: { isAvailable: !item.isAvailable } }))

  const remove = async (item) => {
    const ok = await confirm(`Delete ${item.name} from the menu? This cannot be undone.`, {
      title: 'Delete item',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) act(() => api(`/menu/${item._id}`, { method: 'DELETE' }))
  }

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const data = new FormData()
    data.append('image', file)
    try {
      const result = await api('/uploads', { method: 'POST', body: data })
      setUploads((prev) => [result, ...prev])
      setForm((prev) => ({ ...prev, image: result.url }))
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeUpload = async (url) => {
    const name = url.split('/').pop()
    const ok = await confirm(`Delete the uploaded photo ${name}? This cannot be undone.`, {
      title: 'Delete photo',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    setUploadError('')
    try {
      await api(`/uploads/${name}`, { method: 'DELETE' })
      setUploads((prev) => prev.filter((u) => u.url !== url))
      setForm((prev) => (prev.image === url ? { ...prev, image: '' } : prev))
    } catch (err) {
      setUploadError(err.message)
    }
  }

  const photos = [...uploads.map((u) => u.url), ...Object.values(menuImages)]

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white/60 border border-chai/10 rounded-2xl p-5 grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{editing ? 'Edit item' : 'Add a menu item'}</h2>
          {editing && <button type="button" className={btn} onClick={reset}>Cancel edit</button>}
        </div>
        <input aria-label="Item name" className={inputClass} name="name" placeholder="Item name" value={form.name} onChange={change} required />
        <select aria-label="Category" className={inputClass} name="category" value={form.category} onChange={change}>
          {categories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
        </select>
        <input aria-label="Price" className={inputClass} type="number" min="0" name="price" placeholder="Price (Rs.)" value={form.price} onChange={change} required />
        <input aria-label="Tags" className={inputClass} name="tags" placeholder="Tags, comma separated (veg, popular)" value={form.tags} onChange={change} />
        <input aria-label="Description" className={`${inputClass} md:col-span-2`} name="description" placeholder="Short description" value={form.description} onChange={change} />
        <input aria-label="Image link" className={`${inputClass} md:col-span-2`} name="image" placeholder="Image link, or pick a photo below" value={form.image} onChange={change} />

        <div className="md:col-span-2 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {can(PERMISSIONS.uploadsWrite) && (
              <label className="text-sm text-ink/70">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  ref={fileRef}
                  onChange={upload}
                  className="hidden"
                />
                <button
                  type="button"
                  className={btn}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload photo'}
                </button>
              </label>
            )}
            {form.image && (
              <button type="button" className={btn} onClick={() => setForm((prev) => ({ ...prev, image: '' }))}>
                Remove image
              </button>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
              Available on the menu
            </label>
          </div>
          {uploadError && <p className="text-sm text-brick">{uploadError}</p>}
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {photos.map((url) => {
                const removable = url.startsWith('/uploads/') && can(PERMISSIONS.uploadsWrite)
                return (
                  <div key={url} className="relative w-14 h-14">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: url }))}
                      title={url}
                      className={`w-full h-full rounded-xl overflow-hidden border-2 ${
                        form.image === url ? 'border-chai' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                    {removable && (
                      <button
                        type="button"
                        onClick={() => removeUpload(url)}
                        title="Delete uploaded photo"
                        aria-label={`Delete photo ${url}`}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brick text-cream text-sm leading-none flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button className="md:col-span-2 bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors">
          {editing ? 'Save changes' : 'Add item'}
        </button>
      </form>

      {error && <p className="text-brick">{error}</p>}

      <div className="space-y-3">
        {data.map((item) => {
          const photo = item.image || findMenuImage(item.name)
          return (
            <div key={item._id} className="bg-white/60 border border-chai/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className={`flex items-center gap-3 ${item.isAvailable ? '' : 'opacity-50'}`}>
                {photo ? (
                  <img src={photo} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-chai/10 flex items-center justify-center text-xs text-ink/50 shrink-0">
                    No photo
                  </div>
                )}
                <div>
                  <p className="font-display font-bold">
                    {item.name} <span className="text-chai">Rs. {item.price}</span>
                  </p>
                  <p className="text-sm text-ink/60">{item.category}{item.isAvailable ? '' : ' · hidden'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={btn} onClick={() => startEdit(item)}>Edit</button>
                <button className={btn} onClick={() => toggleAvailable(item)}>
                  {item.isAvailable ? 'Hide' : 'Show'}
                </button>
                {can(PERMISSIONS.menuDelete) && (
                  <button className={btn} onClick={() => remove(item)}>Delete</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {dialog}
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('reservations')
  const navigate = useNavigate()
  const { user, can, logout } = useAuth()

  // Log out and return to the login page.
  const signOut = async () => {
    await logout()
    navigate('/admin/login')
  }

  const tabs = [
    ['reservations', 'Reservations', PERMISSIONS.reservationsRead],
    ['messages', 'Messages', PERMISSIONS.messagesRead],
    ['orders', 'Orders', PERMISSIONS.ordersRead],
    ['menu', 'Menu', PERMISSIONS.menuRead],
    ['staff', 'Staff', PERMISSIONS.adminsRead],
    ['activity', 'Activity', PERMISSIONS.auditRead],
    ['account', 'Account', null],
  ]
  const visible = tabs.filter(([, , permission]) => !permission || can(permission))
  const active = visible.some(([key]) => key === tab) ? tab : visible[0]?.[0]

  return (
    <section className="max-w-4xl mx-auto px-5 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-chai">Dashboard</h1>
          <p className="text-sm text-ink/60 mt-1">
            {user?.displayName || user?.email} · {user?.role?.replace('-', ' ')}
          </p>
        </div>
        <button className={btn} onClick={signOut}>Log out</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {visible.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active === key ? 'bg-chai text-cream border-chai' : 'border-chai/30 hover:border-chai'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {active === 'reservations' && <Reservations can={can} />}
      {active === 'messages' && <Messages can={can} />}
      {active === 'orders' && <Orders can={can} />}
      {active === 'menu' && <MenuManager can={can} />}
      {active === 'staff' && <StaffManager />}
      {active === 'activity' && <ActivityLog />}
      {active === 'account' && <AccountSettings />}
    </section>
  )
}
