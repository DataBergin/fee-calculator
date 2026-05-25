// Persisted user settings with a versioned schema and graceful migration.

export const SETTINGS_VERSION = 1
export const STORAGE_KEY = 'feecalc.settings'

export const DEFAULT_SETTINGS = {
  version: SETTINGS_VERSION,
  businessName: 'Your Business',
  defaultTaxRate: 5.5,
  defaultProcessor: 'stripe',
  currency: 'USD',
  theme: 'system', // 'system' | 'light' | 'dark'
  primaryColor: '#6366f1',
  logo: '', // base64 data URL, or '' for the default mark
  onboarded: false,
}

// Merge stored settings onto the current defaults so missing or legacy keys are
// backfilled, then stamp the current version. Unknown stored keys are dropped.
export function migrateSettings(stored) {
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_SETTINGS }
  }
  const merged = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key === 'version') continue
    if (stored[key] !== undefined && stored[key] !== null) {
      merged[key] = stored[key]
    }
  }
  merged.version = SETTINGS_VERSION
  return merged
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return migrateSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrateSettings(settings)))
  } catch {
    // localStorage may be unavailable (private mode / quota); ignore.
  }
}

// Resolve a theme preference to a concrete 'light' | 'dark', honoring the OS
// setting when the preference is 'system'.
export function resolveTheme(theme) {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return theme === 'dark' ? 'dark' : 'light'
}

export function initialsFor(businessName) {
  const words = (businessName || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
