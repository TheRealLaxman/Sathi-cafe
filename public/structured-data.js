const data = {
  '@context': 'https://schema.org',
  '@type': 'CafeOrCoffeeShop',
  name: 'Sathi Cafe',
  telephone: '+9779812312445',
  servesCuisine: ['Nepali', 'Coffee', 'Momo', 'Pizza', 'Burgers'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rajmarga Chauraha',
    addressLocality: 'Butwal',
    addressCountry: 'NP',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday',
    ],
    opens: '09:00',
    closes: '00:00',
  },
}

const script = document.createElement('script')
script.type = 'application/ld+json'
script.textContent = JSON.stringify(data)
document.head.appendChild(script)
