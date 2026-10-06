import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Default initial state for the form — used when creating a new review.
// rating starts at 5 (the highest) for UX convenience, comment is optional.
const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  // `nav` lets us imperatively redirect the user after a successful save.
  const nav = useNavigate()
  // `id` comes from the URL param `/reviews/:id`. If present, we are in EDIT mode;
  // if undefined (route `/reviews/new`), we are in CREATE mode.
  const { id } = useParams()
  // `form` holds the current state of all three inputs. We keep it in a single
  // object so we can update it with one setter and send it to the server as-is.
  const [form, setForm] = useState(defaults)
  // `error` stores the server-side validation / auth error to display to the user.
  // Cleared at the start of every submit and when the user starts editing again.
  const [error, setError] = useState('')

  // Effect: when the URL has an `id` (edit mode), fetch the existing review from
  // the server and pre-fill the form fields. Runs once per `id` change.
  useEffect(() => {
    // Early return: if there's no id we are creating a new review, nothing to load.
    if (!id) return

    // Wrapped in an async IIFE because useEffect callbacks can't be async directly.
    ;(async () => {
      try {
        // GET /api/reviews/:id — public endpoint, returns { review }.
        const res = await api.get('/reviews/' + id)
        // Destructure only the fields we actually let the user edit.
        // reviewedBy / timestamps / _id are not part of the form state.
        const { courseCode, rating, comment } = res.data.review
        // Replace the defaults with the server values so the inputs are populated.
        setForm({ courseCode, rating, comment })
      } catch (err) {
        // If fetching fails (e.g. review deleted, bad id, network error), show
        // the server message if available, otherwise a generic fallback, and
        // send the user back to the list since there's nothing to edit.
        setError(err?.response?.data?.message || 'Could not load review')
        nav('/reviews')
      }
    })()
  }, [id, nav])

  // Shared onChange handler for every controlled input in the form.
  // Uses the input's `name` attribute as the key to update on the form object.
  function onChange(e) {
    // Grab the name and value straight from the DOM event target.
    const { name, value } = e.target
    // `setForm` receives a new object (never mutate state directly).
    // Spread the previous form state first, then override the single field that
    // changed — this preserves the other inputs' values when one updates.
    setForm(prev => ({
      ...prev,
      // Special-case `rating`: the <select> value always comes back as a string
      // from the DOM, but the server schema (Joi) requires rating to be a
      // NUMBER (integer 1-5). Convert with Number() so validation passes.
      [name]: name === 'rating' ? Number(value) : value
    }))
    // Clear any stale server error as soon as the user edits — they're trying
    // to fix whatever went wrong on the last submit.
    if (error) setError('')
  }

  // Submit handler — sends the form to the server. Behavior depends on mode:
  //   * CREATE (no id) → POST   /api/reviews
  //   * EDIT   (has id) → PATCH /api/reviews/:id
  async function onSubmit(e) {
    // Prevent the browser from doing its default full-page form POST.
    e.preventDefault()
    // Always start a fresh submit with a clean error slate.
    setError('')
    try {
      if (id) {
        // EDIT MODE — partial update via PATCH.
        // We only send courseCode / rating / comment. reviewedBy is intentionally
        // omitted: the server reads it from req.user.id (via the Bearer token)
        // and the Joi schema explicitly forbids `reviewedBy` in the request body
        // (returns 400 if present).
        await api.patch('/reviews/' + id, form)
      } else {
        // CREATE MODE — POST a brand new review.
        // Same body shape; server will attach reviewedBy from the auth token.
        // Duplicate (user + courseCode) returns 409 "You already reviewed this course".
        await api.post('/reviews', form)
      }
      // Success case: navigate back to the reviews list so the user sees their
      // (new / updated) review in the grid right away.
      nav('/reviews')
    } catch (err) {
      // Failure case: extract the server's `message` field (from
      // res.status(400/403/409).json({ message: '...' })) and display it in
      // the red error box above the Save button.
      // Fallback to a generic string for network errors that never reached the API.
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    // "card" gives the white rounded panel with shadow (defined in styles.css).
    // max-w-lg caps the width, mx-auto centers it horizontally.
    <div className="max-w-lg mx-auto card">
      {/* Dynamic heading: "Edit Review" when id exists, "Write Review" otherwise */}
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>

      {/* space-y-3 puts vertical spacing between each input row; onSubmit
          wires our handler above. */}
      <form onSubmit={onSubmit} className="space-y-3">
        {/* ---------- Course Code (text input) ---------- */}
        {/* className="input" applies the shared styled input from styles.css. */}
        {/* value={form.courseCode} makes this a CONTROLLED input: React state is
            the single source of truth, not the DOM. */}
        {/* name="courseCode" matches the key in the form object — onChange uses it. */}
        <input
          className="input"
          name="courseCode"
          placeholder="Course code (e.g. CS101)"
          value={form.courseCode}
          onChange={onChange}
        />

        {/* ---------- Rating (select 1 – 5) ---------- */}
        {/* Same controlled-input pattern. We render options 1 through 5.
            value is bound to form.rating (a number), which React automatically
            stringifies when comparing to the option values — the Number()
            conversion back happens inside onChange. */}
        <select
          className="input"
          name="rating"
          value={form.rating}
          onChange={onChange}
        >
          <option value={1}>1 / 5</option>
          <option value={2}>2 / 5</option>
          <option value={3}>3 / 5</option>
          <option value={4}>4 / 5</option>
          <option value={5}>5 / 5</option>
        </select>

        {/* ---------- Comment (textarea, optional) ---------- */}
        {/* rows={4} gives a comfortable height for multi-line comments.
            Optional per the task — leaving it blank is accepted by Joi
            (comment: Joi.string().allow('')). */}
        <textarea
          className="input"
          name="comment"
          placeholder="Comment (optional)"
          rows={4}
          value={form.comment}
          onChange={onChange}
        />

        {/* ---------- Error display ---------- */}
        {/* Conditionally rendered: only shows when `error` is a non-empty string.
            Tailwind text-red-600 for the danger color, text-sm matches the
            pattern used in Login.jsx / Reviews.jsx. */}
        {error && <div className="text-red-600 text-sm">{error}</div>}

        {/* ---------- Submit button ---------- */}
        {/* className="btn" = the shared styled button (styles.css).
            type="submit" so clicking it triggers the form's onSubmit handler
            (also fires on Enter inside any input). */}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
