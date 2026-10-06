import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'

export default function Reviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [courseCode, setCourseCode] = useState('')
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      const res = await api.get('/reviews')
      // Ensure we extract the array properly whether returned directly or inside an object key
      const data = Array.isArray(res.data) ? res.data : (res.data.reviews || [])
      setReviews(data)
    } catch (err) {
      setError('Failed to load reviews')
    }
  }

  useEffect(() => { load() }, [])

  async function loadSummary(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.get('/reviews/summary', { params: { courseCode } })
      setSummary(res.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load summary')
    }
  }

  async function onDelete(id) {
    setError('')
    try {
      await api.delete('/reviews/' + id)
      setReviews(prev => prev.filter(r => r._id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={loadSummary} className="card flex items-center gap-2">
        <input 
          className="input flex-1" 
          placeholder="Course code (e.g. CS101)" 
          value={courseCode} 
          onChange={e => setCourseCode(e.target.value)} 
        />
        <button className="btn" type="submit">Summary</button>
      </form>

      {summary && (
        <div className="card text-sm">
          <b>{summary.courseCode}</b>: {summary.reviewCount} review(s)
          {summary.averageRating !== null && <> • average {summary.averageRating.toFixed(1)} / 5</>}
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(r => {
          const reviewerId = typeof r.reviewedBy === 'object' ? r.reviewedBy?._id || r.reviewedBy?.id : r.reviewedBy
          const userId = user?.id || user?._id
          const isMine = Boolean(userId && reviewerId && String(reviewerId) === String(userId))

          return (
            <div key={r._id} className="card p-4 border rounded-xl bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-base">
                    {r.courseCode} • {r.rating}/5
                  </div>
                  {isMine && (
                    <div className="flex gap-2">
                      <Link to={`/reviews/${r._id}`} className="btn text-xs px-3 py-1">Edit</Link>
                      <button onClick={() => onDelete(r._id)} className="btn text-xs px-3 py-1 text-red-600">Delete</button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  by {typeof r.reviewedBy === 'object' ? r.reviewedBy?.name : 'unknown'}
                </div>
                {r.comment && <p className="mt-2 text-sm text-gray-800">{r.comment}</p>}
              </div>
            </div>
          )
        })}
        {reviews.length === 0 && <div className="text-sm text-gray-500">No reviews yet.</div>}
      </div>
    </div>
  )
}