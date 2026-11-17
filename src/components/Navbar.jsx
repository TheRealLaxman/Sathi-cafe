import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [logoOk, setLogoOk] = useState(true)

  const linkClass = ({ isActive }) =>
    `font-medium transition-colors hover:text-chai ${isActive ? 'text-chai' : 'text-ink'}`

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-chai/20">
      <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-display text-2xl font-extrabold text-chai">
          {logoOk && (
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-10 object-contain"
              onError={() => setLogoOk(false)}
            />
          )}
          <span>
            Sathi <span className="text-leaf">Cafe</span>
          </span>
        </Link>

        <ul className="hidden md:flex gap-8">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass}>{l.label}</NavLink>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden text-2xl"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {open && (
        <ul className="md:hidden px-5 pb-4 flex flex-col gap-4 bg-cream">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
