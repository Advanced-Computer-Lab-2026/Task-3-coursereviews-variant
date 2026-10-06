import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Reset form when opening /reviews/new or load review data when editing /reviews/:id
  useEffect(() => {
    if (!id) {
      setForm(defaults)
      return
    }

    api.get(`/reviews/${id}`)
      .then((res) => {
        const reviewData = res.data.review || res.data
        const { courseCode, rating, comment } = reviewData
        setForm({
          courseCode: courseCode || '',
          rating: Number(rating) || 5,
          comment: comment || ''
        })
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch review')
      })
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      // Check for duplicates before creating a new review
      if (!id) {
        const res = await api.get('/reviews')
        const allReviews = Array.isArray(res.data) ? res.data : (res.data.reviews || [])
        
        const userId = user?.id || user?._id
        const alreadyReviewed = allReviews.some(r => {
          const reviewerId = typeof r.reviewedBy === 'object' ? r.reviewedBy?._id || r.reviewedBy?.id : r.reviewedBy
          return (
            String(reviewerId) === String(userId) &&
            r.courseCode.trim().toUpperCase() === form.courseCode.trim().toUpperCase()
          )
        })

        if (alreadyReviewed) {
          setError(`You have already reviewed ${form.courseCode.trim().toUpperCase()}`)
          return
        }
      }

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
    <div className="max-w-xl mx-auto card p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
      <h1 className="text-xl font-bold mb-5 text-gray-900">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Course Code Input */}
        <div>
          <input
            type="text"
            name="courseCode"
            value={form.courseCode}
            onChange={onChange}
            placeholder="CS101"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
            required
          />
        </div>

        {/* Rating Select */}
        <div>
          <select
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
          >
            <option value={1}>1 / 5</option>
            <option value={2}>2 / 5</option>
            <option value={3}>3 / 5</option>
            <option value={4}>4 / 5</option>
            <option value={5}>5 / 5</option>
          </select>
        </div>

        {/* Comment Textarea */}
        <div>
          <textarea
            name="comment"
            value={form.comment}
            onChange={onChange}
            placeholder="Great lectures and clear slides. Exams are tough but fair."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Error Display */}
        {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

        <div>
          <button className="btn px-5 py-1.5 text-sm rounded-lg border border-gray-300 shadow-sm" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}