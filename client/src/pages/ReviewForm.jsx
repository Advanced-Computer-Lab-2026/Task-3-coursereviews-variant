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
  const [saving, setSaving] = useState(false)

  // Edit mode: load the review and fill the form with ONLY the three editable
  // fields. Spreading the whole review would include the populated
  // `reviewedBy` object, which the server rejects.
  useEffect(() => {
    // Write mode (e.g. navigating from /reviews/:id to /reviews/new reuses this
    // component instance): reset to a blank form.
    if (!id) {
      setForm(defaults)
      setError('')
      return
    }

    let cancelled = false // ignore the response if we left the page meanwhile
    async function load() {
      try {
        const res = await api.get('/reviews/' + id)
        if (cancelled) return
        const { courseCode, rating, comment } = res.data.review
        setForm({ courseCode, rating, comment: comment ?? '' })
      } catch (err) {
        if (cancelled) return
        setError(err?.response?.data?.message || 'Could not load review')
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // One handler for all inputs: `name` matches the key in `form`.
  // rating comes from a <select>, so it is a string -> convert to a number.
  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'rating' ? Number(value) : value }))
  }

  async function onSubmit(e) {
    e.preventDefault() // stop the browser's full-page form submit
    setError('')
    setSaving(true)

    // Send exactly these three fields. Never `reviewedBy` (server takes it
    // from the token and rejects it if present).
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
      // 400 invalid, 403 not yours, 404 missing, 409 duplicate -> server message.
      // No `response` at all means a network failure -> generic fallback.
      setError(err?.response?.data?.message || 'Could not save review')
      setSaving(false) // only re-enable on failure; on success we navigate away
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
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}