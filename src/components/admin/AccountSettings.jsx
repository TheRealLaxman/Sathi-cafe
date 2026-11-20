import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const inputClass =
  'w-full rounded-xl border border-chai/30 bg-white/70 px-4 py-2.5 focus:outline-none focus:border-chai'

export default function AccountSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Change the signed-in admin's password.
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.newPassword.length < 12) {
      setError('Use a password of at least 12 characters')
      return
    }
    if (form.newPassword !== form.confirm) {
      setError('The new passwords do not match')
      return
    }

    setBusy(true)
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      })
      await logout()
      navigate('/admin/login', { state: { notice: 'Password changed. Please sign in again.' }, replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md bg-white/60 border border-chai/10 rounded-2xl p-6 space-y-4">
      <h2 className="font-display text-xl font-bold">Account settings</h2>
      <p className="text-sm text-ink/60">Signed in as {user?.email} ({user?.role}).</p>

      <input
        aria-label="Current password"
        className={inputClass}
        type="password"
        placeholder="Current password"
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        required
      />
      <input
        aria-label="New password"
        className={inputClass}
        type="password"
        minLength="12"
        placeholder="New password (12+ chars)"
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        required
      />
      <input
        aria-label="Confirm new password"
        className={inputClass}
        type="password"
        minLength="12"
        placeholder="Confirm new password"
        value={form.confirm}
        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        required
      />

      {error && <p className="text-brick">{error}</p>}
      <button
        className="w-full bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors disabled:opacity-60"
        disabled={busy}
      >
        {busy ? 'Saving...' : 'Change password'}
      </button>
    </form>
  )
}
