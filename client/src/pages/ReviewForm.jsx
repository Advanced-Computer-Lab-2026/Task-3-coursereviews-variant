import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadReview() {
      setError('')
      if (!id) {
        setForm(defaults)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const { data } = await api.get(`/reviews/${id}`)
        if (!cancelled) {
          const review = data.review
          setForm({
            courseCode: review.courseCode,
            rating: Number(review.rating),
            comment: review.comment ?? ''
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load review')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadReview()
    return () => {
      cancelled = true
    }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(current => ({
      ...current,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSaving(true)
    const review = {
      courseCode: form.courseCode,
      rating: form.rating,
      comment: form.comment
    }

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, review)
      } else {
        await api.post('/reviews', review)
      }
      nav('/reviews')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save review')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="sr-only" htmlFor="courseCode">Course code</label>
        <input
          id="courseCode"
          className="input"
          name="courseCode"
          placeholder="Course code (e.g. CS101)"
          value={form.courseCode}
          onChange={onChange}
          required
          minLength={2}
          disabled={isLoading || isSaving}
        />
        <label className="sr-only" htmlFor="rating">Rating</label>
        <select
          id="rating"
          className="input"
          name="rating"
          value={form.rating}
          onChange={onChange}
          disabled={isLoading || isSaving}
        >
          {[1, 2, 3, 4, 5].map(rating => (
            <option key={rating} value={rating}>{rating} / 5</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="comment">Comment (optional)</label>
        <textarea
          id="comment"
          className="input"
          name="comment"
          placeholder="Comment (optional)"
          value={form.comment}
          onChange={onChange}
          rows={3}
          disabled={isLoading || isSaving}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={isLoading || isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
