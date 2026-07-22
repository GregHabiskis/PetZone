'use client'

import { useState, useEffect } from 'react'

type Review = {
  id: number
  rating: number
  comment: string
  customerName: string
  createdAt: string
}

export function ProductReviews({ productSlug, isAuthenticated }: { productSlug: string; isAuthenticated: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/store/reviews?productSlug=${encodeURIComponent(productSlug)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !cancelled) {
          setReviews(data.reviews)
          setTotal(data.total)
        }
      })
    return () => { cancelled = true }
  }, [productSlug])

  async function reloadReviews() {
    const res = await fetch(`/api/store/reviews?productSlug=${encodeURIComponent(productSlug)}`)
    if (res.ok) {
      const data = await res.json()
      setReviews(data.reviews)
      setTotal(data.total)
    }
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (rating === 0) { setError('Please select a rating.'); return }
    if (!comment.trim()) { setError('Please write a comment.'); return }
    setPending(true)
    setError('')
    const res = await fetch('/api/store/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productSlug, rating, comment: comment.trim() }),
    })
    setPending(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to submit review.')
      return
    }
    setRating(0)
    setComment('')
    await reloadReviews()
  }

  const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0

  return (
    <div className="product-reviews">
      <h2>Customer Reviews {total > 0 && <span className="review-count">({total})</span>}</h2>

      {total > 0 && (
        <div className="review-summary">
          <span className="review-stars" aria-label={`${avgRating.toFixed(1)} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`star ${s <= Math.round(avgRating) ? 'filled' : ''}`}>★</span>
            ))}
          </span>
          <span className="review-average">{avgRating.toFixed(1)} out of 5</span>
        </div>
      )}

      <div className="review-list">
        {reviews.length === 0 && <p className="review-empty">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-card-head">
              <span className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`star ${s <= r.rating ? 'filled' : ''}`}>★</span>
                ))}
              </span>
              <span className="review-author">{r.customerName}</span>
              <span className="review-date">{new Date(r.createdAt).toLocaleDateString('en-BD')}</span>
            </div>
            <p className="review-comment">{r.comment}</p>
          </div>
        ))}
      </div>

      {isAuthenticated ? (
        <form className="review-form form-card" onSubmit={submitReview}>
          <h3>Write a review</h3>
          <div className="field">
            <label>Rating</label>
            <div className="star-input">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`star-btn ${s <= (hoveredStar || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoveredStar(s)}
                  onMouseLeave={() => setHoveredStar(0)}
                  aria-label={`${s} star${s > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="review-comment">Comment</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Share your experience with this product..."
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="card-actions">
            <button className="primary-button" disabled={pending}>
              {pending ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      ) : (
        <div className="review-auth-notice">
          <p><a href="/account">Sign in</a> to leave a review.</p>
        </div>
      )}
    </div>
  )
}
