import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'

const inputBase = 'w-full rounded-xl border bg-white/70 px-4 py-2.5 focus:outline-none'
const fieldClass = (error) =>
  `${inputBase} ${error ? 'border-brick' : 'border-chai/30 focus:border-chai'}`

export default function AdminReset() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const found = {}
    if (password.length < 8) found.password = 'Use at least 8 characters'
    if (repeat !== password) found.repeat = 'The two passwords do not match'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setLoading(true)
    try {
      await api(`/auth/reset-password/${token}`, { method: 'POST', body: { password } })
      navigate('/admin/login', { state: { notice: 'Password updated. You can log in now.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-sm mx-auto px-5 py-20">
      <form
        onSubmit={submit}
        noValidate
        className="bg-white/60 border border-chai/10 rounded-2xl p-6 space-y-4"
      >
        <h1 className="font-display text-3xl font-extrabold text-chai">New password</h1>

        <div>
          <input
            className={fieldClass(errors.password)}
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors({ ...errors, password: '' })
            }}
          />
          {errors.password && <p className="text-sm text-brick mt-1">{errors.password}</p>}
        </div>

        <div>
          <input
            className={fieldClass(errors.repeat)}
            type="password"
            placeholder="Type it again"
            value={repeat}
            onChange={(e) => {
              setRepeat(e.target.value)
              setErrors({ ...errors, repeat: '' })
            }}
          />
          {errors.repeat && <p className="text-sm text-brick mt-1">{errors.repeat}</p>}
        </div>

        <button
          disabled={loading}
          className="w-full bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save new password'}
        </button>

        {error && (
          <p className="text-brick">
            {error}.{' '}
            <Link to="/admin/forgot-password" className="underline">
              Request a new link
            </Link>
          </p>
        )}
      </form>
    </section>
  )
}
