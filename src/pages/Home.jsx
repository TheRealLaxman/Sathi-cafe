import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import ItemPhoto from '../components/ItemPhoto'
import { api } from '../services/api'
import { menu as starterMenu } from '../data/menu'

const highlights = [
  {
    icon: '🫖',
    title: 'Chiya & Coffee',
    text: 'From masala chiya to cold coffee, brewed fresh.',
  },
  {
    icon: '🥟',
    title: 'Nepali x Western',
    text: 'Momo, pakauda, pizza and burgers under one roof.',
  },
  {
    icon: '🌿',
    title: 'Chill Vibes',
    text: 'A cosy, natural space to hang out with your sathi.',
  },
]

const ticker = [
  'Masala Chiya',
  'Jhol Momo',
  'Pyaj Pakauda',
  'Cappuccino',
  'Garlic Bread',
  'Margherita Pizza',
  'Cheese Burger',
  'Cold Coffee',
]

function Cup() {
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[16rem] mx-auto" aria-hidden="true">
      <g fill="none" stroke="var(--color-chai)" strokeWidth="5" strokeLinecap="round">
        <path className="steam" d="M80 62c-8-10 8-16 0-28" />
        <path className="steam" style={{ animationDelay: '0.8s' }} d="M100 62c-8-10 8-16 0-28" />
        <path className="steam" style={{ animationDelay: '1.6s' }} d="M120 62c-8-10 8-16 0-28" />
      </g>
      <path d="M52 84h96v34c0 26-20 44-48 44s-48-18-48-44z" fill="var(--color-chai)" />
      <path
        d="M148 94h12a16 16 0 0 1 0 32h-16"
        fill="none"
        stroke="var(--color-chai)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <ellipse cx="100" cy="84" rx="48" ry="8" fill="var(--color-ink)" opacity="0.85" />
      <ellipse cx="100" cy="176" rx="68" ry="9" fill="var(--color-leaf)" />
    </svg>
  )
}

function FloatingChip({ emoji, className, delay = '0s', rotate = '0deg' }) {
  return (
    <div
      className={`float absolute w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/80 border border-chai/15 shadow-md flex items-center justify-center text-3xl ${className}`}
      style={{ animationDelay: delay, '--r': rotate }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  )
}

export default function Home() {
  const [picks, setPicks] = useState(() =>
    starterMenu.filter((i) => i.tags?.includes('popular')).slice(0, 3)
  )

  useEffect(() => {
    api('/menu')
      .then((items) => {
        const popular = items.filter((i) => i.tags?.includes('popular'))
        setPicks((popular.length ? popular : items).slice(0, 3))
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <section className="max-w-6xl mx-auto px-5 py-12 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="text-center md:text-left">
          <p className="rise text-leaf font-medium tracking-widest uppercase text-sm mb-4">
            Your friendly corner cafe
          </p>

          <h1
            className="rise font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-tight"
            style={{ animationDelay: '0.1s' }}
          >
            Bring your <span className="text-chai">sathi</span>.
            <br />
            We'll bring the chiya.
          </h1>

          <p
            className="rise mt-6 text-base md:text-lg text-ink/70 max-w-md mx-auto md:mx-0"
            style={{ animationDelay: '0.2s' }}
          >
            Nepali flavours meet western comfort food, in a place made for hanging out.
          </p>

          <div
            className="rise mt-8 flex flex-wrap gap-4 justify-center md:justify-start"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              to="/menu"
              className="bg-chai text-cream px-7 py-3 rounded-full font-medium hover:bg-brick transition-colors"
            >
              View Menu
            </Link>
            <Link
              to="/contact"
              className="border-2 border-leaf text-leaf px-7 py-3 rounded-full font-medium hover:bg-leaf hover:text-cream transition-colors"
            >
              Reserve a Table
            </Link>
          </div>
        </div>

        <div className="rise relative mx-auto w-full max-w-sm aspect-square" style={{ animationDelay: '0.25s' }}>
          <div className="absolute inset-6 rounded-full bg-chai/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cup />
          </div>

          <FloatingChip emoji="🥟" className="top-2 left-2" rotate="-8deg" />
          <FloatingChip emoji="🍕" className="top-6 right-0" delay="1s" rotate="8deg" />
          <FloatingChip emoji="🥐" className="bottom-6 left-0" delay="2s" rotate="6deg" />
          <FloatingChip emoji="🍔" className="bottom-2 right-4" delay="3s" rotate="-6deg" />
        </div>
      </section>

      <div className="bg-chai text-cream overflow-hidden py-3 border-y border-ink/10" aria-hidden="true">
        <div className="marquee-track flex">
          {[...ticker, ...ticker].map((item, i) => (
            <span key={i} className="font-display text-lg font-bold whitespace-nowrap px-6">
              {item}
              <span className="text-cream/60 pl-6">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-5 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((h, i) => (
          <Reveal key={h.title} delay={i * 120}>
            <div className="h-full bg-white/60 rounded-2xl p-6 border border-chai/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-4xl mb-3">{h.icon}</div>
              <h3 className="font-display text-xl font-bold mb-1">{h.title}</h3>
              <p className="text-ink/70">{h.text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-leaf text-sm font-medium uppercase tracking-widest">Customer favourites</p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-chai mt-2">
              Popular right now
            </h2>
          </div>
          <Link to="/menu" className="text-chai font-medium hover:text-brick transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {picks.map((item, i) => (
            <Reveal key={item._id || item.id} delay={i * 120}>
              <div className="h-full bg-white/60 rounded-2xl overflow-hidden border border-chai/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <ItemPhoto item={item} />
                <div className="p-5">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-display text-xl font-bold">{item.name}</h3>
                    <span className="font-bold text-chai whitespace-nowrap">Rs. {item.price}</span>
                  </div>
                  <p className="text-ink/70 mt-2 text-sm">{item.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-4">
        <Reveal>
          <div className="relative overflow-hidden bg-ink text-cream rounded-3xl px-6 py-12 md:py-16 text-center">
            <div
              className="absolute top-0 inset-x-0 h-1.5"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--color-brick) 0 14px, var(--color-chai) 14px 28px, var(--color-leaf) 28px 42px)',
              }}
            />
            <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
              Got a free evening?
              <br />
              <span className="text-chai">Grab your sathi.</span>
            </h2>
            <p className="mt-4 text-cream/75 max-w-md mx-auto">
              Book a table in under a minute, and we'll have the chiya ready.
            </p>
            <Link
              to="/contact"
              className="inline-block mt-8 bg-chai text-cream px-8 py-3 rounded-full font-medium hover:bg-brick transition-colors"
            >
              Reserve a Table
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
