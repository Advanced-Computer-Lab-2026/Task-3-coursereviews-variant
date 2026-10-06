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
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    setForm(defaults)
    setError('')
    setLoadFailed(false)
    setLoading(Boolean(id))
    if (!id) return

    api.get(`/reviews/${id}`)
      .then(({ data }) => {
        if (!active) return
        const { courseCode, rating, comment } = data.review
        setForm({ courseCode, rating, comment: comment ?? '' })
      })
      .catch(err => {
        if (!active) return
        setLoadFailed(true)
        setError(err?.response?.data?.message || 'Could not load review')
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
    if (loading || saving || loadFailed) return
    setError('')
    setSaving(true)
    const payload = { courseCode: form.courseCode, rating: form.rating, comment: form.comment }
    try {
      if (id) await api.patch(`/reviews/${id}`, payload)
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
        {loading && <p role="status" className="text-sm text-zinc-600">Loading review…</p>}
        <fieldset disabled={loading || saving || loadFailed} className="space-y-3">
          <label className="block">
            <span className="block text-sm mb-1">Course code</span>
            <input className="input" name="courseCode" placeholder="Course code (e.g. CS101)" value={form.courseCode} onChange={onChange} required minLength={2} />
          </label>
          <label className="block">
            <span className="block text-sm mb-1">Rating</span>
            <select className="input" name="rating" value={form.rating} onChange={onChange}>
              {[1, 2, 3, 4, 5].map(rating => <option key={rating} value={rating}>{rating} / 5</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm mb-1">Comment (optional)</span>
            <textarea className="input" name="comment" placeholder="Share your experience" rows={3} value={form.comment} onChange={onChange} />
          </label>
          <button className="btn disabled:opacity-50" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </fieldset>
        {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  )
}
