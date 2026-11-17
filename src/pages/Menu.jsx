import { useEffect, useState } from 'react'
import { categories } from '../data/menu'
import { api } from '../services/api'
import { whatsappLink } from '../data/cafe'
import ItemPhoto from '../components/ItemPhoto'

const qtyBtn =
  'w-9 h-9 rounded-full border border-chai/40 text-chai text-lg leading-none hover:bg-chai hover:text-cream transition-colors'

export default function Menu() {
  const [items, setItems] = useState([])
  const [active, setActive] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState({})

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

  return (
    <section className={`max-w-6xl mx-auto px-5 py-12 ${count > 0 ? 'pb-32' : ''}`}>
      <h1 className="font-display text-4xl md:text-5xl font-extrabold text-chai mb-8">Our Menu</h1>

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
              className="bg-chai text-cream rounded-full px-5 py-2.5 text-sm font-medium hover:bg-brick transition-colors"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  )
}
