// Minimal RFC-4180-ish CSV parser. Handles quoted fields, escaped "" quotes,
// commas/newlines inside quotes, CRLF or LF line endings, a leading BOM, and a
// trailing blank line. Returns { headers, rows } where rows excludes the header.

export function parseCsv(text) {
  if (typeof text !== 'string' || text.length === 0) return { headers: [], rows: [] }

  const records = []
  let record = []
  let field = ''
  let inQuotes = false
  let started = 0
  if (text.charCodeAt(0) === 0xfeff) started = 1 // strip BOM

  const pushField = () => {
    record.push(field)
    field = ''
  }
  const pushRecord = () => {
    pushField()
    records.push(record)
    record = []
  }

  for (let i = started; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      pushField()
    } else if (c === '\n') {
      pushRecord()
    } else if (c === '\r') {
      // swallow CR; the following LF (if any) ends the record
    } else {
      field += c
    }
  }
  // Flush the final field/record if the file did not end on a newline.
  if (field.length > 0 || record.length > 0) pushRecord()

  // Drop fully-empty records (e.g. a trailing blank line).
  const cleaned = records.filter((r) => !(r.length === 1 && r[0] === ''))
  if (cleaned.length === 0) return { headers: [], rows: [] }

  return {
    headers: cleaned[0].map((h) => h.trim()),
    rows: cleaned.slice(1),
  }
}
