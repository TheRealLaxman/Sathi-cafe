import { randomUUID } from 'node:crypto'
import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../app.js'
import User from '../models/User.js'
import MenuItem from '../models/MenuItem.js'
import { uploadDir } from '../config/uploads.js'

const withCsrf = (req) => req.set('X-Requested-With', 'XMLHttpRequest')
const created = []

async function loginAs(role) {
  const email = `${role}-upload@example.com`
  await User.create({
    email,
    role,
    passwordHash: await bcrypt.hash('password123', 10),
  })
  const res = await withCsrf(request(app).post('/api/auth/login')).send({ email, password: 'password123' })
  expect(res.status).toBe(200)
  return res.headers['set-cookie'].map((cookie) => cookie.split(';')[0]).join('; ')
}

async function makePhoto() {
  const name = `${randomUUID()}.webp`
  await writeFile(path.join(uploadDir, name), 'fake-image')
  created.push(name)
  return name
}

describe('upload deletion', () => {
  let contentCookie

  beforeEach(async () => {
    await mkdir(uploadDir, { recursive: true })
    contentCookie = await loginAs('content')
  })

  afterEach(async () => {
    await Promise.all(created.map((name) => unlink(path.join(uploadDir, name)).catch(() => {})))
    created.length = 0
  })

  it('deletes an unused uploaded photo', async () => {
    const name = await makePhoto()
    const res = await withCsrf(request(app).delete(`/api/uploads/${name}`)).set('Cookie', contentCookie)
    expect(res.status).toBe(200)
    await expect(access(path.join(uploadDir, name))).rejects.toThrow()
  })

  it('refuses to delete a photo used by a menu item', async () => {
    const name = await makePhoto()
    await MenuItem.create({ name: 'Chiya', category: 'Tea', price: 80, image: `/uploads/${name}` })

    const res = await withCsrf(request(app).delete(`/api/uploads/${name}`)).set('Cookie', contentCookie)
    expect(res.status).toBe(409)
    await expect(access(path.join(uploadDir, name))).resolves.toBeUndefined()
  })

  it('rejects invalid names, missing files and roles without upload access', async () => {
    expect((await withCsrf(request(app).delete('/api/uploads/bad.txt')).set('Cookie', contentCookie)).status).toBe(400)
    expect((await withCsrf(request(app).delete(`/api/uploads/${randomUUID()}.webp`)).set('Cookie', contentCookie)).status).toBe(404)

    const kitchenCookie = await loginAs('kitchen')
    const name = await makePhoto()
    expect((await withCsrf(request(app).delete(`/api/uploads/${name}`)).set('Cookie', kitchenCookie)).status).toBe(403)
  })
})
