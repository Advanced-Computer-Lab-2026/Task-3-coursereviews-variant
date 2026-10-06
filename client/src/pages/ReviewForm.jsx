import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

const EMPTY_FORM = { courseCode: '', rating: 5, comment: '' };

export default function ReviewForm() {
  const { id } = useParams();           // present on /reviews/:id, undefined on /reviews/new
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // TODO 3 (load side): when editing, fetch the review and fill the form.
  useEffect(() => {
    if (!isEdit) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get(`/reviews/${id}`)
      .then((response) => {
        if (cancelled) return;

        // Axios normally gives { data, ... }; some api.js setups unwrap it.
        const payload = response?.data ?? response;
        // Some controllers wrap the resource as { review: {...} }.
        const review = payload?.review ?? payload;

        setForm({
          courseCode: review?.courseCode ?? '',
          rating: review?.rating ?? 5,
          comment: review?.comment ?? '',
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.data?.message || err.message || 'Failed to load review'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  // TODO 1: one handler for every input. rating must be a number.
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  // TODO 2 + 3 (save side): POST on create, PATCH on edit.
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Deliberately NOT sending reviewedBy — the server takes it from the JWT.
    // On edit, courseCode is not editable, so we don't send it at all.
    const payload = isEdit
      ? { rating: form.rating, comment: form.comment }
      : {
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
      setError(
        err.response?.data?.message || err.message || 'Something went wrong'
      );
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
            // Course code identifies the review, so it can't be changed after creation.
            disabled={isEdit}
            className="w-full rounded border border-gray-300 p-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600"
          />
          {isEdit && (
            <p className="mt-1 text-xs text-gray-500">
              Course code can&rsquo;t be changed after the review is created.
            </p>
          )}
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