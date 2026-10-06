import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

const defaults = { courseCode: "", rating: 5, comment: "" };

export default function ReviewForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState("");
 
  useEffect(() => {
    if (!id) return;

    const fetchReview = async () => {
      try {
        const { data } = await api.get(`/reviews/${id}`);
        const { courseCode, rating, comment } = data.review;
        setForm({ courseCode, rating, comment: comment ?? "" });
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load review");
      }
    };
    fetchReview();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (id) {
        await api.patch(`/reviews/${id}`, form);
      } else {
        await api.post("/reviews", form);
      }
      navigate("/reviews");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save review");
    }
  };

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? "Edit" : "Write"} Review</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="courseCode"
          value={form.courseCode}
          onChange={handleChange}
          placeholder="Course code (e.g. CS101)"
          className="input"
        />
        <select
          name="rating"
          value={form.rating}
          onChange={handleChange}
          className="input"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} / 5
            </option>
          ))}
        </select>
        <textarea
          name="comment"
          value={form.comment}
          onChange={handleChange}
          placeholder="Comment (optional)"
          className="input"
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  );
}