// Adjust a #rrggbb hex color's lightness. Positive amount darkens, negative
// lightens. Returns the input unchanged if it is not a 6-digit hex.
export function shade(hex, amount) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return hex
  const num = parseInt(match[1], 16)
  const channels = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
  const adjusted = channels.map((v) => {
    const next = Math.round(v * (1 - amount))
    return Math.min(255, Math.max(0, next))
  })
  return '#' + adjusted.map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function darken(hex, amount = 0.15) {
  return shade(hex, amount)
}

export function lighten(hex, amount = 0.15) {
  return shade(hex, -amount)
}
