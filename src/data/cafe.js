export const cafe = {
  name: 'Sathi Cafe',
  address: 'Rajmarga Chauraha, Butwal',
  landmark: 'The old Flair 99 spot, now Sathi Cafe',
  phone: '9812312445',
  phoneHref: 'tel:+9779812312445',
  timezone: 'Asia/Kathmandu',
  hours: [{ days: 'Every day', time: '9:00 AM to 12:00 AM' }],
  whatsappNumber: '9779821401563',
  social: {
    // replace with the real page links once the client creates them
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
  },
}

export const whatsappLink = (text = '') =>
  `https://wa.me/${cafe.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`