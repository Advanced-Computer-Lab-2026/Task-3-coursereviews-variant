import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  const isEdit = Boolean(id && id !== 'new')

  // TODO 3 (edit mode): when editing, load the review and populate form fields
  useEffect(() => {
    if (!isEdit) return

    api.get(`/reviews/${id}`)
      .then((res) => {
        const data = res.data.review ?? res.data
        // Populates the form with actual data returned from the database
        setForm((prev) => ({
          ...prev,
          courseCode: data.courseCode ?? prev.courseCode,
          rating: data.rating !== undefined ? Number(data.rating) : prev.rating,
          comment: data.comment ?? '',
        }))
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load review.')
      })
  }, [id, isEdit])

  // TODO 1: update `form` when an input changes (rating should be stored as a number).
  function onChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }))
  }

  // TODO 2 & 3: POST a new review or PATCH the existing one.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const payload = {
      courseCode: form.courseCode,
      rating: Number(form.rating),
      comment: form.comment,
    }

    try {
      if (isEdit) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the review.')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
            Course Code
          </label>
          <input
            id="courseCode"
            type="text"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="e.g. CS101"
            className="input w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
            Rating
          </label>
          <select
            id="rating"
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="input w-full"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}/5
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Comment <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="comment"
            name="comment"
            value={form.comment}
            onChange={onChange}
            rows={4}
            placeholder="Share your thoughts about this course..."
            className="input w-full"
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