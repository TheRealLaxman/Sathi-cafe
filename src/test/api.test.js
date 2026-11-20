import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../services/api'

const res = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('sends cookies and the CSRF header', async () => {
    fetch.mockResolvedValueOnce(res(200, { ok: true }))
    await expect(api('/config')).resolves.toEqual({ ok: true })

    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/config')
    expect(options.credentials).toBe('include')
    expect(options.headers['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('refreshes an expired session once and retries', async () => {
    fetch
      .mockResolvedValueOnce(res(401, { message: 'expired' }))
      .mockResolvedValueOnce(res(200, { email: 'a@b.com' }))
      .mockResolvedValueOnce(res(200, [{ name: 'Chiya' }]))

    await expect(api('/menu')).resolves.toEqual([{ name: 'Chiya' }])
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch.mock.calls[1][0]).toBe('/api/auth/refresh')
  })

  it('refreshes when the session check returns 401', async () => {
    fetch
      .mockResolvedValueOnce(res(401, { message: 'expired' }))
      .mockResolvedValueOnce(res(200, { email: 'a@b.com' }))
      .mockResolvedValueOnce(res(200, { email: 'a@b.com' }))

    await expect(api('/auth/me')).resolves.toEqual({ email: 'a@b.com' })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('signals unauthorized when refresh fails', async () => {
    const listener = vi.fn()
    window.addEventListener('sathi:unauthorized', listener)
    fetch.mockResolvedValue(res(401, { message: 'expired' }))

    await expect(api('/menu')).rejects.toThrow()
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('sathi:unauthorized', listener)
  })
})
