import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../hooks/useAuth'

const res = (body) => ({ ok: true, status: 200, json: async () => body })

function Consumer() {
  const { user, loading, can } = useAuth()
  if (loading) return <p>loading</p>
  return (
    <div>
      <p>{user?.role}</p>
      <p>{can('orders:read') ? 'can-orders' : 'no-orders'}</p>
      <p>{can('admins:write') ? 'can-staff' : 'no-staff'}</p>
    </div>
  )
}

describe('AuthContext', () => {
  it('exposes identity and permissions from /auth/me', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        res({ email: 'kitchen@example.com', role: 'kitchen', permissions: ['orders:read', 'orders:write'] })
      )
    )

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(await screen.findByText('kitchen')).toBeTruthy()
    expect(screen.getByText('can-orders')).toBeTruthy()
    expect(screen.getByText('no-staff')).toBeTruthy()
  })
})
