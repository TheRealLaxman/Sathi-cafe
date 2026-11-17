import { Link } from 'react-router-dom'
import { cafe, whatsappLink } from '../data/cafe'

const values = [
  { icon: '🫖', title: 'Nepali at heart', text: 'Masala chiya, pakauda and momo, made the way we grew up eating them.' },
  { icon: '🍕', title: 'Western comfort', text: 'Coffee, fresh bakes, pizza and burgers for when you want something familiar.' },
  { icon: '🌿', title: 'Come as you are', text: 'No dress code, no rush. Study, chat, laugh, or just sit with your sathi.' },
]

const nepali = ['Masala chiya', 'Pyaj pakauda', 'Jhol & fried momo', 'Chatpate and snacks']
const western = ['Coffee & cold brews', 'Fresh breads & bakery', 'Wood-fired style pizza', 'Juicy burgers']

export default function About() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-10 md:pt-20 text-center">
        <p className="text-leaf font-medium tracking-widest uppercase text-sm mb-3">Our story</p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
          Sathi aka <span className="text-chai">friend</span>.
        </h1>
        <p className="mt-6 text-base md:text-lg text-ink/75 max-w-2xl mx-auto leading-relaxed">
          We wanted a place where a plate of momo and a cappuccino can share the same table,
          and where everyone from school friends to college crews feels at home. Sathi Cafe is
          that place: relaxed, friendly and full of good food.
        </p>
      </section>

      <div
        className="mx-5 h-1.5 rounded-full"
        style={{
          background:
            'repeating-linear-gradient(90deg, var(--color-brick) 0 14px, var(--color-chai) 14px 28px, var(--color-leaf) 28px 42px)',
        }}
      />

      <section className="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {values.map((v) => (
          <div key={v.title} className="bg-white/60 rounded-2xl p-6 border border-chai/10">
            <div className="text-4xl mb-3">{v.icon}</div>
            <h3 className="font-display text-xl font-bold mb-1">{v.title}</h3>
            <p className="text-ink/70">{v.text}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-12">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-8">
          Two kitchens, <span className="text-chai">one table</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-chai text-cream rounded-3xl p-7">
            <h3 className="font-display text-2xl font-bold mb-4">From our Nepali side</h3>
            <ul className="space-y-2">
              {nepali.map((i) => <li key={i} className="flex gap-2"><span>•</span>{i}</li>)}
            </ul>
          </div>
          <div className="bg-leaf text-cream rounded-3xl p-7">
            <h3 className="font-display text-2xl font-bold mb-4">From our western side</h3>
            <ul className="space-y-2">
              {western.map((i) => <li key={i} className="flex gap-2"><span>•</span>{i}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5">
        <div className="bg-ink text-cream rounded-3xl p-7 md:p-10 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-bold mb-3">Opening hours</h3>
            {cafe.hours.map((h) => (
              <p key={h.days} className="text-cream/80">{h.days}: {h.time}</p>
            ))}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold mb-3">Find us</h3>
            <p className="text-cream/80">{cafe.address}</p>
            <p className="text-cream/60 text-sm">{cafe.landmark}</p>
            <p className="mt-2">
              <a href={cafe.phoneHref} className="text-cream/80 hover:text-cream transition-colors">
                {cafe.phone}
              </a>
            </p>
            <p className="mt-1">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream/80 hover:text-cream transition-colors"
              >
                Chat on WhatsApp
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end md:justify-center">
            <Link to="/contact" className="bg-chai text-cream text-center px-6 py-3 rounded-full font-medium hover:bg-brick transition-colors">
              Reserve a table
            </Link>
            <Link to="/menu" className="border border-cream/40 text-center px-6 py-3 rounded-full font-medium hover:bg-cream hover:text-ink transition-colors">
              See the menu
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
