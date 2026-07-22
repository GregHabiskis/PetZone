'use client'

import { useState } from 'react'

type FieldErrors = Record<string, string[]>

export function AppointmentForm() {
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setFieldErrors({})
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/store/appointments', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'include', body: JSON.stringify(Object.fromEntries(form.entries())) })
    const result = await response.json()
    setPending(false)
    if (response.ok) {
      setMessage('Appointment request saved. Our team will confirm the schedule.')
      event.currentTarget.reset()
    } else {
      setMessage(result.error || 'Could not save the request.')
      if (result.issues) setFieldErrors(result.issues)
    }
  }
  function fieldError(name: string): string | undefined {
    return fieldErrors[name]?.[0]
  }
  const hasFieldErrors = Object.keys(fieldErrors).length > 0
  return <form className="form-card" onSubmit={submit} data-od-id="vet-appointment-form"><p className="eyebrow">REQUEST AN APPOINTMENT</p><h2>Tell us who needs care.</h2><div className="two-col"><div className="field"><label htmlFor="ownerName">Owner name</label><input id="ownerName" name="ownerName" required aria-invalid={!!fieldError('ownerName')} />{fieldError('ownerName') && <span className="field-error">{fieldError('ownerName')}</span>}</div><div className="field"><label htmlFor="contact">Phone or email</label><input id="contact" name="contact" required aria-invalid={!!fieldError('contact')} />{fieldError('contact') && <span className="field-error">{fieldError('contact')}</span>}</div></div><div className="two-col"><div className="field"><label htmlFor="petName">Pet name</label><input id="petName" name="petName" required aria-invalid={!!fieldError('petName')} />{fieldError('petName') && <span className="field-error">{fieldError('petName')}</span>}</div><div className="field"><label htmlFor="petType">Pet type</label><select id="petType" name="petType" required aria-invalid={!!fieldError('petType')}>{['Cat','Dog','Bird','Rabbit','Other'].map(t=><option key={t}>{t}</option>)}</select>{fieldError('petType') && <span className="field-error">{fieldError('petType')}</span>}</div></div><div className="two-col"><div className="field"><label htmlFor="age">Age (optional)</label><input id="age" name="age" /></div><div className="field"><label htmlFor="petWeight">Weight of your Pet (Optional)</label><input id="petWeight" name="petWeight" type="text" placeholder="e.g. 5 kg" /></div></div><div className="field"><label htmlFor="reason">Reason for visit</label><textarea id="reason" name="reason" required aria-invalid={!!fieldError('reason')} />{fieldError('reason') && <span className="field-error">{fieldError('reason')}</span>}</div><button className="primary-button" disabled={pending}>{pending ? 'Sending…' : 'Request appointment'}</button>{message && <p className={`status-message${hasFieldErrors ? ' status-error' : ''}`} role="status">{hasFieldErrors ? 'Please fix the highlighted fields.' : message}</p>}</form>
}
