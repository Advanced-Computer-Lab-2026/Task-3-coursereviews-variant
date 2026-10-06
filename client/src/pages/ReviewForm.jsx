import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    async function loadReview() {
      try {
        const res = await api.get(`/reviews/${id}`)
        const review = res.data.review || res.data

        setForm({
          courseCode: review.courseCode || '',
          rating: review.rating || 5,
          comment: review.comment || ''
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review')
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
    setIsSaving(true)

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, form)
      } else {
        await api.post('/reviews', form)
      }
      nav('/reviews')
    } catch (err) {
      const status = err.response?.status
      const serverMessage = err.response?.data?.message

      if (status === 409) {
        setError(serverMessage || 'This course was already reviewed.')
      } else if (status === 400) {
        setError(serverMessage || 'Invalid rating or missing required fields.')
      } else if (status === 403) {
        setError(serverMessage || 'You are not authorized to edit this review.')
      } else {
        setError(serverMessage || 'An error occurred while saving the review.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            type="text"
            name="courseCode"
            className="input w-full"
            value={form.courseCode}
            onChange={onChange}
            placeholder="e.g. CS101"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <select
            name="rating"
            className="input w-full"
            value={form.rating}
            onChange={onChange}
            required
          >
            {[5, 4, 3, 2, 1].map(num => (
              <option key={num} value={num}>{num} Stars</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comment (Optional)</label>
          <textarea
            name="comment"
            className="input w-full"
            value={form.comment}
            onChange={onChange}
            rows="4"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="btn"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
