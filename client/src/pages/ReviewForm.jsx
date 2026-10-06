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
        const review = response.data.review

        setForm({
          courseCode: review.courseCode,
          rating: review.rating,
          comment: review.comment || ''
        })
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load review'
        setError(msg)
      }
    }

    loadReview()
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      if (!id) {
        await api.post('/reviews', form)
      } else {
        await api.patch(`/reviews/${id}`, form)
      }
      nav('/reviews')
    } catch (err) {
      const msg = err.response?.data?.message || 'An unexpected error occurred'
      setError(msg)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            type="text"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="e.g. CS101"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <select
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="w-full p-2 border rounded"
          >
            {[5, 4, 3, 2, 1].map(num => (
              <option key={num} value={num}>{num} Stars</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comment (Optional)</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={onChange}
            placeholder="What did you think of this course?"
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )

}
