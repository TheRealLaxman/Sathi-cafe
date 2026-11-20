import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Menu from '../pages/Menu'
import { api } from '../services/api'

vi.mock('../services/api', () => ({ api: vi.fn() }))

const item = {
  _id: 'a'.repeat(24),
  name: 'Masala Chiya',
  price: 80,
  description: 'Spiced milk tea',
  tags: ['veg'],
  category: 'Tea & Chiya',
}

const order = {
  _id: 'b'.repeat(24),
  name: 'Aarav',
  phone: '9812345678',
  items: [{ name: 'Masala Chiya', price: 80, qty: 2 }],
  total: 160,
}

describe('Menu page', () => {
  beforeEach(() => {
    api.mockImplementation((path) => {
      if (path === '/menu') return Promise.resolve([item])
      if (path === '/orders') return Promise.resolve(order)
      return Promise.resolve([])
    })
  })

  it('adds items to a persistent cart', async () => {
    render(<Menu />)
    await screen.findByText('Masala Chiya')

    fireEvent.click(screen.getByText('Add to order'))
    fireEvent.click(screen.getByLabelText(`Add one ${item.name}`))

    expect(screen.getByText('2 items')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('sathi_cart'))[item._id].qty).toBe(2)
  })

  it('saves the order with the customer details and clears the cart', async () => {
    render(<Menu />)
    await screen.findByText('Masala Chiya')

    fireEvent.click(screen.getByText('Add to order'))
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }))
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Aarav' } })
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '9812345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save order' }))

    expect(await screen.findByText(/Order saved/)).toBeInTheDocument()
    expect(api).toHaveBeenCalledWith('/orders', {
      method: 'POST',
      body: {
        name: 'Aarav',
        phone: '9812345678',
        email: '',
        note: '',
        items: [{ id: item._id, qty: 1 }],
      },
    })
    expect(JSON.parse(localStorage.getItem('sathi_cart'))).toEqual({})
  })
})
