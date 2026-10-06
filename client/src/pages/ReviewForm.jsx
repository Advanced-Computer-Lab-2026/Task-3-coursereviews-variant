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
  const [loadedId, setLoadedId] = useState(null)
  const [ownerId, setOwnerId] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const canEdit = !id || (loadedId === id && ownerId === user?.id)

  useEffect(() => {
    let active = true
    setForm(defaults)
    setError('')
    setLoadedId(null)
    setOwnerId(null)
    setLoading(Boolean(id))
    if (!id) return

    api.get('/reviews/' + id)
      .then(({ data }) => {
        if (!active) return
        const review = data.review
        setForm({
          courseCode: review.courseCode,
          rating: Number(review.rating),
          comment: review.comment || ''
        })
        setOwnerId(review.reviewedBy?._id)
        setLoadedId(id)
      })
      .catch(err => {
        if (active) setError(err?.response?.data?.message || 'Could not load review')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'rating' ? Number(value) : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!canEdit || loading || saving) return
    setError('')
    setSaving(true)
    const payload = { courseCode: form.courseCode.trim(), rating: form.rating, comment: form.comment }
    try {
      if (id) await api.patch('/reviews/' + id, payload)
      else await api.post('/reviews', payload)
      nav('/reviews')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {loading && <p role="status">Loading review…</p>}
        {loadedId === id && !canEdit && <p role="alert" className="text-red-600 text-sm">You can only edit your own reviews</p>}
        <fieldset disabled={loading || saving || !canEdit} className="space-y-3">
          <div>
            <label htmlFor="courseCode" className="block text-sm font-medium mb-1">Course code</label>
            <input id="courseCode" name="courseCode" className="input" placeholder="e.g. CS101" required minLength={2} value={form.courseCode} onChange={onChange} />
          </div>
          <div>
            <label htmlFor="rating" className="block text-sm font-medium mb-1">Rating</label>
            <select id="rating" name="rating" className="input" value={form.rating} onChange={onChange}>
              {[1, 2, 3, 4, 5].map(rating => <option key={rating} value={rating}>{rating}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-1">Comment (optional)</label>
            <textarea id="comment" name="comment" className="input" rows={4} value={form.comment} onChange={onChange} />
          </div>
          <button className="btn" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </fieldset>
        {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  )
}
