import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'

// TODO: build the Write Review page — see README.md "Your task".
// This page is already routed at /reviews/new (write) and /reviews/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { id } = useParams()
  
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO (edit mode): when there is an `id`, load the review and fill the form.
  useEffect(() => {
    if (!id) {
      setForm(defaults)
      return
    }
    api.get(`/reviews/${id}`)
      .then((res) => {
        setForm({
          courseCode: res.data.review.courseCode,
          rating: res.data.review.rating,
          comment: res.data.review.comment || ''
        })
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message)
      })
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
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
      const code = form.courseCode.trim().toUpperCase()
      const payload = {
        courseCode: form.courseCode.trim(),
        rating: Number(form.rating),
        comment: form.comment
      }

      // Ensure the course is not already reviewed by this user
      const res = await api.get('/reviews')
      const reviews = res.data.reviews || []
      const alreadyReviewed = reviews.some((r) => {
        const reviewerId = r.reviewedBy?._id || r.reviewedBy
        const isSameUser = user && reviewerId === user.id
        const isSameCourse = r.courseCode?.trim().toUpperCase() === code
        if (id) {
          return isSameUser && isSameCourse && r._id !== id
        }
        return isSameUser && isSameCourse
      })

      if (alreadyReviewed) {
        setError('You already reviewed this course')
        return
      }

      if (id) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Course Code</label>
          <input
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            required
            className="input"
            placeholder="e.g. CS101"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Rating</label>
          <select
            name="rating"
            value={form.rating}
            onChange={onChange}
            required
            className="input"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Comment</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={onChange}
            className="input"
            rows="4"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
