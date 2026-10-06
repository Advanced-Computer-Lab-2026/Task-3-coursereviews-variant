import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {api} from '../api';

const EMPTY_FORM = { courseCode: '', rating: 5, comment: '' };

export default function ReviewForm() {
  const { id } = useParams();           // present on /reviews/:id, undefined on /reviews/new
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit); // only need to fetch when editing
  const [saving, setSaving] = useState(false);

  // TODO 3 (load side): when editing, fetch the review and fill the form.
  useEffect(() => {
    if (!isEdit) return;

    let cancelled = false;              // guards against setState after unmount / id change
    setLoading(true);
    setError('');

    api
      .get(`/reviews/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setForm({
          courseCode: data.courseCode ?? '',
          rating: data.rating ?? 5,
          comment: data.comment ?? '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to load review');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  // TODO 1: one handler for every input.
  // `rating` must be a NUMBER — the server validates rating ∈ [1..5] and
  // a string like "4" would fail that check (or be coerced unpredictably).
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  // TODO 2 + TODO 3 (save side): POST on create, PATCH on edit.
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // NOTE: deliberately NOT sending `reviewedBy`. The server takes the
    // reviewer from the JWT (req.user.id) and rejects the body if it's present.
    const payload = {
      courseCode: form.courseCode.trim(),
      rating: form.rating,
      comment: form.comment,
    };

    try {
      if (isEdit) {
        await api.patch(`/reviews/${id}`, payload);
      } else {
        await api.post('/reviews', payload);
      }
      navigate('/reviews');
    } catch (err) {
      // Surfaces 400 (bad rating), 409 (already reviewed this course),
      // 403 (editing someone else's review), 401 (expired token), etc.
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Loading review…</p>;
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">
        {isEdit ? 'Edit review' : 'Write a review'}
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="courseCode" className="mb-1 block text-sm font-medium">
            Course code
          </label>
          <input
            id="courseCode"
            name="courseCode"
            type="text"
            value={form.courseCode}
            onChange={onChange}
            required
            placeholder="CS101"
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label htmlFor="rating" className="mb-1 block text-sm font-medium">
            Rating
          </label>
          <select
            id="rating"
            name="rating"
            value={form.rating}
            onChange={onChange}
            className="w-full rounded border border-gray-300 p-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="comment" className="mb-1 block text-sm font-medium">
            Comment <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={form.comment}
            onChange={onChange}
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Submit review'}
        </button>
      </form>
    </div>
  );
}