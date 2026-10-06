import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

const defaults = { courseCode: "", rating: 5, comment: "" };

export default function ReviewForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    // I like how we are supposed to learn about caching and tokens while 80% of us don't even know how to write a sinlge line of javascript
    let active = true;
    async function loadReview() {
      try {
        const res = await api.get(`/reviews/${id}`);
        if (active) {
          const review = res.data.review;
          setForm({
            courseCode: review.courseCode,
            rating: review.rating,
            comment: review.comment || "",
          });
        }
      } catch (err) {
        if (active)
          setError(err?.response?.data?.message || "Could not load review");
      }
    }

    loadReview();
    return () => {
      active = false;
    };
  }, [id]);

  function onChange(e) {
    // wth is this, a3oth bellah, IK what ...prev is supposed to be but bro
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = {
        courseCode: form.courseCode,
        rating: form.rating,
        comment: form.comment,
      };

      if (id) {
        await api.patch(`/reviews/${id}`, data);
      } else {
        await api.post("/reviews", data);
      }

      nav("/reviews");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save review");
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? "Edit" : "Write"} Review
      </h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="courseCode"
          placeholder="Course code (e.g. CS101)"
          value={form.courseCode}
          onChange={onChange}
          required
        />
        <select
          className="input"
          name="rating"
          value={form.rating}
          onChange={onChange}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <textarea
          className="input"
          name="comment"
          placeholder="Comment (optional)"
          value={form.comment}
          onChange={onChange}
          rows="4"
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}
