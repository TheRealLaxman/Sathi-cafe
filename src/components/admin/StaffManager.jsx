import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useDialog } from '../../hooks/useDialog.jsx'
import { manageableRoles, ROLE_LABELS } from '../../config/roles'

const inputClass =
  'rounded-xl border border-chai/30 bg-white/70 px-3 py-2 focus:outline-none focus:border-chai text-sm'
const btn = 'px-3 py-1.5 rounded-full border border-chai/30 text-sm hover:border-chai transition-colors'
const emptyForm = { email: '', displayName: '', role: 'content', password: '' }

export default function StaffManager() {
  const { user } = useAuth()
  const { dialog, confirm } = useDialog()
  const [admins, setAdmins] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [resetFor, setResetFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  // Load the admin accounts list.
  const load = useCallback(() => {
    api('/admins')
      .then(setAdmins)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Run an admin action and refresh the list.
  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    run(async () => {
      await api('/admins', { method: 'POST', body: form })
      setForm(emptyForm)
    })
  }

  const allowedRoles = manageableRoles(user?.role)

  // Change an admin's role after confirmation.
  const changeRole = (admin, role) =>
    run(async () => {
      const ok = await confirm(`Change ${admin.email} to ${ROLE_LABELS[role]}? Their current session will end.`, {
        title: 'Change role',
        confirmLabel: 'Change role',
        danger: true,
      })
      if (ok) await api(`/admins/${admin.id}`, { method: 'PATCH', body: { role } })
    })

  // Activate or deactivate an admin account.
  const toggleActive = (admin) =>
    run(async () => {
      const next = !admin.isActive
      const ok = await confirm(`${next ? 'Reactivate' : 'Deactivate'} ${admin.email}?`, {
        title: next ? 'Reactivate admin' : 'Deactivate admin',
        confirmLabel: next ? 'Reactivate' : 'Deactivate',
        danger: !next,
      })
      if (ok) await api(`/admins/${admin.id}`, { method: 'PATCH', body: { isActive: next } })
    })

  // Delete an admin account after confirmation.
  const deleteAdmin = (admin) =>
    run(async () => {
      const ok = await confirm(`Permanently delete ${admin.email}? This cannot be undone.`, {
        title: 'Delete admin',
        confirmLabel: 'Delete',
        danger: true,
      })
      if (ok) await api(`/admins/${admin.id}`, { method: 'DELETE' })
    })

  // Reset an admin password after confirmation.
  const resetPassword = (admin) =>
    run(async () => {
      if (newPassword.length < 12) {
        setError('Use a password of at least 12 characters')
        return
      }
      const ok = await confirm(`Reset the password for ${admin.email}? Their sessions will end.`, {
        title: 'Reset password',
        confirmLabel: 'Reset password',
        danger: true,
      })
      if (!ok) return
      await api(`/admins/${admin.id}/reset-password`, { method: 'POST', body: { password: newPassword } })
      setResetFor(null)
      setNewPassword('')
    })

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white/60 border border-chai/10 rounded-2xl p-5 grid md:grid-cols-2 gap-3">
        <h2 className="md:col-span-2 font-display text-xl font-bold">Add a cafe admin</h2>
        <input
          aria-label="New admin email"
          className={inputClass}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          aria-label="New admin display name"
          className={inputClass}
          placeholder="Display name (optional)"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <select
          aria-label="New admin role"
          className={inputClass}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {allowedRoles.map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
        <input
          aria-label="New admin password"
          className={inputClass}
          type="password"
          minLength="12"
          placeholder="Temporary password (12+ chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button
          className="md:col-span-2 bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'Working...' : 'Add admin'}
        </button>
      </form>

      {error && <p className="text-brick">{error}</p>}

      <div className="space-y-3">
        {admins.map((admin) => {
          const self = admin.id === user?.id
          const manageable = !self && allowedRoles.includes(admin.role)
          return (
            <div key={admin.id} className="bg-white/60 border border-chai/10 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold">
                    {admin.displayName || admin.email.split('@')[0]}
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-chai/10 text-chai">
                      {ROLE_LABELS[admin.role] || admin.role}
                    </span>
                    {!admin.isActive && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-brick/10 text-brick">deactivated</span>
                    )}
                  </p>
                  <p className="text-sm text-ink/60">{admin.email}{self ? ' · you' : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {manageable && (
                    <select
                      aria-label={`Role for ${admin.email}`}
                      className={inputClass}
                      value={admin.role}
                      disabled={busy}
                      onChange={(e) => changeRole(admin, e.target.value)}
                    >
                      {allowedRoles.map((role) => (
                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                  )}
                  {manageable && (
                    <button className={btn} disabled={busy} onClick={() => toggleActive(admin)}>
                      {admin.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                  {manageable && (
                    <button
                      className={btn}
                      disabled={busy}
                      onClick={() => {
                        setResetFor(resetFor === admin.id ? null : admin.id)
                        setNewPassword('')
                      }}
                    >
                      Reset password
                    </button>
                  )}
                  {manageable && (
                    <button
                      className={`${btn} text-brick`}
                      disabled={busy}
                      onClick={() => deleteAdmin(admin)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {resetFor === admin.id && (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    aria-label={`New password for ${admin.email}`}
                    className={inputClass}
                    type="password"
                    minLength="12"
                    placeholder="New password (12+ chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button className={btn} disabled={busy} onClick={() => resetPassword(admin)}>Save password</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {dialog}
    </div>
  )
}
