import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// TODO: build the Write Review page — see README.md "Your task".
// This page is already routed at /reviews/new (write) and /reviews/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO (edit mode): when there is an `id`, load the review and fill the form.
  useEffect(() => {
    if (!id) return
    // TODO
     async function loadReview() {
      try {
        setError('')
         const response = await api.get(`/reviews/${id}`)
        const review = response.data.review
        
        setForm({
          courseCode: review.courseCode || '',
          rating: Number(review.rating) || 5,
          comment: review.comment || ''
        })
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.message || 'Failed to load the review details.')
      }
    }
    
    loadReview()
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    // TODO
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  // TODO: POST a new review, or PATCH the existing one when editing,
  // then go back to /reviews. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // TODO
     const targetCourse = form.courseCode.trim().toUpperCase()
    const payload = {
      courseCode: targetCourse,
      rating: form.rating,
      comment: form.comment.trim()
    }

  try {
      // CLIENT-SIDE GUARDRAIL FOR NEW REVIEWS (Bypasses missing backend indexes)
      if (!id) {
        // fetch current profile to get user identity context
        const meRes = await api.get('/auth/me')
        const currentUserId = meRes.data.user?._id || meRes.data.user?.id

        // fetch all posted reviews
        const reviewsRes = await api.get('/reviews')
        const allReviews = reviewsRes.data.reviews || []

        // scan to check if this user already submitted a review for this exact course
        const isDuplicate = allReviews.some(r => {
          const rUser = r.reviewedBy?._id || r.reviewedBy?.id || r.reviewedBy
          return (
            r.courseCode?.trim().toUpperCase() === targetCourse &&
            String(rUser) === String(currentUserId)
          )
        })
         if (isDuplicate) {
          setError('Review already created for this course')
          return // Hard stop submission loop immediately
        }
      }

      if (id) {
        // Edit mode (PATCH)
        await api.patch(`/reviews/${id}`, payload)
      } else {
        // Create mode (POST)
        await api.post('/reviews', payload)
      }
      nav('/reviews')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'An error occurred while saving your review.')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {/* TODO: course code input, rating select (1-5) and comment textarea */}
         <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            type="text"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="e.g. CS101"
            required
            disabled={Boolean(id)} // Course code is disabled when editing an existing review
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
          <select
            name="rating"
            value={form.rating}
            onChange={onChange}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 - Poor</option>
            <option value={2}>2 - Fair</option>
            <option value={3}>3 - Average</option>
            <option value={4}>4 - Good</option>
            <option value={5}>5 - Excellent</option>
          </select>
        </div>

         <div>
          <label className="block text-sm font-medium mb-1">Comment (Optional)</label>
          <textarea
            name="comment"
            value={form.comment}
            onChange={onChange}
            rows="4"
            placeholder="Tell others what you thought of the course..."
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>


        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
         <button 
            type="button" 
            onClick={() => nav('/reviews')}
            className="px-4 py-2 border rounded font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
      </form>
    </div>
  )
}
