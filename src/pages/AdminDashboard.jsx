import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearToken, getToken } from '../services/api'
import { categories } from '../data/menu'
import { menuImages } from '../data/images'
import { useDialog } from '../hooks/useDialog'

const inputClass =
  'rounded-xl border border-chai/30 bg-white/70 px-3 py-2 focus:outline-none focus:border-chai'
const btn = 'px-3 py-1.5 rounded-full border border-chai/30 text-sm hover:border-chai transition-colors'

function useLoad(path, onAuthFail) {
  const [data, setData] = useState([])
  const [error, setError] = useState('')

  const load = () =>
    api(path, { auth: true })
      .then(setData)
      .catch((err) => {
        setError(err.message)
        if (!getToken()) onAuthFail()
      })

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  const act = async (fn) => {
    try {
      await fn()
      setError('')
      load()
    } catch (err) {
      setError(err.message)
      if (!getToken()) onAuthFail()
    }
  }

  return { data, error, act }
}

function Reservations({ onAuthFail }) {
  const { data, error, act } = useLoad('/reservations', onAuthFail)
  const { dialog, confirm } = useDialog()

  const badge = {
    pending: 'bg-chai/15 text-chai',
    confirmed: 'bg-leaf/15 text-leaf',
    cancelled: 'bg-brick/15 text-brick',
  }

  const pill = 'px-3 py-1.5 rounded-full border text-sm transition-colors'
  const pillIdle = `${pill} border-chai/30 hover:border-chai`
  const pillGreen = `${pill} bg-leaf text-cream border-leaf hover:opacity-90`
  const pillRed = `${pill} bg-brick text-cream border-brick hover:opacity-90`

  const setStatus = (id, status) =>
    act(() => api(`/reservations/${id}`, { method: 'PATCH', auth: true, body: { status } }))

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
    if (ok) act(() => api(`/reservations/${r._id}`, { method: 'DELETE', auth: true }))
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
            {r.note && <p className="text-sm text-ink/60 mt-1">"{r.note}"</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={r.status === 'confirmed' ? pillGreen : pillIdle} onClick={() => toggleConfirm(r)}>
              {r.status === 'confirmed' ? 'Confirmed ✓' : 'Confirm'}
            </button>
            <button className={r.status === 'cancelled' ? pillRed : pillIdle} onClick={() => toggleCancel(r)}>
              {r.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
            </button>
            <button className={pillIdle} onClick={() => remove(r)}>Delete</button>
          </div>
        </div>
      ))}
      {dialog}
    </div>
  )
}

function Messages({ onAuthFail }) {
  const { data, error, act } = useLoad('/messages', onAuthFail)
  const { dialog, confirm } = useDialog()

  const remove = async (m) => {
    const ok = await confirm(`Delete the message from ${m.name}? This cannot be undone.`, {
      title: 'Delete message',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) act(() => api(`/messages/${m._id}`, { method: 'DELETE', auth: true }))
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
          <button className={`${btn} self-start`} onClick={() => remove(m)}>
            Delete
          </button>
        </div>
      ))}
      {dialog}
    </div>
  )
}

function MenuManager({ onAuthFail }) {
  const { data, error, act } = useLoad('/menu/admin/all', onAuthFail)
  const { dialog, confirm, prompt } = useDialog()
  const emptyForm = { name: '', category: 'Coffee', price: '', description: '', tags: '', image: '' }
  const [form, setForm] = useState(emptyForm)
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const add = (e) => {
    e.preventDefault()
    act(async () => {
      await api('/menu', {
        method: 'POST',
        auth: true,
        body: {
          ...form,
          image: form.image.trim(),
          price: Number(form.price),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      })
      setForm(emptyForm)
    })
  }

  const update = (id, body) => act(() => api(`/menu/${id}`, { method: 'PUT', auth: true, body }))

  const editPrice = async (item) => {
    const value = await prompt(`New price for ${item.name} (Rs.)`, String(item.price), {
      title: 'Edit price',
      confirmLabel: 'Save',
      inputType: 'number',
    })
    if (value !== null && value.trim() !== '' && !isNaN(Number(value))) {
      update(item._id, { price: Number(value) })
    }
  }

  const editImage = async (item) => {
    const value = await prompt(
      `Image for ${item.name}.\nUse a full link (https://...) or a file in the site (/images/name.webp).\nLeave empty to remove the custom image.`,
      item.image || '',
      {
        title: 'Edit image',
        confirmLabel: 'Save',
        placeholder: 'https://... or /images/name.webp',
      }
    )
    if (value !== null) update(item._id, { image: value.trim() })
  }

  const remove = async (item) => {
    const ok = await confirm(`Delete ${item.name} from the menu? This cannot be undone.`, {
      title: 'Delete item',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) act(() => api(`/menu/${item._id}`, { method: 'DELETE', auth: true }))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white/60 border border-chai/10 rounded-2xl p-5 grid md:grid-cols-2 gap-3">
        <input className={inputClass} name="name" placeholder="Item name" value={form.name} onChange={change} required />
        <select className={inputClass} name="category" value={form.category} onChange={change}>
          {categories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className={inputClass} type="number" min="0" name="price" placeholder="Price (Rs.)" value={form.price} onChange={change} required />
        <input className={inputClass} name="tags" placeholder="Tags, comma separated (veg, popular)" value={form.tags} onChange={change} />
        <input className={`${inputClass} md:col-span-2`} name="description" placeholder="Short description" value={form.description} onChange={change} />
        <input className={`${inputClass} md:col-span-2`} name="image" placeholder="Image link (https://... or /images/name.webp), optional" value={form.image} onChange={change} />
        <button className="md:col-span-2 bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors">
          Add item
        </button>
      </form>

      {error && <p className="text-brick">{error}</p>}

      <div className="space-y-3">
        {data.map((item) => {
          const photo = item.image || menuImages[item.name]
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
                <button className={btn} onClick={() => editPrice(item)}>Edit price</button>
                <button className={btn} onClick={() => editImage(item)}>Edit image</button>
                <button className={btn} onClick={() => update(item._id, { isAvailable: !item.isAvailable })}>
                  {item.isAvailable ? 'Hide' : 'Show'}
                </button>
                <button className={btn} onClick={() => remove(item)}>Delete</button>
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
  const goLogin = () => navigate('/admin/login')
  const logout = () => {
    clearToken()
    goLogin()
  }

  const tabs = [
    ['reservations', 'Reservations'],
    ['messages', 'Messages'],
    ['menu', 'Menu'],
  ]

  return (
    <section className="max-w-4xl mx-auto px-5 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl font-extrabold text-chai">Dashboard</h1>
        <button className={btn} onClick={logout}>Log out</button>
      </div>

      <div className="flex gap-2 mb-8">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              tab === key ? 'bg-chai text-cream border-chai' : 'border-chai/30 hover:border-chai'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'reservations' && <Reservations onAuthFail={goLogin} />}
      {tab === 'messages' && <Messages onAuthFail={goLogin} />}
      {tab === 'menu' && <MenuManager onAuthFail={goLogin} />}
    </section>
  )
}
