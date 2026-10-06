import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'

// TODO: build the Write Review page — see README.md "Your task".
// This page is already routed at /reviews/new (write) and /reviews/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicateCourse, setDuplicateCourse] = useState(false)

  useEffect(() => {
    if (!id) {
      setForm(defaults)
      return
    }

    async function loadReview() {
      try {
        const { data } = await api.get(`/reviews/${id}`)
        const review = data.review
        setForm({
          courseCode: review.courseCode || '',
          rating: Number(review.rating) || 5,
          comment: review.comment || ''
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load review')
      }
    }

    loadReview()
  }, [id])

  useEffect(() => {
    if (!user || id) {
      setDuplicateCourse(false)
      return
    }

    const courseCode = form.courseCode.trim().toUpperCase()
    if (!courseCode) {
      setDuplicateCourse(false)
      return
    }

    let cancelled = false

    async function checkDuplicate() {
      try {
        const { data } = await api.get('/reviews')
        if (cancelled) return

        const matches = data.reviews.some(review => {
          const reviewerId = review.reviewedBy?._id || review.reviewedBy?.id || review.reviewedBy
          return String(reviewerId) === String(user.id) && String(review.courseCode).toUpperCase() === courseCode
        })

        setDuplicateCourse(matches)
        if (matches) {
          setError('You already reviewed this course.')
        } else if (error === 'You already reviewed this course.') {
          setError('')
        }
      } catch {
        if (!cancelled) setDuplicateCourse(false)
      }
    }

    checkDuplicate()
    return () => { cancelled = true }
  }, [form.courseCode, user, id, error])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (isSubmitting || duplicateCourse) return

    const payload = {
      ...form,
      courseCode: form.courseCode.trim().toUpperCase(),
      comment: form.comment.trim()
    }

    setError('')
    setIsSubmitting(true)

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, payload)
      } else {
        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      const message = err.response?.data?.message || 'An unexpected error occurred'
      setError(message)
      if (err.response?.status === 409) {
        setForm(prev => ({ ...prev, courseCode: payload.courseCode }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {/* TODO: course code input, rating select (1-5) and comment textarea */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Course Code</label>
          <input
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            className="input"
            placeholder="e.g. CS101"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Rating</label>
          <select
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="input"
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
            value={form.comment}
            onChange={onChange}
            className="input min-h-[100px]"
            placeholder="What did you think of the course?"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={isSubmitting || duplicateCourse}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
