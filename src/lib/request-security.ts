/**
 * Shared request-hardening helpers for storefront route handlers.
 * Body-size caps keep unbounded JSON payloads from exhausting memory,
 * and the same-site check gives cookie-authenticated mutations a
 * consistent CSRF posture (SameSite=Lax alone is not enough on every client).
 */
const DEFAULT_MAX_BODY_BYTES = 128 * 1024

export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp.trim()
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return 'unknown'
}

/**
 * Mirrors Payload's own cookie CSRF rules: allow same-origin/same-site/direct
 * posts, reject cross-site posts and mismatched origins before any DB work.
 */
export function isSameSiteRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === request.headers.get('host')
    } catch {
      return false
    }
  }
  const secFetchSite = request.headers.get('sec-fetch-site')
  return secFetchSite === null || ['same-origin', 'same-site', 'none'].includes(secFetchSite)
}

/** Reads a JSON body with a hard byte cap. Returns null when oversized or malformed. */
export async function readBoundedJson(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null
  let text: string
  try {
    text = await request.text()
  } catch {
    return null
  }
  if (Buffer.byteLength(text, 'utf8') > maxBytes) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}
