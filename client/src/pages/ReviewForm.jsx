import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit mode: load the review and fill the form with only the editable fields.
  useEffect(() => {
    if (!id) {
      setForm(defaults)
      return
    }
    async function loadReview() {
      try {
        const res = await api.get(`/reviews/${id}`)
        const { courseCode, rating, comment } = res.data
        setForm({ courseCode, rating, comment: comment ?? '' })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
      }
    }
    loadReview()
  }, [id])

  // One handler for all inputs; rating is stored as a number.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }))
  }

  // POST a new review, or PATCH the existing one, then go back to /reviews.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        courseCode: form.courseCode.trim(),
        rating: form.rating,
        comment: form.comment,
      }
      if (id) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="courseCode" className="block text-sm font-medium mb-1">
            Course Code
          </label>
          <input
            id="courseCode"
            type="text"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            className="block w-full p-2 border rounded"
            placeholder="e.g. CS101"
            required
          />
        </div>
        <div>
          <label htmlFor="rating" className="block text-sm font-medium mb-1">
            Rating
          </label>
          <select
            id="rating"
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="block w-full p-2 border rounded"
            required
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1">
            Comment
          </label>
          <textarea
            id="comment"
            name="comment"
            value={form.comment}
            onChange={onChange}
            className="block w-full p-2 border rounded"
            rows="4"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}