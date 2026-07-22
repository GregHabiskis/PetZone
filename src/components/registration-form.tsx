'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RegistrationForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const data = Object.fromEntries(form.entries())
    const registration = await fetch('/api/store/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
    const result = await registration.json()
    if (!registration.ok) { setPending(false); return setError(result.error || 'Could not create your account.') }
    const login = await fetch('/api/users/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ username: result.username, password: data.password }),
    })
    setPending(false)
    if (!login.ok) return setError('Account created, but automatic sign-in failed. Please sign in manually.')
    router.push('/account')
    router.refresh()
  }

  return <form className="form-card" onSubmit={submit} data-od-id="customer-registration-form">
    <p className="eyebrow">CREATE CUSTOMER ACCOUNT</p><h2>Your delivery details.</h2>
    <p>Email is optional. Your phone number is always available as your login.</p>
    <div className="two-col"><div className="field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" required /></div><div className="field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" required /></div></div>
    <div className="field"><label htmlFor="streetAddress">Street address</label><textarea id="streetAddress" name="streetAddress" autoComplete="street-address" required /></div>
    <div className="two-col"><div className="field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" required /></div><div className="field"><label htmlFor="postalCode">Postal code</label><input id="postalCode" name="postalCode" autoComplete="postal-code" required /></div></div>
    <div className="two-col"><div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" required /></div><div className="field"><label htmlFor="email">Email <span>(optional)</span></label><input id="email" name="email" type="email" autoComplete="email" /></div></div>
    <div className="field"><label htmlFor="new-password">Password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="card-actions"><button className="primary-button" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</button></div>
  </form>
}
