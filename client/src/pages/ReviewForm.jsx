import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO 3 (edit mode): when the URL has an id, fetch that review and
  // pre-fill the form so the user sees the current values.
  useEffect(() => {
    if (!id) return
    api.get(`/reviews/${id}`)
      .then(({ data }) => setForm({
        courseCode: data.courseCode,
        rating: data.rating,
        comment: data.comment ?? ''
      }))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load review'))
  }, [id])

  // TODO 1: update the form state whenever an input changes.
  // rating is stored as a number, so we convert it with Number().
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  // TODO 2 & 3: POST for new reviews, PATCH for edits.
  // On success navigate to /reviews; on failure show the server message.
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
      setError(err.response?.data?.message || 'Something went wrong')
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
          placeholder="Course code (e.g. CS101)"
          className="input"
          required
        />
        <select
          name="rating"
          value={form.rating}
          onChange={onChange}
          className="input"
        >
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n} / 5</option>
          ))}
        </select>
        <textarea
          name="comment"
          value={form.comment}
          onChange={onChange}
          placeholder="Comment (optional)"
          className="input"
          rows={3}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
