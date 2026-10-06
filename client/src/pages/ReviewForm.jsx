import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the review and fill the form.
  // Create mode: make sure the form is empty (e.g. after clicking "Write Review" from an edit page).
  useEffect(() => {
    setError('')
    if (!id) {
      setForm(defaults)
      return
    }
    let cancelled = false
    api.get('/reviews/' + id)
      .then(res => {
        if (cancelled) return
        const r = res.data.review || res.data // accept `{ review }` or the review itself
        setForm({
          courseCode: r.courseCode ?? '',
          rating: Number(r.rating) || 5,
          comment: r.comment ?? ''
        })
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load review')
      })
    return () => { cancelled = true }
  }, [id])

  // Update `form` when an input changes (rating is stored as a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'rating' ? Number(value) : value }))
  }

  // POST a new review, or PATCH the existing one when editing, then go back to /reviews.
  // `reviewedBy` is never sent: the server takes it from the token.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      courseCode: form.courseCode.trim(),
      rating: form.rating,
      comment: form.comment
    }
    try {
      if (id) await api.patch('/reviews/' + id, payload)
      else await api.post('/reviews', payload)
      nav('/reviews')
    } catch (err) {
      // 400 invalid rating, 403 not your review, 409 already reviewed this course
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
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <textarea
          className="input"
          name="comment"
          rows={4}
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