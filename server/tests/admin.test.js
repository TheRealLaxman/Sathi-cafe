import bcrypt from 'bcryptjs'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import app from '../app.js'
import User from '../models/User.js'
import MenuItem from '../models/MenuItem.js'

const withCsrf = (req) => req.set('X-Requested-With', 'XMLHttpRequest')
const as = (req, cookie) => withCsrf(req).set('Cookie', cookie)

async function createAdmin(email, role, password = 'password123') {
  return User.create({
    email,
    role,
    passwordHash: await bcrypt.hash(password, 10),
    isActive: true,
  })
}

async function loginAs(email, password = 'password123') {
  const res = await withCsrf(request(app).post('/api/auth/login')).send({ email, password })
  expect(res.status).toBe(200)
  return res.headers['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ')
}

describe('roles and admin management', () => {
  let owner
  let ownerCookie

  beforeEach(async () => {
    owner = await createAdmin('owner@example.com', 'owner')
    ownerCookie = await loginAs('owner@example.com')
  })

  it('returns identity and permissions from /auth/me', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', ownerCookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ email: 'owner@example.com', role: 'owner' })
    expect(res.body.permissions).toContain('admins:write')
  })

  it('limits Kitchen to orders', async () => {
    await createAdmin('kitchen@example.com', 'kitchen')
    const cookie = await loginAs('kitchen@example.com')

    expect((await as(request(app).get('/api/orders'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/reservations'), cookie)).status).toBe(403)
    expect((await as(request(app).get('/api/messages'), cookie)).status).toBe(403)
    expect((await as(request(app).get('/api/menu/admin/all'), cookie)).status).toBe(403)
    expect((await as(request(app).delete('/api/orders/000000000000000000000000'), cookie)).status).toBe(403)

    const patched = await as(request(app).patch('/api/orders/000000000000000000000000'), cookie).send({
      status: 'preparing',
    })
    expect(patched.status).toBe(404)
  })

  it('limits Front Desk to reservations and messages', async () => {
    await createAdmin('desk@example.com', 'front-desk')
    const cookie = await loginAs('desk@example.com')

    expect((await as(request(app).get('/api/reservations'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/messages'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/orders'), cookie)).status).toBe(403)
    expect((await as(request(app).delete('/api/reservations/000000000000000000000000'), cookie)).status).toBe(403)

    const patched = await as(request(app).patch('/api/reservations/000000000000000000000000'), cookie).send({
      status: 'confirmed',
    })
    expect(patched.status).toBe(404)
  })

  it('limits Content to menu and uploads', async () => {
    await createAdmin('content@example.com', 'content')
    const cookie = await loginAs('content@example.com')

    expect((await as(request(app).get('/api/menu/admin/all'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/uploads'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/orders'), cookie)).status).toBe(403)
    expect((await as(request(app).get('/api/admins'), cookie)).status).toBe(403)

    const created = await as(request(app).post('/api/menu'), cookie).send({
      name: 'Chiya', category: 'Tea & Chiya', price: 80,
    })
    expect(created.status).toBe(201)
    expect(await MenuItem.countDocuments()).toBe(1)
  })

  it('gives Managers operations and staff management but not owner management', async () => {
    await createAdmin('manager@example.com', 'manager')
    const cookie = await loginAs('manager@example.com')

    expect((await as(request(app).get('/api/orders'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/admins'), cookie)).status).toBe(200)
    expect((await as(request(app).get('/api/audit'), cookie)).status).toBe(200)

    const staff = await as(request(app).post('/api/admins'), cookie).send({
      email: 'new-staff@example.com', role: 'kitchen', password: 'strongpass123',
    })
    expect(staff.status).toBe(201)

    const ownerRole = await as(request(app).post('/api/admins'), cookie).send({
      email: 'other-owner@example.com', role: 'owner', password: 'strongpass123',
    })
    expect(ownerRole.status).toBe(403)

    const targetOwner = await as(request(app).patch(`/api/admins/${owner._id}`), cookie).send({ role: 'manager' })
    expect(targetOwner.status).toBe(403)
  })

  it('creates, updates and deactivates admins with immediate session revocation', async () => {
    const created = await as(request(app).post('/api/admins'), ownerCookie).send({
      email: 'staff@example.com', displayName: 'Staff', role: 'front-desk', password: 'strongpass123',
    })
    expect(created.status).toBe(201)

    const duplicate = await as(request(app).post('/api/admins'), ownerCookie).send({
      email: 'staff@example.com', role: 'kitchen', password: 'strongpass123',
    })
    expect(duplicate.status).toBe(409)

    const staffCookie = await loginAs('staff@example.com', 'strongpass123')
    const changed = await as(request(app).patch(`/api/admins/${created.body.id}`), ownerCookie).send({ role: 'kitchen' })
    expect(changed.status).toBe(200)
    expect(changed.body.role).toBe('kitchen')
    expect((await request(app).get('/api/auth/me').set('Cookie', staffCookie)).status).toBe(401)
    expect((await withCsrf(request(app).post('/api/auth/refresh')).set('Cookie', staffCookie)).status).toBe(401)

    const deactivated = await as(request(app).patch(`/api/admins/${created.body.id}`), ownerCookie).send({ isActive: false })
    expect(deactivated.status).toBe(200)
    expect((await withCsrf(request(app).post('/api/auth/login')).send({
      email: 'staff@example.com', password: 'strongpass123',
    })).status).toBe(403)
  })

  it('prevents an owner from changing their own role through Staff', async () => {
    const res = await as(request(app).patch(`/api/admins/${owner._id}`), ownerCookie).send({ role: 'manager' })
    expect(res.status).toBe(400)
  })

  it('permanently deletes an admin and invalidates its sessions', async () => {
    const created = await as(request(app).post('/api/admins'), ownerCookie).send({
      email: 'delete-me@example.com', role: 'content', password: 'strongpass123',
    })
    expect(created.status).toBe(201)
    const staffCookie = await loginAs('delete-me@example.com', 'strongpass123')
    expect((await request(app).get('/api/auth/me').set('Cookie', staffCookie)).status).toBe(200)

    const deleted = await as(request(app).delete(`/api/admins/${created.body.id}`), ownerCookie)
    expect(deleted.status).toBe(200)
    expect(await User.findById(created.body.id)).toBeNull()
    expect((await request(app).get('/api/auth/me').set('Cookie', staffCookie)).status).toBe(401)
    expect((await withCsrf(request(app).post('/api/auth/refresh')).set('Cookie', staffCookie)).status).toBe(401)
    expect((await withCsrf(request(app).post('/api/auth/login')).send({
      email: 'delete-me@example.com', password: 'strongpass123',
    })).status).toBe(401)
  })

  it('blocks self-deletion and deleting accounts outside your role scope', async () => {
    expect((await as(request(app).delete(`/api/admins/${owner._id}`), ownerCookie)).status).toBe(400)

    await createAdmin('manager2@example.com', 'manager')
    const managerCookie = await loginAs('manager2@example.com')
    const staff = await createAdmin('limited@example.com', 'kitchen')
    expect((await as(request(app).delete(`/api/admins/${staff._id}`), managerCookie)).status).toBe(200)
    expect(await User.findById(staff._id)).toBeNull()
    expect((await as(request(app).delete(`/api/admins/${owner._id}`), managerCookie)).status).toBe(403)
    expect((await as(request(app).delete('/api/admins/not-an-id'), ownerCookie)).status).toBe(400)
  })

  it('prevents deleting the last active owner', async () => {
    expect((await as(request(app).delete(`/api/admins/${owner._id}`), ownerCookie)).status).toBe(400)

    const second = await as(request(app).post('/api/admins'), ownerCookie).send({
      email: 'second-owner@example.com', role: 'owner', password: 'strongpass123',
    })
    expect(second.status).toBe(201)
    expect((await as(request(app).delete(`/api/admins/${second.body.id}`), ownerCookie)).status).toBe(200)
    expect((await as(request(app).delete(`/api/admins/${owner._id}`), ownerCookie)).status).toBe(400)
  })

  it('records admin deletion in the activity log', async () => {
    const created = await as(request(app).post('/api/admins'), ownerCookie).send({
      email: 'logged@example.com', role: 'front-desk', password: 'strongpass123',
    })
    expect(created.status).toBe(201)
    expect((await as(request(app).delete(`/api/admins/${created.body.id}`), ownerCookie)).status).toBe(200)

    const log = await as(request(app).get('/api/audit?limit=20'), ownerCookie)
    expect(log.status).toBe(200)
    expect(log.body.items.some((entry) =>
      entry.action === 'admin.delete' && entry.target.email === 'logged@example.com'
    )).toBe(true)
  })

  it('changes a password only with the current one and revokes sessions', async () => {
    const wrong = await as(request(app).post('/api/auth/change-password'), ownerCookie).send({
      currentPassword: 'wrong-password', newPassword: 'new-strong-pass',
    })
    expect(wrong.status).toBe(400)

    const ok = await as(request(app).post('/api/auth/change-password'), ownerCookie).send({
      currentPassword: 'password123', newPassword: 'new-strong-pass',
    })
    expect(ok.status).toBe(200)
    expect((await request(app).get('/api/auth/me').set('Cookie', ownerCookie)).status).toBe(401)
    expect((await loginAs('owner@example.com', 'new-strong-pass'))).toBeTruthy()
  })

  it('records admin actions in the activity log', async () => {
    const created = await as(request(app).post('/api/admins'), ownerCookie).send({
      email: 'logger@example.com', role: 'content', password: 'strongpass123',
    })
    expect(created.status).toBe(201)

    const log = await as(request(app).get('/api/audit?limit=20'), ownerCookie)
    expect(log.status).toBe(200)
    expect(log.body.items.some((entry) => entry.action === 'admin.create')).toBe(true)
    expect(log.body.items.some((entry) => entry.action === 'auth.login')).toBe(true)

    await createAdmin('viewer@example.com', 'kitchen')
    const viewer = await loginAs('viewer@example.com')
    expect((await as(request(app).get('/api/audit'), viewer)).status).toBe(403)
  })
})
