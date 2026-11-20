import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'

const labels = {
  'auth.login': 'Signed in',
  'auth.login-failed': 'Failed sign-in',
  'auth.login-blocked': 'Blocked sign-in',
  'auth.logout': 'Signed out',
  'auth.refresh-reuse': 'Refresh token reuse',
  'auth.password-change': 'Changed own password',
  'auth.password-change-failed': 'Wrong current password',
  'auth.password-reset-requested': 'Requested password reset',
  'auth.password-reset-complete': 'Completed password reset',
  'admin.bootstrap': 'Bootstrap admin',
  'admin.create': 'Added admin',
  'admin.update': 'Updated admin',
  'admin.password-reset': 'Reset admin password',
}

const label = (action) => labels[action] || action

export default function ActivityLog() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Load activity entries from the audit API.
  const load = useCallback(async (next) => {
    setLoading(true)
    setError('')
    try {
      const result = await api(`/audit?limit=30${next ? `&cursor=${encodeURIComponent(next)}` : ''}`)
      setItems((prev) => (next ? [...prev, ...result.items] : result.items))
      setCursor(result.nextCursor)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="space-y-4">
      {error && <p className="text-brick">{error}</p>}
      {items.length === 0 && !loading && <p className="text-ink/60">No activity recorded yet.</p>}
      <div className="bg-white/60 border border-chai/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/60 border-b border-chai/10">
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Who</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-chai/5 last:border-0">
                <td className="p-3 whitespace-nowrap text-ink/70">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                </td>
                <td className="p-3">
                  <span className="font-medium">{item.actor?.email || 'Unknown'}</span>
                  {item.actor?.role && <span className="block text-xs text-ink/50">{item.actor.role}</span>}
                </td>
                <td className="p-3">
                  <span className={item.outcome === 'failure' ? 'text-brick' : 'text-leaf'}>
                    {label(item.action)}
                  </span>
                  {item.target?.email && <span className="block text-xs text-ink/50">{item.target.email}</span>}
                </td>
                <td className="p-3 text-ink/70">{item.detail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center">
        {cursor ? (
          <button className="px-4 py-2 rounded-full border border-chai/30 text-sm hover:border-chai disabled:opacity-60" disabled={loading} onClick={() => load(cursor)}>
            {loading ? 'Loading...' : 'Load older activity'}
          </button>
        ) : (
          items.length > 0 && <p className="text-xs text-ink/50">End of activity log.</p>
        )}
      </div>
    </div>
  )
}
