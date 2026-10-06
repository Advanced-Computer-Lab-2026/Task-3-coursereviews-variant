import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Write Review page — routed at /reviews/new (write) and /reviews/:id (edit),
// both wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the review and fill the form with its fields.
  useEffect(() => {
    if (!id) return
    api.get(`/reviews/${id}`)
      .then(({ data }) => {
        const { courseCode, rating, comment } = data.review
        setForm({ courseCode, rating, comment: comment || '' })
      })
      .catch(err => setError(err?.response?.data?.message || 'Could not load review'))
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'rating' ? Number(value) : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // Only these three fields — the server sets reviewedBy from the token.
    const body = { courseCode: form.courseCode, rating: form.rating, comment: form.comment }
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
        <input className="input" name="courseCode" placeholder="Course code (e.g. CS101)" value={form.courseCode} onChange={onChange} />
        <select className="input" name="rating" value={form.rating} onChange={onChange}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} / 5</option>)}
        </select>
        <textarea className="input" name="comment" rows={3} placeholder="Comment (optional)" value={form.comment} onChange={onChange} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
