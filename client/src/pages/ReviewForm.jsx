import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// TODO: build the Write Review page — see README.md "Your task".
// This page is already routed at /reviews/new (write) and /reviews/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO (edit mode): when there is an `id`, load the review and fill the form.
  useEffect(() => {
    if (!id) return
    async function loadReview() {
      try {
        const response = await api.get(`/reviews/${id}`)
        const data = response.data.review
        setForm({
          courseCode: data.courseCode ?? '',
          rating: data.rating ?? 5,
          comment: data.comment ?? ''
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
      }
    }
    loadReview()
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  // TODO: POST a new review, or PATCH the existing one when editing,
  // then go back to /reviews. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (id) {
        await api.patch(`/reviews/${id}`, form)
      } else {
        await api.post('/reviews', form)
      }
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="courseCode">Course Code</label>
          <input
            id="courseCode"
            name="courseCode"
            type="text"
            value={form.courseCode}
            onChange={onChange}
            className="input"
            placeholder="e.g. CS101"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="rating">Rating</label>
          <select
            id="rating"
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="input"
            required
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="comment">Comment (optional)</label>
          <textarea
            id="comment"
            name="comment"
            value={form.comment}
            onChange={onChange}
            className="input"
            rows={4}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
