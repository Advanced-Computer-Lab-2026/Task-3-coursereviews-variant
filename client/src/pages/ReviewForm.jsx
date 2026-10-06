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

  // Load the review when there is an `id` (edit mode).
  useEffect(() => {
    if (!id) return
    async function loadReview() {
      try {
        const res = await api.get(`/reviews/${id}`)
        const { courseCode, rating, comment } = res.data
        setForm({ courseCode, rating, comment })
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load review')
      }
    }
    loadReview()
  }, [id])

  // Update `form` when an input changes. Rating is converted to a number.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value
    }))
  }

  // POST a new review, or PATCH the existing one when editing,
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
      setError(err?.response?.data?.message || 'An error occurred while saving the review')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            className="input w-full"
            name="courseCode"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <select
            className="input w-full"
            name="rating"
            value={form.rating}
            onChange={onChange}
            required
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num} {num === 5 ? '★' : 'stars'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comment (optional)</label>
          <textarea
            className="input w-full h-24"
            name="comment"
            placeholder="What did you think of this course?"
            value={form.comment}
            onChange={onChange}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn w-full" type="submit">Save Review</button>
      </form>
    </div>
  )
}
