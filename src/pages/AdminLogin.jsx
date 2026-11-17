import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, setToken } from '../services/api'

const inputBase = 'w-full rounded-xl border bg-white/70 px-4 py-2.5 focus:outline-none'
const fieldClass = (error) =>
  `${inputBase} ${error ? 'border-brick' : 'border-chai/30 focus:border-chai'}`

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const notice = useLocation().state?.notice

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const found = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Please enter a valid email address'
    if (!password) found.password = 'Please enter your password'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } })
      setToken(token)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="max-w-sm mx-auto px-5 py-20">
      <form
        onSubmit={submit}
        noValidate
        className="bg-white/60 border border-chai/10 rounded-2xl p-6 space-y-4"
      >
        <h1 className="font-display text-3xl font-extrabold text-chai">Admin login</h1>
        {notice && <p className="text-leaf">{notice}</p>}

        <div>
          <input
            className={fieldClass(errors.email)}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors({ ...errors, email: '' })
            }}
          />
          {errors.email && <p className="text-sm text-brick mt-1">{errors.email}</p>}
        </div>

        <div>
          <input
            className={fieldClass(errors.password)}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors({ ...errors, password: '' })
            }}
          />
          {errors.password && <p className="text-sm text-brick mt-1">{errors.password}</p>}
        </div>

        <button className="w-full bg-chai text-cream py-2.5 rounded-full font-medium hover:bg-brick transition-colors">
          Log in
        </button>
        {error && <p className="text-brick">{error}</p>}

        <Link
          to="/admin/forgot-password"
          className="block text-sm text-chai hover:text-brick transition-colors"
        >
          Forgot password?
        </Link>
      </form>
    </section>
  )
}
