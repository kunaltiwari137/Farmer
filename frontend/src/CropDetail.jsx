import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import StarRating from "./StarRating";

function CropDetail() {
  // STEP 1: useParams reads dynamic segments from the URL — here, the :id part of /crop/:id
  const { id } = useParams();
  const [crop, setCrop] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5000/api/crops/${id}`)
      .then((res) => {
        setCrop(res.data);
        // STEP 2: Once we know the farmer_id, fetch their reviews too
        return axios.get(`http://localhost:5000/api/reviews/farmer/${res.data.farmer_id}`);
      })
      .then((res) => setReviews(res.data))
      .catch((err) => setError(err.response?.data?.error || "Crop not found"));
  }, [id]); // STEP 3: re-run this effect if the id in the URL ever changes

  if (error) return <p style={{ color: "var(--clay)" }}>{error}</p>;
  if (!crop) return <p style={{ color: "var(--mist-dim)" }}>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Link to="/" className="text-sm" style={{ color: "var(--gold)" }}>← Back to Marketplace</Link>

      <div className="rounded-2xl p-8 mt-4" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
        <h2 className="text-3xl font-display" style={{ color: "var(--mist)" }}>{crop.crop_name}</h2>
        <p className="text-4xl font-display mt-3" style={{ color: "var(--gold)" }}>
          ₹{crop.price}<span className="text-sm" style={{ color: "var(--mist-dim)" }}>/kg</span>
        </p>

        <div className="grid grid-cols-2 gap-4 mt-6 text-sm" style={{ color: "var(--mist-dim)" }}>
          <p>Available: <span style={{ color: "var(--mist)" }}>{crop.quantity} kg</span></p>
          <p>Status: <span style={{ color: "var(--mist)" }}>{crop.status}</span></p>
          <p>Organic: <span style={{ color: "var(--mist)" }}>{crop.organic ? "Yes" : "No"}</span></p>
          <p>Harvest Date: <span style={{ color: "var(--mist)" }}>{new Date(crop.harvest_date).toLocaleDateString()}</span></p>
        </div>

        {reviews && (
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2">
              <StarRating rating={parseFloat(reviews.average_rating) || 0} />
              <span className="text-sm" style={{ color: "var(--mist-dim)" }}>
                {reviews.average_rating ? parseFloat(reviews.average_rating).toFixed(1) : "No"} ({reviews.total_reviews} reviews)
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {reviews.reviews.map((r, i) => (
                <div key={i} className="text-sm p-3 rounded-lg" style={{ background: "var(--soil)" }}>
                  <StarRating rating={r.rating} />
                  <p className="mt-1" style={{ color: "var(--mist-dim)" }}>{r.comment}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--line)" }}>— {r.company_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CropDetail;