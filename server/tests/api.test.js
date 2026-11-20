import bcrypt from 'bcryptjs'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import app from '../app.js'
import MenuItem from '../models/MenuItem.js'
import Order from '../models/Order.js'
import Reservation from '../models/Reservation.js'
import User from '../models/User.js'

const withCsrf = (req) => req.set('X-Requested-With', 'XMLHttpRequest')

async function login() {
  const res = await withCsrf(request(app).post('/api/auth/login')).send({
    email: 'admin@example.com',
    password: 'password123',
  })
  expect(res.status).toBe(200)
  return res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ')
}

beforeEach(async () => {
  await User.create({
    email: 'admin@example.com',
    passwordHash: await bcrypt.hash('password123', 10),
    role: 'owner',
  })
})

describe('Sathi Cafe API', () => {
  it('reports a healthy database', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('protects admin routes with a cookie session', async () => {
    const cookie = await login()

    expect((await request(app).get('/api/menu/admin/all')).status).toBe(401)
    expect((await request(app).post('/api/menu').send({ name: 'x' })).status).toBe(403)

    const ok = await withCsrf(request(app).get('/api/menu/admin/all')).set('Cookie', cookie)
    expect(ok.status).toBe(200)

    const logout = await withCsrf(request(app).post('/api/auth/logout')).set('Cookie', cookie)
    expect(logout.status).toBe(200)
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401)
  })

  it('lists only available items publicly and allows full admin editing', async () => {
    const hidden = await MenuItem.create({
      name: 'Hidden', category: 'Coffee', price: 100, isAvailable: false,
    })
    expect(hidden.isAvailable).toBe(false)
    await MenuItem.create({ name: 'Chiya', category: 'Tea & Chiya', price: 80 })

    const publicList = await request(app).get('/api/menu')
    expect(publicList.body).toHaveLength(1)
    expect(publicList.body[0].name).toBe('Chiya')

    const cookie = await login()
    const created = await withCsrf(request(app).post('/api/menu'))
      .set('Cookie', cookie)
      .send({ name: 'Selroti', category: 'Nepali Snacks', price: 60, tags: ['veg'] })
    expect(created.status).toBe(201)

    const updated = await withCsrf(request(app).put(`/api/menu/${created.body._id}`))
      .set('Cookie', cookie)
      .send({ name: 'Selroti', description: 'Crispy', isAvailable: false })
    expect(updated.body.description).toBe('Crispy')
    expect(updated.body.isAvailable).toBe(false)
  })

  it('prices an order on the server, never from the client', async () => {
    const item = await MenuItem.create({ name: 'Chiya', category: 'Tea & Chiya', price: 80 })
    const cookie = await login()

    const res = await withCsrf(request(app).post('/api/orders'))
      .send({
        name: 'Aarav',
        phone: '9812345678',
        items: [{ id: item._id.toString(), qty: 2, price: 1 }],
      })

    expect(res.status).toBe(201)
    expect(res.body.total).toBe(160)
    expect(res.body.items[0].price).toBe(80)
    expect((await Order.countDocuments())).toBe(1)

    const adminList = await withCsrf(request(app).get('/api/orders')).set('Cookie', cookie)
    expect(adminList.body).toHaveLength(1)
  })

  it('validates reservations and blocks duplicates', async () => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' })
    const body = { name: 'Aarav', phone: '9812345678', date, time: '10:00', guests: 2 }

    const first = await withCsrf(request(app).post('/api/reservations')).send(body)
    expect(first.status).toBe(201)

    const duplicate = await withCsrf(request(app).post('/api/reservations')).send(body)
    expect(duplicate.status).toBe(409)

    const past = await withCsrf(request(app).post('/api/reservations')).send({ ...body, date: '2020-01-01' })
    expect(past.status).toBe(400)

    const cookie = await login()
    const missing = await withCsrf(request(app).patch('/api/reservations/000000000000000000000000'))
      .set('Cookie', cookie)
      .send({ status: 'confirmed' })
    expect(missing.status).toBe(404)

    const created = await Reservation.findOne()
    const patch = await withCsrf(request(app).patch(`/api/reservations/${created._id}`))
      .set('Cookie', cookie)
      .send({ status: 'confirmed' })
    expect(patch.body.status).toBe('confirmed')
  })

  it('stores contact messages', async () => {
    const res = await withCsrf(request(app).post('/api/messages')).send({
      name: 'Aarav', email: 'aarav@example.com', message: 'Hello!',
    })
    expect(res.status).toBe(201)
    expect(await request(app).get('/api/messages').then((r) => r.status)).toBe(401)
  })
})
