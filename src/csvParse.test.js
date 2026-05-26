import { describe, it, expect } from 'vitest'
import { parseCsv } from './csvParse'

describe('parseCsv', () => {
  it('parses simple rows and a header', () => {
    const { headers, rows } = parseCsv('Amount,Fee\n10.00,0.59\n5.00,0.45')
    expect(headers).toEqual(['Amount', 'Fee'])
    expect(rows).toEqual([
      ['10.00', '0.59'],
      ['5.00', '0.45'],
    ])
  })

  it('handles quoted fields with commas and escaped quotes', () => {
    const { headers, rows } = parseCsv('Item,Amount\n"Latte, large","4.50"\n"He said ""hi""",2.00')
    expect(headers).toEqual(['Item', 'Amount'])
    expect(rows[0]).toEqual(['Latte, large', '4.50'])
    expect(rows[1]).toEqual(['He said "hi"', '2.00'])
  })

  it('handles CRLF line endings and a trailing blank line', () => {
    const { rows } = parseCsv('A,B\r\n1,2\r\n3,4\r\n')
    expect(rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('handles newlines inside quoted fields', () => {
    const { rows } = parseCsv('Note,Amount\n"line1\nline2",9.99')
    expect(rows[0]).toEqual(['line1\nline2', '9.99'])
  })

  it('strips a leading BOM from the first header', () => {
    const { headers } = parseCsv('﻿Amount,Fee\n1,2')
    expect(headers[0]).toBe('Amount')
  })

  it('returns empty for header-only or empty input', () => {
    expect(parseCsv('Amount,Fee\n').rows).toEqual([])
    expect(parseCsv('')).toEqual({ headers: [], rows: [] })
  })
})
