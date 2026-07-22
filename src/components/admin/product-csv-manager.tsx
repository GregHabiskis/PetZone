'use client'

import { useEffect, useMemo, useState } from 'react'

type ImportError = { row: number; sku?: string; field: string; message: string }
type ImportResult = {
  dryRun: boolean
  createCount: number
  updateCount: number
  rejectCount: number
  errors: ImportError[]
  errorCSV?: string
  error?: string
}

const buttonStyle = {
  background: '#EE5F27',
  border: '2px solid #EE5F27',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  display: 'inline-flex',
  fontWeight: 700,
  justifyContent: 'center',
  minHeight: '44px',
  padding: '10px 16px',
} as const

export function ProductCSVManager() {
  const [file, setFile] = useState<File | null>(null)
  const [validatedFileKey, setValidatedFileKey] = useState('')
  const [busy, setBusy] = useState<'export' | 'dry-run' | 'commit' | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileKey = file ? `${file.name}:${file.size}:${file.lastModified}` : ''
  const errorReportURL = useMemo(() => result?.errorCSV
    ? URL.createObjectURL(new Blob([`\uFEFF${result.errorCSV}`], { type: 'text/csv;charset=utf-8' }))
    : '', [result])

  useEffect(() => () => {
    if (errorReportURL) URL.revokeObjectURL(errorReportURL)
  }, [errorReportURL])

  async function submit(mode: 'dry-run' | 'commit') {
    if (!file) return
    setBusy(mode)
    setResult(null)
    const form = new FormData()
    form.set('file', file)
    form.set('mode', mode)
    try {
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      })
      const body = await response.json() as ImportResult
      setResult(body)
      if (mode === 'dry-run' && response.ok && body.rejectCount === 0) setValidatedFileKey(fileKey)
      if (mode === 'commit' && response.ok) setValidatedFileKey('')
    } catch {
      setResult({ dryRun: mode === 'dry-run', createCount: 0, updateCount: 0, rejectCount: 1, errors: [], error: 'The import request failed. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  async function downloadExport() {
    setBusy('export')
    setResult(null)
    try {
      const response = await fetch('/api/admin/products/export', { credentials: 'same-origin' })
      if (!response.ok) throw new Error('Product export failed.')
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'petzone-products.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setResult({ dryRun: false, createCount: 0, updateCount: 0, rejectCount: 0, errors: [], error: error instanceof Error ? error.message : 'Product export failed.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="product-csv-title" style={{ background: 'var(--theme-elevation-50)', border: '1px solid var(--theme-elevation-150)', borderRadius: 10, marginBottom: 24, padding: 20 }}>
      <h2 id="product-csv-title" style={{ marginTop: 0 }}>Product CSV import/export</h2>
      <p>Export UTF-8 product data, then validate a CSV before applying atomic SKU-based updates. Invalid files write nothing.</p>
      <div style={{ alignItems: 'end', display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
        <button disabled={Boolean(busy)} onClick={downloadExport} style={buttonStyle} type="button">{busy === 'export' ? 'Downloading…' : 'Download CSV'}</button>
        <label style={{ display: 'grid', fontWeight: 700, gap: 6 }}>
          Select CSV (maximum 2 MB)
          <input
            accept=".csv,text/csv,application/csv"
            disabled={Boolean(busy)}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setValidatedFileKey('')
              setResult(null)
            }}
            type="file"
          />
        </label>
        <button disabled={!file || Boolean(busy)} onClick={() => submit('dry-run')} style={{ ...buttonStyle, opacity: !file || busy ? 0.55 : 1 }} type="button">
          {busy === 'dry-run' ? 'Validating…' : 'Validate'}
        </button>
        <button disabled={!file || fileKey !== validatedFileKey || Boolean(busy)} onClick={() => submit('commit')} style={{ ...buttonStyle, opacity: !file || fileKey !== validatedFileKey || busy ? 0.55 : 1 }} type="button">
          {busy === 'commit' ? 'Importing…' : 'Import validated CSV'}
        </button>
      </div>

      {result ? (
        <div aria-live="polite" style={{ marginTop: 18 }}>
          {result.error ? <p role="alert">{result.error}</p> : (
            <p><strong>{result.dryRun ? 'Dry run' : 'Import'}:</strong> {result.createCount} create, {result.updateCount} update, {result.rejectCount} rejected.</p>
          )}
          {result.errors?.length ? (
            <>
              <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>Row</th><th>SKU</th><th>Field</th><th>Message</th></tr></thead>
                  <tbody>{result.errors.map((error, index) => (
                    <tr key={`${error.row}-${error.field}-${index}`}><td>{error.row}</td><td>{error.sku ?? '—'}</td><td>{error.field}</td><td>{error.message}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              {errorReportURL ? <a download="petzone-product-import-errors.csv" href={errorReportURL} style={{ ...buttonStyle, marginTop: 12 }}>Download error report</a> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
