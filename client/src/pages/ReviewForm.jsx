import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  const userId = storedUser?.id || storedUser?._id || null

  // Edit mode: load the review and fill the form
  useEffect(() => {
    if (!id) return
    async function loadReview() {
      try {
        const response = await api.get(`/reviews/${id}`)
        const data = response.data.review
        setForm({
          courseCode: data.courseCode || '',
          rating: data.rating || 5,
          comment: data.comment || ''
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
      }
    }
    loadReview()
  }, [id])

  // Update form on input change (rating is a number, courseCode uppercased)
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]:
        name === 'rating'
          ? Number(value)
          : name === 'courseCode'
            ? value.toUpperCase()
            : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const courseCode = form.courseCode.trim().toUpperCase()
    const payload = { ...form, courseCode }

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        // Duplicate guard (frontend only)
        const { data } = await api.get('/reviews')
        const alreadyReviewed = data.reviews?.some(r => {
          const sameCode = r.courseCode?.trim().toUpperCase() === courseCode
          const reviewer = r.reviewedBy
          const ownerId = typeof reviewer === 'object' && reviewer !== null
            ? (reviewer._id || reviewer.id)
            : reviewer
          const sameUser = userId && ownerId && String(ownerId) === String(userId)
          return sameCode && sameUser
        })

        if (alreadyReviewed) {
          setError('You already reviewed this course')
          return
        }

        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? 'Edit' : 'Write'} Review
      </h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="courseCode">
            Course Code
          </label>
          <input
            className="input"
            id="courseCode"
            name="courseCode"
            type="text"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            readOnly={!!id}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="rating">
            Rating
          </label>
          <select
            className="input"
            id="rating"
            name="rating"
            value={form.rating}
            onChange={onChange}
            required
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="comment">
            Comment (optional)
          </label>
          <textarea
            className="input"
            id="comment"
            name="comment"
            rows={4}
            value={form.comment}
            onChange={onChange}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </div>
  )
}