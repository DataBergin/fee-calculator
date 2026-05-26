import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportAnalysis from './ImportAnalysis'

function csvFile(text, name = 'sales.csv') {
  return new File([text], name, { type: 'text/csv' })
}

describe('ImportAnalysis', () => {
  it('imports a CSV, auto-maps columns, and shows the effective rate', async () => {
    const user = userEvent.setup()
    render(<ImportAnalysis currency="USD" />)

    const file = csvFile('Amount,Fee\n10.00,0.60\n30.00,1.20\n60.00,2.00')
    await user.upload(screen.getByLabelText(/Sales CSV/i), file)

    // mapping UI appears once parsed
    const analyze = await screen.findByRole('button', { name: /^Analyze$/i })
    await user.click(analyze)

    // 3.80 / 100 * 100 = 3.80%
    expect(await screen.findByText('3.80%')).toBeInTheDocument()
    expect(screen.getByText('$3.80')).toBeInTheDocument() // total fees
    expect(screen.getByText(/Card volume/i)).toBeInTheDocument()
  })

  it('shows an error when the amount column has no numeric data', async () => {
    const user = userEvent.setup()
    render(<ImportAnalysis currency="USD" />)

    await user.upload(screen.getByLabelText(/Sales CSV/i), csvFile('Amount\nabc\ndef'))
    await user.click(await screen.findByRole('button', { name: /^Analyze$/i }))

    expect(await screen.findByText(/No valid transaction amounts/i)).toBeInTheDocument()
  })
})
