import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Routed at /reviews/new (write) and /reviews/:id (edit); both are behind <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams() // undefined on /reviews/new, the review id on /reviews/:id
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the existing review and fill the form with it.
  useEffect(() => {
    if (!id) {
      setForm(defaults) // e.g. navigating from edit to "Write Review" must clear the form
      return
    }
    let cancelled = false
    setError('')
    api.get('/reviews/' + id)
      .then(res => {
        if (cancelled) return
        const r = res.data.review
        setForm({
          courseCode: r.courseCode,
          rating: r.rating,
          comment: r.comment || '' // comment is optional, so it may be undefined
        })
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load review')
      })
    return () => { cancelled = true } // ignore a late response if the id changed/unmounted
  }, [id])

  // One handler for all inputs, keyed by each input's `name`.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      // <select> values are always strings; the server expects a number
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault() // stop the browser's full-page form submit
    setError('')
    // Only these three fields; never reviewedBy (server takes it from the token and rejects it).
    const payload = {
      courseCode: form.courseCode,
      rating: form.rating,
      comment: form.comment
    }
    try {
      if (id) await api.patch('/reviews/' + id, payload)
      else await api.post('/reviews', payload)
      nav('/reviews')
    } catch (err) {
      // 400 invalid, 403 not your review, 409 already reviewed this course
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
        <select className="input" name="rating" value={form.rating} onChange={onChange}>
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n} / 5</option>
          ))}
        </select>
        <textarea
          className="input"
          name="comment"
          rows={3}
          placeholder="Comment (optional)"
          value={form.comment}
          onChange={onChange}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
