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
        const res = await api.get('/reviews/' + id)
        const review = res.data.review
        setForm({
          courseCode: review.courseCode,
          rating: review.rating,
          comment: review.comment || ''
        })
      } catch (err) {
        setError(err.response?.data?.message || err.message)
      }
    }

    loadReview()
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({
      ...current,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  // TODO: POST a new review, or PATCH the existing one when editing,
  // then go back to /reviews. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const request = id ? api.patch('/reviews/' + id, {
        courseCode: form.courseCode,
        rating: form.rating,
        comment: form.comment
      }) : api.post('/reviews', {
        courseCode: form.courseCode,
        rating: form.rating,
        comment: form.comment
      })
      await request
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Course code</span>
          <input
            className="input w-full"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="CS101"
            required
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium mb-1">Rating</span>
          <select
            className="input w-full"
            name="rating"
            value={form.rating}
            onChange={onChange}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium mb-1">Comment</span>
          <textarea
            className="input w-full"
            name="comment"
            value={form.comment}
            onChange={onChange}
            rows="4"
          />
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
