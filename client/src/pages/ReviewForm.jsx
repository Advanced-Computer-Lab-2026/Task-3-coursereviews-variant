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
       const { data } = await api.get(`/reviews/${id}`)
const review = data.review

setForm({
  courseCode: review.courseCode,
  rating: review.rating,
  comment: review.comment || '',
})
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
      }
    }

    loadReview()
  }, [id])

  function onChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, {
          courseCode: form.courseCode,
          rating: form.rating,
          comment: form.comment,
        })
      } else {
        await api.post('/reviews', {
          courseCode: form.courseCode,
          rating: form.rating,
          comment: form.comment,
        })
      }

      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? 'Edit' : 'Write'} Review
      </h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Course Code
          </label>

          <input
            className="input"
            type="text"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="e.g. CS101"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Rating
          </label>

          <select
            className="input"
            name="rating"
            value={form.rating}
            onChange={onChange}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Comment
          </label>

          <textarea
            className="input"
            name="comment"
            value={form.comment}
            onChange={onChange}
            placeholder="Optional comment"
            rows={4}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </div>
  )
}