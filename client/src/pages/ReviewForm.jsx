import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Write Review page. Routed at /reviews/new (write) and /reviews/:id (edit),
// both wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the review and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false // ignore the response if we leave the page first

    api
      .get(`/reviews/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        const review = data.review ?? data // handles { review } or a bare document
        setForm({
          courseCode: review.courseCode ?? '',
          rating: Number(review.rating) || 5,
          comment: review.comment ?? ''
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load this review')
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  // One handler for all three inputs. Selects always give strings,
  // so rating is converted to a number before it is stored.
  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  // POST a new review, or PATCH the existing one when editing,
  // then go back to /reviews. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault() // stop the browser's full-page form submit
    setError('')

    // Do NOT send reviewedBy: the server takes the reviewer from the token
    // and rejects the request if it is in the body.
    const payload = {
      courseCode: form.courseCode.trim(),
      rating: form.rating
    }
    // comment is optional, so only send it when something was typed
    if (form.comment.trim()) payload.comment = form.comment.trim()

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      // 400 invalid rating, 403 not your review, 409 already reviewed this course
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="courseCode" className="block text-sm font-medium mb-1">
            Course code
          </label>
          <input
            id="courseCode"
            name="courseCode"
            type="text"
            value={form.courseCode}
            onChange={onChange}
            placeholder="CS101"
            required
            className="w-full border rounded px-3 py-2"
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
            className="w-full border rounded px-3 py-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1">
            Comment (optional)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={form.comment}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
