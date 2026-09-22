import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import StarRating from "./StarRating";
import TiltCard from "./TiltCard";

function FarmerProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5000/api/farmers/${id}/profile`)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.data?.error || "Farmer not found"));
  }, [id]);

  if (error) return <p style={{ color: "var(--clay)" }}>{error}</p>;
  if (!profile) return <p style={{ color: "var(--mist-dim)" }}>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <p className="eyebrow mb-3">Farmer Profile</p>
      <div className="rounded-2xl p-7 mb-8" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display" style={{ background: "var(--gold)", color: "var(--ink)" }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-display" style={{ color: "var(--mist)" }}>{profile.name}</h2>
            <p className="text-sm" style={{ color: "var(--mist-dim)" }}>{profile.village}, {profile.district}, {profile.state}</p>
            {profile.verified && (
              <span className="text-xs" style={{ color: "var(--crop-solid)" }}>✓ Verified Farmer</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <StarRating rating={profile.average_rating} />
          <span className="text-sm" style={{ color: "var(--mist-dim)" }}>
            {profile.average_rating > 0 ? profile.average_rating.toFixed(1) : "No"} ({profile.total_reviews} reviews)
          </span>
        </div>
      </div>

      <h3 className="text-xl font-display mb-4" style={{ color: "var(--mist)" }}>Active Listings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {profile.crops.map((crop) => (
          <TiltCard key={crop._id}>
            <Link to={`/crop/${crop._id}`} className="block">
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
                {crop.image_url && <img src={crop.image_url} alt={crop.crop_name} className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <p style={{ color: "var(--mist)" }}>{crop.crop_name}</p>
                  <p className="text-sm" style={{ color: "var(--gold)" }}>₹{crop.price}/kg</p>
                </div>
              </div>
            </Link>
          </TiltCard>
        ))}
      </div>

      <h3 className="text-xl font-display mb-4" style={{ color: "var(--mist)" }}>Reviews</h3>
      <div className="space-y-3">
        {profile.reviews.map((r, i) => (
          <div key={i} className="text-sm p-3 rounded-lg" style={{ background: "var(--soil-2)" }}>
            <StarRating rating={r.rating} />
            <p className="mt-1" style={{ color: "var(--mist-dim)" }}>{r.comment}</p>
            <p className="text-xs mt-1" style={{ color: "var(--line)" }}>— {r.company_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FarmerProfile;