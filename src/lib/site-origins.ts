/**
 * Origins allowed to present auth cookies (Payload CSRF) and same-origin admin posts.
 *
 * Payload auto-adds `serverURL` to its CSRF allowlist. Cookies and the Origin header
 * treat `localhost` and `127.0.0.1` as different hosts, so a SITE_URL of one rejects
 * browser requests from the other — admin list GETs still work (often no Origin), but
 * PATCH/POST (status changes, form state) fail with "not allowed" / "must be logged in".
 */
export function siteOrigins(siteURL = process.env.NEXT_PUBLIC_SITE_URL): string[] {
  const origins = new Set<string>()
  if (!siteURL) return []
  try {
    const url = new URL(siteURL)
    origins.add(url.origin)
    const port = url.port ? `:${url.port}` : ''
    if (url.hostname === 'localhost') origins.add(`${url.protocol}//127.0.0.1${port}`)
    if (url.hostname === '127.0.0.1') origins.add(`${url.protocol}//localhost${port}`)
  } catch {
    /* invalid deployment config is not an allowed origin */
  }
  return [...origins]
}
