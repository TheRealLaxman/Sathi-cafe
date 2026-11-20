import { useEffect, useState } from 'react'
import { categories } from '../data/menu'
import { api } from '../services/api'
import { whatsappLink } from '../data/cafe'
import ItemPhoto from '../components/ItemPhoto'

const CART_KEY = 'sathi_cart'
const qtyBtn =
  'w-9 h-9 rounded-full border border-chai/40 text-chai text-lg leading-none hover:bg-chai hover:text-cream transition-colors'
const field =
  'w-full rounded-xl border border-chai/30 bg-white/70 px-4 py-2.5 focus:outline-none focus:border-chai'

// Read the saved cart from localStorage.
function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function Menu() {
  const [items, setItems] = useState([])
  const [active, setActive] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState(readCart)
  const [checkout, setCheckout] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' })
  const [formError, setFormError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const selectCategory = (c) => {
    if (c === active) return
    setActive(c)
    setLoading(true)
    setError('')
  }

  useEffect(() => {
    let ignore = false
    const path = active === 'All' ? '/menu' : `/menu?category=${encodeURIComponent(active)}`
    api(path)
      .then((data) => {
        if (!ignore) setItems(data)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [active])

  const changeQty = (item, delta) =>
    setCart((prev) => {
      const qty = (prev[item._id]?.qty || 0) + delta
      const next = { ...prev }
      if (qty <= 0) delete next[item._id]
      else next[item._id] = { item, qty }
      return next
    })

  const lines = Object.values(cart)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const total = lines.reduce((sum, l) => sum + l.qty * l.item.price, 0)

  const orderText = [
    "Hello Sathi Cafe! I'd like to place an order:",
    '',
    ...lines.map((l) => `${l.qty} × ${l.item.name} - Rs. ${l.qty * l.item.price}`),
    '',
    `Total: Rs. ${total}`,
    '',
    'Name:',
    'Pickup / Table no.:',
  ].join('\n')

  // Build WhatsApp text from a saved order.
  const savedText = (order) =>
    [
      `Order ${order._id.slice(-6).toUpperCase()}`,
      `Name: ${order.name}`,
      `Phone: ${order.phone}`,
      '',
      ...order.items.map((l) => `${l.qty} × ${l.name} - Rs. ${l.qty * l.price}`),
      '',
      `Total: Rs. ${order.total}`,
    ].join('\n')

  // Validate and save the customer order.
  const submit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Please enter your name')
    if (form.phone.replace(/\D/g, '').length < 7) return setFormError('Please enter a valid phone number')
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return setFormError('Please enter a valid email address')
    }

    setPlacing(true)
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          note: form.note.trim(),
          items: lines.map((l) => ({ id: l.item._id, qty: l.qty })),
        },
      })
      setPlaced(order)
      setCart({})
      setCheckout(false)
      setForm({ name: '', phone: '', email: '', note: '' })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <section className={`max-w-6xl mx-auto px-5 py-12 ${count > 0 ? 'pb-32' : ''}`}>
      <h1 className="font-display text-4xl md:text-5xl font-extrabold text-chai mb-8">Our Menu</h1>

      {placed && (
        <div className="mb-8 rounded-2xl bg-leaf/10 border border-leaf/30 p-5 space-y-3" aria-live="polite">
          <p className="font-medium text-leaf">Order saved! We'll get it ready.</p>
          <p className="text-sm text-ink/70">
            Send the details to us on WhatsApp too, so we can reply quickly.
          </p>
          <a
            href={whatsappLink(savedText(placed))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-leaf text-cream px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Send order on WhatsApp
          </a>
          <button
            className="ml-2 px-4 py-2 rounded-full border border-leaf/30 text-sm hover:border-leaf transition-colors"
            onClick={() => setPlaced(null)}
          >
            Done
          </button>
        </div>
      )}

      {checkout && count > 0 && (
        <form onSubmit={submit} noValidate className="mb-8 bg-white/60 border border-chai/20 rounded-2xl p-5 grid md:grid-cols-2 gap-3">
          <h2 className="md:col-span-2 font-display text-2xl font-bold">Your details</h2>
          <input aria-label="Your name" className={field} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input aria-label="Phone number" className={field} type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input aria-label="Email for updates" className={field} type="email" placeholder="Email for updates (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input aria-label="Order note" className={field} placeholder="Note, e.g. less sugar (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          {formError && <p className="md:col-span-2 text-sm text-brick" role="alert">{formError}</p>}
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              disabled={placing}
              className="bg-chai text-cream px-6 py-2.5 rounded-full font-medium hover:bg-brick transition-colors disabled:opacity-60"
            >
              {placing ? 'Saving...' : 'Save order'}
            </button>
            <button type="button" className="text-sm text-ink/60 px-3" onClick={() => setCheckout(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => selectCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active === c ? 'bg-chai text-cream border-chai' : 'border-chai/30 hover:border-chai'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="text-ink/60">Brewing your menu...</p>}
      {error && <p className="text-brick">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="text-ink/60">Nothing here yet.</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const qty = cart[item._id]?.qty || 0
          return (
            <article
              key={item._id}
              className="bg-white/60 rounded-2xl overflow-hidden border border-chai/10 flex flex-col"
            >
              <ItemPhoto item={item} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-display text-xl font-bold">{item.name}</h3>
                  <span className="font-bold text-chai whitespace-nowrap">Rs. {item.price}</span>
                </div>
                <p className="text-ink/70 mt-2 text-sm">{item.description}</p>
                <div className="mt-3 flex gap-2">
                  {item.tags.map((t) => (
                    <span key={t} className="text-xs bg-leaf/10 text-leaf px-2 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  {qty === 0 ? (
                    <button
                      onClick={() => changeQty(item, 1)}
                      className="w-full border border-chai text-chai rounded-full py-2 text-sm font-medium hover:bg-chai hover:text-cream transition-colors"
                    >
                      Add to order
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => changeQty(item, -1)}
                        className={qtyBtn}
                      >
                        −
                      </button>
                      <span className="font-bold">{qty} in your order</span>
                      <button
                        aria-label={`Add one ${item.name}`}
                        onClick={() => changeQty(item, 1)}
                        className={qtyBtn}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {count > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-xl bg-ink text-cream rounded-full pl-6 pr-2 py-2 shadow-2xl flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-bold">
              {count} {count === 1 ? 'item' : 'items'}
            </span>{' '}
            · Rs. {total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCart({})} className="text-sm text-cream/70 hover:text-cream px-3">
              Clear
            </button>
            <a
              href={whatsappLink(orderText)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cream/70 hover:text-cream px-3"
            >
              WhatsApp
            </a>
            <button
              onClick={() => setCheckout((v) => !v)}
              className="bg-chai text-cream rounded-full px-5 py-2.5 text-sm font-medium hover:bg-brick transition-colors"
            >
              Place order
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
