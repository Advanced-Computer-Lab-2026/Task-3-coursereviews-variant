import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    async function loadReview() {
      setError('')
      try {
        const res = await api.get(`/reviews/${id}`)
        const { courseCode, rating, comment } = res.data.review
        setForm({ courseCode, rating, comment: comment || '' })
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load review')
      }
    }

    loadReview()
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(current => ({
      ...current,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (id) {
        await api.patch(`/reviews/${id}`, form)
      } else {
        await api.post('/reviews', form)
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
        <label className="block space-y-1">
          <span className="text-sm font-medium">Course code</span>
          <input
            className="input"
            name="courseCode"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Rating</span>
          <select className="input" name="rating" value={form.rating} onChange={onChange}>
            {[1, 2, 3, 4, 5].map(rating => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Comment (optional)</span>
          <textarea
            className="input"
            name="comment"
            rows="4"
            value={form.comment}
            onChange={onChange}
          />
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
