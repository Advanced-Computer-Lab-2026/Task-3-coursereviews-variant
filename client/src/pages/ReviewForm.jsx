import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) {
      setForm(defaults)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    async function loadReview() {
      try {
        const res = await api.get(`/reviews/${id}`)
        if (!cancelled) {
          const { courseCode, rating, comment } = res.data.review
          setForm({ courseCode, rating, comment: comment || '' })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Could not load review')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReview()
    return () => { cancelled = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (id) {
        await api.patch(`/reviews/${id}`, form)
      } else {
        await api.post('/reviews', form)
      }
      nav('/reviews')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="courseCode" className="block text-sm font-medium mb-1">Course code</label>
          <input
            id="courseCode"
            className="input"
            name="courseCode"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label htmlFor="rating" className="block text-sm font-medium mb-1">Rating</label>
          <select
            id="rating"
            className="input"
            name="rating"
            value={form.rating}
            onChange={onChange}
            required
          >
            {[1, 2, 3, 4, 5].map(rating => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1">Comment (optional)</label>
          <textarea
            id="comment"
            className="input"
            name="comment"
            value={form.comment}
            onChange={onChange}
            rows={4}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={loading || saving}>
          {loading ? 'Loading…' : saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
