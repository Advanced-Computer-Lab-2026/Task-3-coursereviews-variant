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

    let ignore = false

    async function loadReview() {
      setError('')
      try {
        const res = await api.get(`/reviews/${id}`)
        if (!ignore) {
          const { courseCode, rating, comment = '' } = res.data.review
          setForm({ courseCode, rating, comment })
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.message || 'Could not load review')
        }
      }
    }

    loadReview()
    return () => { ignore = true }
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm(current => ({
      ...current,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  // TODO: POST a new review, or PATCH the existing one when editing,
  // then go back to /reviews. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

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
      setError(err?.response?.data?.message || 'Could not save review')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="courseCode"
          placeholder="Course code (e.g. CS101)"
          value={form.courseCode}
          onChange={onChange}
          required
        />
        <select
          className="input"
          name="rating"
          value={form.rating}
          onChange={onChange}
        >
          {[1, 2, 3, 4, 5].map(rating => (
            <option key={rating} value={rating}>{rating} / 5</option>
          ))}
        </select>
        <textarea
          className="input"
          name="comment"
          placeholder="Comment (optional)"
          rows="3"
          value={form.comment}
          onChange={onChange}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
