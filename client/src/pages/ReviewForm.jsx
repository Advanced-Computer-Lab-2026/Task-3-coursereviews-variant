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

  useEffect(() => {
    if (!id) return
    async function loadReview() {
      try {
        const res = await api.get(`/reviews/${id}`)
        // Handle cases where the server might wrap the review in a 'review' object
        const reviewData = res.data.review || res.data
        setForm(reviewData)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
      }
    }
    loadReview()
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

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
      setError(err.response?.data?.message || 'An error occurred while saving the review')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            name="courseCode"
            type="text"
            className="input"
            value={form.courseCode}
            onChange={onChange}
            placeholder="e.g. CS101"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <select
            name="rating"
            className="input"
            value={form.rating}
            onChange={onChange}
            required
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comment (Optional)</label>
          <textarea
            name="comment"
            className="input"
            value={form.comment}
            onChange={onChange}
            placeholder="Share your thoughts..."
            rows={4}
          />
        </div>
        {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded border border-red-200">{error}</div>}
        <button className="btn" type="submit">Save Review</button>
      </form>
    </div>
  )
}
