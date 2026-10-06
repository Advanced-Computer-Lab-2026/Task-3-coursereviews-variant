import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // edit mode: load the review and fill the form
  useEffect(() => {
    if (!id) {
    setForm(defaults)
    setError('')
    return
  }
    let cancelled = false
    api
      .get(`/reviews/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        const r = data.review
        setForm({
          courseCode: r.courseCode,
          rating: Number(r.rating),
          comment: r.comment ?? '',
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load review.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'rating' ? Number(value) : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const body = {
      courseCode: form.courseCode.trim().toUpperCase(),
      rating: form.rating,
      comment: form.comment,
    }
    try {
      if (id) await api.patch(`/reviews/${id}`, body)
      else await api.post('/reviews', body)
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="courseCode"
          value={form.courseCode}
          onChange={onChange}
          placeholder="CS101"
          required
          className="input"
        />
        <select name="rating" value={form.rating} onChange={onChange} className="input">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
        <textarea
          name="comment"
          value={form.comment}
          onChange={onChange}
          placeholder="Comment (optional)"
          rows={3}
          className="input"
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}