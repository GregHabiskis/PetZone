'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'

export function DeleteAccountButton() {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'pending' | 'done'>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleDelete() {
    const password = inputRef.current?.value || ''
    if (!password) {
      setError('Enter your password to confirm.')
      return
    }
    setError('')
    setStep('pending')
    const res = await fetch('/api/store/account/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setStep('confirm')
      setError(data.error || 'Something went wrong. Please try again.')
      return
    }
    setStep('done')
    router.push('/account')
    router.refresh()
  }

  if (step === 'idle') {
    return (
      <button className="danger-button" onClick={() => setStep('confirm')}>
        Delete account
      </button>
    )
  }

  return (
    <div className="delete-account-confirm">
      <p className="delete-warning">
        This will permanently delete your account and all associated data.
        This action cannot be undone.
      </p>
      {step === 'confirm' && (
        <>
          <p className="delete-instruction">Enter your account password to confirm.</p>
          <div className="field">
            <label htmlFor="delete-password">Password</label>
            <input
              id="delete-password"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              onChange={() => {
                if (error) setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleDelete()
                }
              }}
              placeholder="Your password"
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="card-actions">
            <button
              className="danger-button"
              onClick={handleDelete}
            >
              Permanently delete
            </button>
            <button className="secondary-button" onClick={() => setStep('idle')}>
              Cancel
            </button>
          </div>
        </>
      )}
      {step === 'pending' && <p className="status-message">Deleting account…</p>}
      {step === 'done' && <p className="status-message">Account deleted.</p>}
    </div>
  )
}
