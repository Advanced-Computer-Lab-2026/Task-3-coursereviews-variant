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

  // Load the existing review when editing.
  useEffect(() => {
    let active = true

    setError('')
    setForm(defaults)
    setLoading(Boolean(id))

    if (!id) return

    api.get('/reviews/' + id)
      .then(res => {
        if (!active) return

        const review = res.data.review
        setForm({
          courseCode: review.courseCode,
          rating: Number(review.rating),
          comment: review.comment ?? ''
        })
        setLoading(false)
      })
      .catch(err => {
        if (!active) return

        setError(
          err?.response?.data?.message || 'Could not load review'
        )
        // Keep submission disabled if the review could not be loaded.
      })

    return () => {
      active = false
    }
  }, [id])

  // Update the changed input; convert the rating to a number.
  function onChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading || saving) return

    setError('')
    setSaving(true)

    const payload = {
      courseCode: form.courseCode,
      rating: form.rating,
      comment: form.comment
    }

    try {
      if (id) {
        await api.patch('/reviews/' + id, payload)
      } else {
        await api.post('/reviews', payload)
      }

      nav('/reviews')
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Could not save review'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? 'Edit' : 'Write'} Review
      </h1>

      {loading && !error && (
        <p className="text-sm mb-3">Loading review...</p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="courseCode" className="block text-sm mb-1">
            Course code
          </label>
          <input
            id="courseCode"
            name="courseCode"
            type="text"
            className="input w-full"
            placeholder="e.g. CS101"
            value={form.courseCode}
            onChange={onChange}
            required
            minLength={2}
            disabled={loading || saving}
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm mb-1">
            Rating
          </label>
          <select
            id="rating"
            name="rating"
            className="input w-full"
            value={form.rating}
            onChange={onChange}
            disabled={loading || saving}
          >
            {[1, 2, 3, 4, 5].map(rating => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm mb-1">
            Comment (optional)
          </label>
          <textarea
            id="comment"
            name="comment"
            className="input w-full"
            rows={4}
            value={form.comment}
            onChange={onChange}
            disabled={loading || saving}
          />
        </div>

        {error && (
          <div role="alert" className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          className="btn"
          type="submit"
          disabled={loading || saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}