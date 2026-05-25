import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Recharts' ResponsiveContainer relies on ResizeObserver, which jsdom lacks.
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserver)

afterEach(() => {
  cleanup()
})
