'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'

export function DeleteAccountButton() {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'pending' | 'done'>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleDelete() {
    if (inputRef.current?.value !== 'DELETE') {
      setError('Type DELETE to confirm.')
      return
    }
    setError('')
    setStep('pending')
    const res = await fetch('/api/store/account/delete', { method: 'POST', credentials: 'include' })
    if (!res.ok) {
      setStep('confirm')
      setError('Something went wrong. Please try again.')
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
          <p className="delete-instruction">Type <strong>DELETE</strong> to confirm.</p>
          <div className="field">
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              onChange={() => {
                if (error) setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputRef.current?.value === 'DELETE') {
                  handleDelete()
                }
              }}
              placeholder="DELETE"
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="card-actions">
            <button
              className="danger-button"
              onClick={handleDelete}
              disabled={false}
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
