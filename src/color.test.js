import { describe, it, expect } from 'vitest'
import { shade, darken, lighten } from './color'

describe('color shading', () => {
  it('darkens a hex color toward black', () => {
    const out = darken('#6366f1', 0.5)
    expect(out).toMatch(/^#[0-9a-f]{6}$/)
    expect(parseInt(out.slice(1), 16)).toBeLessThan(parseInt('6366f1', 16))
  })

  it('lightens a hex color toward white', () => {
    const out = lighten('#333333', 0.5)
    expect(parseInt(out.slice(1), 16)).toBeGreaterThan(parseInt('333333', 16))
  })

  it('clamps channels and never overflows', () => {
    expect(lighten('#ffffff', 0.5)).toBe('#ffffff')
    expect(darken('#000000', 0.5)).toBe('#000000')
  })

  it('returns the input unchanged for non-hex values', () => {
    expect(shade('rebeccapurple', 0.2)).toBe('rebeccapurple')
    expect(shade('#fff', 0.2)).toBe('#fff')
  })

  it('accepts hex without a leading hash', () => {
    expect(shade('6366f1', 0)).toBe('#6366f1')
  })
})
