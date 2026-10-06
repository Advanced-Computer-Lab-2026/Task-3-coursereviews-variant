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

  // Edit mode: when there is an `id`, load the review and fill the form.
  useEffect(() => {
    if (!id) return
    api.get(`/reviews/${id}`)
      .then(res => {
        const { courseCode, rating, comment } = res.data.review
        setForm({ courseCode, rating, comment: comment ?? '' })
      })
      .catch(err => setError(err?.response?.data?.message || 'Could not load review'))
  }, [id])

  // Update the field matching the input's `name`; rating is stored as a number.
  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'rating' ? Number(value) : value }))
  }

  // POST a new review, or PATCH the existing one when editing, then go back to /reviews.
  // Show the server's error message on failure.
  // reviewedBy is never sent — the server takes the reviewer from the token.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const { courseCode, rating, comment } = form
    const body = { courseCode, rating, comment }
    try {
      if (id) await api.patch(`/reviews/${id}`, body)
      else await api.post('/reviews', body)
      nav('/reviews')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save review')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="courseCode">Course code</label>
          <input
            id="courseCode"
            name="courseCode"
            className="input"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="rating">Rating</label>
          <select id="rating" name="rating" className="input" value={form.rating} onChange={onChange}>
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="comment">Comment</label>
          <textarea
            id="comment"
            name="comment"
            className="input"
            rows={4}
            placeholder="Optional"
            value={form.comment}
            onChange={onChange}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
