import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const inputBase = 'w-full rounded-xl border bg-white/70 px-4 py-2.5 focus:outline-none'
const fieldClass = (error) =>
  `${inputBase} ${error ? 'border-brick' : 'border-chai/30 focus:border-chai'}`

export default function AdminForgot() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email } })
      setSent(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-sm mx-auto px-5 py-20">
      <div className="bg-white/60 border border-chai/10 rounded-2xl p-6 space-y-4">
        <h1 className="font-display text-3xl font-extrabold text-chai">Forgot password</h1>

        {sent ? (
          <>
            <p className="text-leaf">{sent}</p>
            <p className="text-sm text-ink/60">The link works for 30 minutes.</p>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <p className="text-sm text-ink/70">
              Enter the admin email and we'll send you a link to set a new password.
            </p>
            <div>
              <input
                className={fieldClass(emailError)}
                type="email"
                aria-label="Admin email"
                placeholder="Admin email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError('')
                }}
              />
              {emailError && <p className="text-sm text-brick mt-1">{emailError}</p>}
            </div>
            <button
              disabled={loading}
              className="w-full bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            {error && <p className="text-brick">{error}</p>}
          </form>
        )}

        <Link to="/admin/login" className="block text-sm text-chai hover:text-brick transition-colors">
          ← Back to login
        </Link>
      </div>
    </section>
  )
}
