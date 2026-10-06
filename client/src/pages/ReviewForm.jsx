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
      setError('')
      try {
        const res = await api.get('/reviews/' + id)
        const review = res.data.review
        setForm({
          courseCode: review.courseCode,
          rating: review.rating,
          comment: review.comment || ''
        })
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load review')
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
      const payload = {
        courseCode: form.courseCode,
        rating: form.rating,
        comment: form.comment
      }

      if (id) {
        await api.patch('/reviews/' + id, payload)
      } else {
        await api.post('/reviews', payload)
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
        <label className="block text-sm font-medium">
          Course code
          <input
            className="input mt-1"
            name="courseCode"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Rating
          <select className="input mt-1" name="rating" value={form.rating} onChange={onChange}>
            {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Comment
          <textarea
            className="input mt-1"
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
