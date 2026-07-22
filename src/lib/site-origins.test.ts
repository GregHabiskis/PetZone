import { describe, expect, it } from 'vitest'
import { siteOrigins } from './site-origins'

describe('siteOrigins', () => {
  it('pairs localhost with 127.0.0.1 so either host can call authenticated APIs', () => {
    expect(siteOrigins('http://localhost:3000').sort()).toEqual([
      'http://127.0.0.1:3000',
      'http://localhost:3000',
    ])
    expect(siteOrigins('http://127.0.0.1:3000').sort()).toEqual([
      'http://127.0.0.1:3000',
      'http://localhost:3000',
    ])
  })

  it('does not invent local hosts for production URLs', () => {
    expect(siteOrigins('https://petzone.com.bd')).toEqual(['https://petzone.com.bd'])
  })

  it('returns an empty list for missing or invalid config', () => {
    expect(siteOrigins(undefined)).toEqual([])
    expect(siteOrigins('not a url')).toEqual([])
  })
})
