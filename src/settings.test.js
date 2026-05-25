import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_VERSION,
  migrateSettings,
  loadSettings,
  saveSettings,
  resolveTheme,
  initialsFor,
} from './settings'

describe('settings schema', () => {
  it('has the expected default shape', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      version: SETTINGS_VERSION,
      businessName: expect.any(String),
      defaultTaxRate: expect.any(Number),
      defaultProcessor: 'stripe',
      currency: 'USD',
      theme: 'system',
    })
  })
})

describe('migrateSettings', () => {
  it('returns defaults for null or non-object input', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(migrateSettings('nope')).toEqual(DEFAULT_SETTINGS)
  })

  it('backfills missing keys from defaults and stamps the version', () => {
    const result = migrateSettings({ businessName: 'Acme', version: 0 })
    expect(result.businessName).toBe('Acme')
    expect(result.currency).toBe('USD')
    expect(result.version).toBe(SETTINGS_VERSION)
  })

  it('drops unknown legacy keys', () => {
    const result = migrateSettings({ businessName: 'Acme', legacyFoo: 'bar' })
    expect(result).not.toHaveProperty('legacyFoo')
  })
})

describe('loadSettings / saveSettings', () => {
  afterEach(() => localStorage.clear())

  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips saved settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, businessName: 'Maine Coffee Co', currency: 'CAD' })
    const loaded = loadSettings()
    expect(loaded.businessName).toBe('Maine Coffee Co')
    expect(loaded.currency).toBe('CAD')
  })

  it('recovers gracefully from corrupt stored JSON', () => {
    localStorage.setItem('feecalc.settings', '{not valid json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('resolveTheme', () => {
  afterEach(() => vi.restoreAllMocks())

  it('passes through explicit themes', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('resolves system to light when the OS does not prefer dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false })
    expect(resolveTheme('system')).toBe('light')
  })

  it('resolves system to dark when the OS prefers dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
    expect(resolveTheme('system')).toBe('dark')
  })
})

describe('initialsFor', () => {
  it('uses the first two words', () => {
    expect(initialsFor('Jack Bergin')).toBe('JB')
  })

  it('uses the first two letters of a single word', () => {
    expect(initialsFor('Acme')).toBe('AC')
  })

  it('falls back to a placeholder when empty', () => {
    expect(initialsFor('')).toBe('?')
    expect(initialsFor('   ')).toBe('?')
  })
})
