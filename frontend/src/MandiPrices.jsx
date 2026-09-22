import { useState, useEffect } from "react";
import axios from "axios";

function MandiPrices() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/mandi").then((res) => setPrices(res.data));
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <p className="eyebrow mb-3">Live Rates</p>
      <h2 className="text-3xl mb-8" style={{ color: "var(--mist)" }}>Mandi Prices</h2>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        {prices.length === 0 && (
          <p className="p-6 text-sm" style={{ color: "var(--mist-dim)" }}>No mandi prices set yet.</p>
        )}
        {prices.map((p) => (
          <div key={p._id} className="flex justify-between items-center p-4" style={{ background: "var(--soil-2)", borderBottom: "1px solid var(--line)" }}>
            <div>
              <p style={{ color: "var(--mist)" }}>{p.crop_name}</p>
              <p className="text-xs" style={{ color: "var(--mist-dim)" }}>{p.category} — {p.market_location}</p>
            </div>
            <p className="text-lg font-display" style={{ color: "var(--gold)" }}>₹{p.price_per_kg}/kg</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MandiPrices;