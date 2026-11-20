import { z } from 'zod'
import { ROLES } from './config/roles.js'

const email = z.string().trim().toLowerCase().email().max(120)
const name = z.string().trim().min(1).max(80)
const phone = z.string().trim().min(7).max(20)
const safeImage = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => !v || /^https:\/\/\S+$/i.test(v) || /^\/(images|uploads)\/[a-z0-9._-]+$/i.test(v),
    'Use an https link or an image path on this site'
  )

const slots = new Set()
// Build the set of allowed reservation time slots.
for (let mins = 9 * 60; mins <= 23 * 60 + 30; mins += 30) {
  slots.add(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`)
}

export const schemas = {
  login: z.object({
    email,
    password: z.string().min(1).max(200),
  }),

  forgot: z.object({ email }),

  reset: z.object({
    password: z.string().min(12).max(128),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(128),
  }),

  adminCreate: z.object({
    email,
    displayName: name.max(80).optional().default(''),
    role: z.enum(ROLES),
    password: z.string().min(12).max(128),
  }),

  adminUpdate: z
    .object({
      displayName: name.max(80).optional(),
      role: z.enum(ROLES).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'Nothing to update'),

  adminPasswordReset: z.object({
    password: z.string().min(12).max(128),
  }),

  menu: z.object({
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(50).refine((v) => v !== 'All', 'Choose a real category'),
    price: z.number().finite().nonnegative().max(100000),
    description: z.string().trim().max(500).default(''),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    image: safeImage.default(''),
    isAvailable: z.boolean().optional(),
  }),

  menuUpdate: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    category: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .refine((v) => v !== 'All', 'Choose a real category')
      .optional(),
    price: z.number().finite().nonnegative().max(100000).optional(),
    description: z.string().trim().max(500).optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    image: safeImage.optional(),
    isAvailable: z.boolean().optional(),
  }),

  reservation: z
    .object({
      name,
      phone,
      email: email.optional().or(z.literal('')),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
      time: z.string().refine((v) => slots.has(v), 'Choose an available time slot'),
      guests: z.number().int().min(1).max(20),
      note: z.string().trim().max(300).default(''),
    })
    .refine((v) => {
      const parsed = new Date(`${v.date}T${v.time}:00+05:45`)
      return !isNaN(parsed) && parsed.getTime() > Date.now()
    }, 'Please choose a future date and time'),

  reservationStatus: z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled']),
  }),

  message: z.object({
    name,
    email,
    message: z.string().trim().min(1).max(1000),
  }),

  order: z.object({
    name,
    phone,
    email: email.optional().or(z.literal('')),
    note: z.string().trim().max(300).default(''),
    items: z
      .array(
        z.object({
          id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid item'),
          qty: z.number().int().min(1).max(50),
        })
      )
      .min(1)
      .max(30),
  }),

  orderStatus: z.object({
    status: z.enum(['new', 'preparing', 'ready', 'completed', 'cancelled']),
  }),
}
