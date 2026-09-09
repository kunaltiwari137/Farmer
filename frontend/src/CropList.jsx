import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LoadingTruck from "./LoadingTruck";
import StarRating from "./StarRating";
import TiltCard from "./TiltCard";

function CropList() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/crops")
      .then((response) => {
        setCrops(response.data);
        const uniqueFarmerIds = [...new Set(response.data.map((crop) => crop.farmer_id))];
        uniqueFarmerIds.forEach((farmerId) => {
          axios.get(`http://localhost:5000/api/reviews/farmer/${farmerId}`)
            .then((res) => {
              setRatings((prev) => ({ ...prev, [farmerId]: res.data.average_rating }));
            })
            .catch(() => {});
        });
      })
      .catch((error) => console.error("Failed to fetch crops:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTruck />;

  let visibleCrops = [...crops];

  if (searchTerm.trim() !== "") {
    visibleCrops = visibleCrops.filter((crop) =>
      crop.crop_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (organicOnly) {
    visibleCrops = visibleCrops.filter((crop) => crop.organic === 1);
  }
  if (maxPrice !== "") {
    visibleCrops = visibleCrops.filter((crop) => crop.price <= Number(maxPrice));
  }

  visibleCrops.sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const inputStyle = { background: "var(--soil-2)", border: "1px solid var(--line)", color: "var(--mist)" };

  return (
    <div>
      <p className="eyebrow mb-3">Marketplace</p>
      <h2 className="text-2xl sm:text-3xl mb-6" style={{ color: "var(--mist)" }}>Available Crops</h2>

      {/* STEP 1: Filter bar — stacks vertically on mobile, row on larger screens */}
      <div className="rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
        <div className="w-full sm:w-auto">
          <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "var(--mist-dim)" }}>Search</label>
          <input
            type="text"
            placeholder="e.g. Rice, Tomato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 rounded-lg text-sm w-full sm:w-48"
            style={inputStyle}
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "var(--mist-dim)" }}>Max Price (₹/kg)</label>
          <input
            type="number"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="p-2 rounded-lg text-sm w-full sm:w-28"
            style={inputStyle}
          />
        </div>

        <label className="flex items-center gap-2 text-sm pb-2" style={{ color: "var(--mist)" }}>
          <input
            type="checkbox"
            checked={organicOnly}
            onChange={(e) => setOrganicOnly(e.target.checked)}
          />
          Organic only
        </label>

        <div className="w-full sm:w-auto">
          <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "var(--mist-dim)" }}>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 rounded-lg text-sm w-full sm:w-auto"
            style={inputStyle}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {(searchTerm || organicOnly || maxPrice) && (
          <button
            onClick={() => { setSearchTerm(""); setOrganicOnly(false); setMaxPrice(""); }}
            className="text-sm pb-2 text-left"
            style={{ color: "var(--gold)" }}
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="text-sm mb-4" style={{ color: "var(--mist-dim)" }}>
        {visibleCrops.length} crop{visibleCrops.length !== 1 ? "s" : ""} found
      </p>

      {/* STEP 2: Grid — 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCrops.map((crop) => (
          <TiltCard key={crop.crop_id}>
            <Link to={`/crop/${crop.crop_id}`} className="block">
              <div
                className="rounded-2xl p-5 sm:p-6 h-full flex flex-col justify-between"
                style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
              >
                <div>
                  <p className="text-lg font-display" style={{ color: "var(--mist)" }}>{crop.crop_name}</p>
                  <p className="text-sm mt-2" style={{ color: "var(--mist-dim)" }}>
                    {crop.quantity} kg available
                  </p>
                  {crop.organic === 1 && (
                    <span
                      className="inline-block text-xs mt-2 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(124,154,85,0.15)", color: "var(--crop-solid)" }}
                    >
                      Organic
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-6 flex-wrap gap-2">
                  <span className="text-xl sm:text-2xl font-display" style={{ color: "var(--gold)" }}>
                    ₹{crop.price}
                    <span className="text-xs" style={{ color: "var(--mist-dim)" }}>/kg</span>
                  </span>
                  {ratings[crop.farmer_id] && (
                    <StarRating rating={parseFloat(ratings[crop.farmer_id])} />
                  )}
                </div>
              </div>
            </Link>
          </TiltCard>
        ))}
      </div>

      {visibleCrops.length === 0 && (
        <p className="text-center mt-10" style={{ color: "var(--mist-dim)" }}>
          No crops match your filters.
        </p>
      )}
    </div>
  );
}

export default CropList;