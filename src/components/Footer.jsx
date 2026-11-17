import { cafe, whatsappLink } from '../data/cafe'

const link = 'hover:text-cream transition-colors'

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/80 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-10 grid gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl text-cream">{cafe.name}</p>
          <p className="mt-2">Chiya, coffee, momo and good company.</p>
        </div>

        <div>
          <p className="font-bold text-cream mb-2">Find us</p>
          <p>{cafe.address}</p>
          <p className="text-cream/60">{cafe.landmark}</p>
        </div>

        <div>
          <p className="font-bold text-cream mb-2">Open</p>
          {cafe.hours.map((h) => (
            <p key={h.days}>{h.days}: {h.time}</p>
          ))}
          <p className="mt-2">
            <a href={cafe.phoneHref} className={link}>{cafe.phone}</a>
          </p>
        </div>

        <div>
          <p className="font-bold text-cream mb-2">Follow & chat</p>
          <ul className="space-y-1">
            <li><a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp</a></li>
            <li><a href={cafe.social.instagram} target="_blank" rel="noopener noreferrer" className={link}>Instagram</a></li>
            <li><a href={cafe.social.facebook} target="_blank" rel="noopener noreferrer" className={link}>Facebook</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} {cafe.name}
      </div>
    </footer>
  )
}
