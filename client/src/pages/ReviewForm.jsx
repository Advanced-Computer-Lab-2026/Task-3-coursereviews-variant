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
      try {
        const res = await api.get(`/reviews/${id}`)
        const { review } = res.data
        setForm({
          courseCode: review.courseCode || '',
          rating: Number(review.rating) || 5,
          comment: review.comment || ''
        })
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load review')
      }
    }

    loadReview()
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
      const payload = {
        courseCode: form.courseCode.trim(),
        rating: Number(form.rating),
        comment: form.comment.trim()
      }

      if (id) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        await api.post('/reviews', payload)
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
        <input
          className="input"
          name="courseCode"
          placeholder="Course code (e.g. CS101)"
          value={form.courseCode}
          onChange={onChange}
          required
        />

        <select
          className="input"
          name="rating"
          value={form.rating}
          onChange={onChange}
          required
        >
          {[1, 2, 3, 4, 5].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <textarea
          className="input"
          name="comment"
          rows="5"
          placeholder="Your review"
          value={form.comment}
          onChange={onChange}
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
