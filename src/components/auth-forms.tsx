'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = { redirectTo?: string; compact?: boolean }

export function LoginForm({ redirectTo, compact = false }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const identifier = String(form.get('identifier') || '').trim()
    const response = await fetch('/api/store/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [identifier.includes('@') ? 'email' : 'username']: identifier.replace(/^\+?88/, ''), password: form.get('password') }),
    })
    setPending(false)
    if (!response.ok) return setError('The phone/email or password is incorrect.')
    router.refresh()
    if (redirectTo) router.push(redirectTo)
  }

  return <form className="form-card" onSubmit={submit} data-od-id="customer-login-form">
    {!compact && <><p className="eyebrow">CUSTOMER LOGIN</p><h2>Welcome back.</h2></>}
    <div className="field"><label htmlFor="login-identifier">Phone number or email</label><input id="login-identifier" name="identifier" autoComplete="username" required /></div>
    <div className="field"><label htmlFor="login-password">Password</label><input id="login-password" name="password" type="password" autoComplete="current-password" required /></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="card-actions"><button className="primary-button" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button></div>
  </form>
}

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  return <button className="secondary-button" disabled={pending} onClick={async () => {
    setPending(true)
    await fetch('/api/store/logout', { method: 'POST', credentials: 'include' })
    router.push('/account')
    router.refresh()
  }}>{pending ? 'Signing out…' : 'Sign out'}</button>
}
