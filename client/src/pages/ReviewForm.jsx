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
    async function load() {
      if (!id) return
      try {
        const res = await api.get(`/reviews/${id}`)
        const { review } = res.data
        setForm({
          courseCode: review.courseCode,
          rating: review.rating,
          comment: review.comment
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load review')
      }
    }
    load()
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
    try {
      if (id) {
        await api.patch(`/reviews/${id}`, form)
      } else {
        await api.post('/reviews', form)
      }
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save review')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Course Code</label>
          <input
            type="text"
            name="courseCode"
            className="input"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Rating</label>
          <select
            name="rating"
            className="input"
            value={form.rating}
            onChange={onChange}
            required
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Comment (optional)</label>
          <textarea
            name="comment"
            className="input"
            placeholder="Your review..."
            value={form.comment}
            onChange={onChange}
            rows="3"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
