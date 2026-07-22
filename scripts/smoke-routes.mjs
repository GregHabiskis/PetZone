import { readFile } from 'node:fs/promises'

const baseURL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 120_000)
const importMap = await readFile(new URL('../src/app/(payload)/admin/importMap.js', import.meta.url), 'utf8')

for (const requiredImport of [
  '@payloadcms/storage-s3/client#S3ClientUploadHandler',
  '/components/admin/product-csv-manager#ProductCSVManager',
]) {
  if (!importMap.includes(requiredImport)) {
    throw new Error(`Payload import map is stale or incomplete: missing ${requiredImport}. Run pnpm payload:generate.`)
  }
}

for (const path of ['/', '/api/health', '/checkout', '/admin']) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    console.log(`${path} attempt ${attempt}: requesting`)
    const response = await fetch(`${baseURL}${path}`, { signal: AbortSignal.timeout(timeoutMs), redirect: 'manual' })
    if (response.status >= 500) throw new Error(`${path} returned ${response.status} on attempt ${attempt}`)
    console.log(`${path} attempt ${attempt}: ${response.status}`)
  }
}
