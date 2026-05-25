import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingModal from './OnboardingModal'
import { DEFAULT_SETTINGS } from '../settings'

describe('OnboardingModal', () => {
  it('starts with an empty business name when the default placeholder is set', () => {
    render(<OnboardingModal initial={DEFAULT_SETTINGS} onComplete={() => {}} />)
    expect(screen.getByLabelText(/Business Name/i)).toHaveValue('')
  })

  it('submits the collected values', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<OnboardingModal initial={DEFAULT_SETTINGS} onComplete={onComplete} />)

    await user.type(screen.getByLabelText(/Business Name/i), 'Maine Coffee Co')
    await user.selectOptions(screen.getByLabelText(/Processor/i), 'toast')
    await user.click(screen.getByRole('button', { name: /Get Started/i }))

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ businessName: 'Maine Coffee Co', defaultProcessor: 'toast' })
    )
  })

  it('falls back to a default name when left blank', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<OnboardingModal initial={DEFAULT_SETTINGS} onComplete={onComplete} />)

    await user.click(screen.getByRole('button', { name: /Get Started/i }))
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ businessName: 'Your Business' })
    )
  })
})
