import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import AdminDashboard from '../pages/AdminDashboard'

const res = (body) => ({ ok: true, status: 200, json: async () => body })

describe('AdminDashboard', () => {
  it('shows only tabs the signed-in role can access', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url === '/api/auth/me') {
          return res({
            id: '000000000000000000000001',
            email: 'kitchen@example.com',
            role: 'kitchen',
            permissions: ['orders:read', 'orders:write'],
          })
        }
        return res([])
      })
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(await screen.findByRole('button', { name: 'Orders' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reservations' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Messages' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Staff' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Activity' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Account' })).toBeTruthy()
  })
})
