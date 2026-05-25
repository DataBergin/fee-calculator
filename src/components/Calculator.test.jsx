import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from './Calculator'

describe('Calculator', () => {
  it('renders the core form fields', () => {
    render(<Calculator onCalculate={() => {}} loading={false} />)
    expect(screen.getByLabelText(/Selling Price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cost of Goods/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Shipping Cost/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Sales Tax Rate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Units Sold Per Month/i)).toBeInTheDocument()
  })

  it('submits parsed numeric values to onCalculate', async () => {
    const user = userEvent.setup()
    const onCalculate = vi.fn()
    render(<Calculator onCalculate={onCalculate} loading={false} />)

    await user.type(screen.getByLabelText(/Selling Price/i), '29.99')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '10')
    await user.type(screen.getByLabelText(/Shipping Cost/i), '5')
    await user.type(screen.getByLabelText(/Sales Tax Rate/i), '5.5')
    await user.type(screen.getByLabelText(/Units Sold Per Month/i), '100')
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    expect(onCalculate).toHaveBeenCalledTimes(1)
    expect(onCalculate).toHaveBeenCalledWith({
      item_price: 29.99,
      cost_of_goods: 10,
      shipping_cost: 5,
      tax_rate: 5.5,
      processor: 'stripe',
      transaction_type: 'online',
      monthly_units: 100,
      tip_amount: 0,
      tip_passthrough: true,
    })
  })

  it('includes a pass-through tip in the payload', async () => {
    const user = userEvent.setup()
    const onCalculate = vi.fn()
    render(<Calculator onCalculate={onCalculate} loading={false} />)

    await user.type(screen.getByLabelText(/Selling Price/i), '10')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '4')
    await user.type(screen.getByLabelText(/Tip Amount/i), '3')
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    expect(onCalculate).toHaveBeenCalledWith(
      expect.objectContaining({ tip_amount: 3, tip_passthrough: true })
    )
  })

  it('applies a Maine tax preset to the rate field', async () => {
    const user = userEvent.setup()
    const onCalculate = vi.fn()
    render(<Calculator onCalculate={onCalculate} loading={false} />)

    await user.type(screen.getByLabelText(/Selling Price/i), '10')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '4')
    await user.selectOptions(screen.getByLabelText(/Common Maine tax rates/i), '8')
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    expect(onCalculate).toHaveBeenCalledWith(expect.objectContaining({ tax_rate: 8 }))
  })

  it('defaults empty optional fields to 0', async () => {
    const user = userEvent.setup()
    const onCalculate = vi.fn()
    render(<Calculator onCalculate={onCalculate} loading={false} />)

    await user.type(screen.getByLabelText(/Selling Price/i), '10')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '4')
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    expect(onCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping_cost: 0,
        tax_rate: 0,
        monthly_units: 0,
      })
    )
  })

  it('switches the selected payment processor', async () => {
    const user = userEvent.setup()
    const onCalculate = vi.fn()
    render(<Calculator onCalculate={onCalculate} loading={false} />)

    await user.type(screen.getByLabelText(/Selling Price/i), '10')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '4')
    await user.click(screen.getByRole('radio', { name: /Toast/i }))
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    expect(onCalculate).toHaveBeenCalledWith(expect.objectContaining({ processor: 'toast' }))
  })

  it('switches the transaction type', async () => {
    const user = userEvent.setup()
    const onCalculate = vi.fn()
    render(<Calculator onCalculate={onCalculate} loading={false} />)

    await user.type(screen.getByLabelText(/Selling Price/i), '10')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '4')
    await user.click(screen.getByRole('radio', { name: /In-Person/i }))
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    expect(onCalculate).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_type: 'in_person' })
    )
  })

  it('disables the button and shows a loading label while calculating', () => {
    render(<Calculator onCalculate={() => {}} loading={true} />)
    const btn = screen.getByRole('button', { name: /Calculating/i })
    expect(btn).toBeDisabled()
  })
})
