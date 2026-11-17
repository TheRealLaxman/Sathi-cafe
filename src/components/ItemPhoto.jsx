import { menuImages } from '../data/images'

const categoryEmoji = {
  Coffee: '☕',
  'Tea & Chiya': '🫖',
  'Nepali Snacks': '🧆',
  Momo: '🥟',
  Bakery: '🥖',
  'Pizza & Burgers': '🍕',
  'Cold Drinks': '🧋',
}

export default function ItemPhoto({ item }) {
  const src = item.image || menuImages[item.name]

  if (src) {
    return (
      <img
        src={src}
        alt={item.name}
        loading="lazy"
        className="w-full aspect-[4/3] object-cover"
      />
    )
  }

  return (
    <div className="w-full aspect-[4/3] bg-chai/10 flex items-center justify-center text-5xl">
      {categoryEmoji[item.category] || '🍽️'}
    </div>
  )
}
