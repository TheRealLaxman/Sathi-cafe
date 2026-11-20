import { useState } from 'react'
import { api } from '../services/api'
import { cafe, whatsappLink } from '../data/cafe'

const slots = []
for (let mins = 9 * 60; mins <= 23 * 60 + 30; mins += 30) {
  const h = Math.floor(mins / 60)
  const m = String(mins % 60).padStart(2, '0')
  const hour12 = h % 12 === 0 ? 12 : h % 12
  slots.push({
    value: `${String(h).padStart(2, '0')}:${m}`,
    label: `${hour12}:${m} ${h >= 12 ? 'PM' : 'AM'}`,
  })
}

const inputBase = 'w-full rounded-xl border bg-white/70 px-4 py-2.5 focus:outline-none'
const fieldClass = (error) =>
  `${inputBase} ${error ? 'border-brick' : 'border-chai/30 focus:border-chai'}`

const quickLink =
  'px-4 py-2 rounded-full border border-chai/30 text-sm font-medium hover:border-chai hover:text-chai transition-colors'

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
      {error ? (
        <span className="block text-sm text-brick mt-1">{error}</span>
      ) : (
        hint && <span className="block text-xs text-ink/50 mt-1">{hint}</span>
      )}
    </label>
  )
}

function Status({ status }) {
  if (!status) return null
  return <p className={status.ok ? 'text-leaf' : 'text-brick'} aria-live="polite">{status.text}</p>
}

function ReservationForm() {
  const empty = { name: '', phone: '', email: '', date: '', time: '', guests: 2, note: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [booked, setBooked] = useState(null)
  const [loading, setLoading] = useState(false)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: cafe.timezone })

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  // Check reservation fields before submitting.
  const validate = () => {
    const found = {}
    if (!form.name.trim()) found.name = 'Please enter your name'
    if (form.phone.replace(/\D/g, '').length < 7) found.phone = 'Please enter a valid phone number'
    if (!form.date) found.date = 'Please pick a date'
    else if (form.date < today) found.date = 'That date has already passed'
    if (!form.time) found.time = 'Please pick a time'
    else {
      const when = new Date(`${form.date}T${form.time}:00+05:45`)
      if (!isNaN(when) && when.getTime() <= Date.now()) found.time = 'That time has already passed'
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      found.email = 'Please enter a valid email address'
    }
    return found
  }

  // Submit the reservation request to the API.
  const submit = async (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setLoading(true)
    setStatus(null)
    setBooked(null)
    try {
      await api('/reservations', { method: 'POST', body: { ...form, guests: Number(form.guests) } })
      setBooked(form)
      setForm(empty)
    } catch (err) {
      setStatus({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  // Build WhatsApp text for a booking.
  const bookingText = (b) => {
    const timeLabel = slots.find((s) => s.value === b.time)?.label || b.time
    return [
      "Hello Sathi Cafe! I'd like to reserve a table.",
      '',
      `Name: ${b.name}`,
      `Phone: ${b.phone}`,
      b.email ? `Email: ${b.email}` : null,
      `Date: ${b.date}`,
      `Time: ${timeLabel}`,
      `Guests: ${b.guests}`,
      b.note ? `Note: ${b.note}` : null,
    ]
      .filter((line) => line !== null)
      .join('\n')
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-white/60 border border-chai/10 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-2xl font-bold">Reserve a table</h2>

      <Field label="Your name" error={errors.name}>
        <input
          className={fieldClass(errors.name)}
          name="name"
          placeholder="e.g. Aarav Sharma"
          value={form.name}
          onChange={change}
        />
      </Field>

      <Field label="Phone number" hint="We'll confirm your table by phone or WhatsApp" error={errors.phone}>
        <input
          className={fieldClass(errors.phone)}
          type="tel"
          name="phone"
          placeholder="98XXXXXXXX"
          value={form.phone}
          onChange={change}
        />
      </Field>

      <Field label="Email for confirmation (optional)" error={errors.email}>
        <input
          className={fieldClass(errors.email)}
          type="email"
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={change}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date" error={errors.date}>
          <input
            className={fieldClass(errors.date)}
            type="date"
            name="date"
            min={today}
            value={form.date}
            onChange={change}
          />
        </Field>
        <Field label="Time" error={errors.time}>
          <select className={fieldClass(errors.time)} name="time" value={form.time} onChange={change}>
            <option value="" disabled>Select a time</option>
            {slots.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="How many people?" hint="For bigger groups, send us a message">
        <select className={fieldClass()} name="guests" value={form.guests} onChange={change}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'person' : 'people'}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Anything we should know? (optional)">
        <textarea
          className={fieldClass()}
          name="note"
          rows="2"
          placeholder="Birthday, high chair, window seat..."
          value={form.note}
          onChange={change}
        />
      </Field>

      <button
        disabled={loading}
        className="w-full sm:w-auto bg-chai text-cream px-6 py-2.5 rounded-full font-medium hover:bg-brick transition-colors disabled:opacity-60"
      >
        {loading ? 'Sending...' : 'Request table'}
      </button>

      <Status status={status} />

      {booked && (
        <div className="rounded-xl bg-leaf/10 border border-leaf/30 p-4 space-y-3" role="status">
          <p className="text-leaf font-medium">Table requested! We'll confirm soon.</p>
          <p className="text-sm text-ink/70">
            For the fastest reply, send your details to us on WhatsApp too.
          </p>
          <a
            href={whatsappLink(bookingText(booked))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-leaf text-cream px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Send details on WhatsApp
          </a>
        </div>
      )}
    </form>
  )
}

function MessageForm() {
  const empty = { name: '', email: '', message: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  // Check message fields before submitting.
  const validate = () => {
    const found = {}
    if (!form.name.trim()) found.name = 'Please enter your name'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = 'Please enter a valid email address'
    if (!form.message.trim()) found.message = 'Please write a message'
    return found
  }

  // Submit the contact message to the API.
  const submit = async (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setLoading(true)
    setStatus(null)
    try {
      await api('/messages', { method: 'POST', body: form })
      setStatus({ ok: true, text: 'Thanks! We got your message.' })
      setForm(empty)
    } catch (err) {
      setStatus({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-white/60 border border-chai/10 rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-2xl font-bold">Say hello</h2>

      <Field label="Your name" error={errors.name}>
        <input className={fieldClass(errors.name)} name="name" value={form.name} onChange={change} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input
          className={fieldClass(errors.email)}
          type="email"
          name="email"
          value={form.email}
          onChange={change}
        />
      </Field>
      <Field label="Message" error={errors.message}>
        <textarea
          className={fieldClass(errors.message)}
          name="message"
          rows="5"
          value={form.message}
          onChange={change}
        />
      </Field>

      <button
        disabled={loading}
        className="w-full sm:w-auto bg-leaf text-cream px-6 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? 'Sending...' : 'Send message'}
      </button>
      <Status status={status} />
    </form>
  )
}

export default function Contact() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-12">
      <h1 className="font-display text-4xl md:text-5xl font-extrabold text-chai mb-3">Visit Us</h1>
      <p className="text-ink/70 mb-1">
        {cafe.address} · {cafe.landmark}
      </p>
      <p className="text-ink/70 mb-5">
        Open {cafe.hours[0].days.toLowerCase()}, {cafe.hours[0].time}
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        <a href={cafe.phoneHref} className={quickLink}>Call {cafe.phone}</a>
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={quickLink}>WhatsApp</a>
        <a href={cafe.social.instagram} target="_blank" rel="noopener noreferrer" className={quickLink}>Instagram</a>
        <a href={cafe.social.facebook} target="_blank" rel="noopener noreferrer" className={quickLink}>Facebook</a>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <ReservationForm />
        <MessageForm />
      </div>
    </section>
  )
}