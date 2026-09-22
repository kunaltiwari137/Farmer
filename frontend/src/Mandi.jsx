import { useEffect, useState } from "react";
import axios from "axios";

function Mandi() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMandiPrices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/mandi");
      setPrices(res.data);
    } catch (error) {
      console.error("Failed to fetch mandi prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandiPrices();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">

      <p className="eyebrow mb-3">Market</p>

      <h2
        className="text-3xl mb-2"
        style={{ color: "var(--mist)" }}
      >
        Mandi Prices
      </h2>

      <p
        className="text-sm mb-8"
        style={{ color: "var(--mist-dim)" }}
      >
        Check the latest market prices set by the administrator.
      </p>

      {loading ? (
        <p style={{ color: "var(--mist-dim)" }}>
          Loading mandi prices...
        </p>
      ) : prices.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--line)",
          }}
        >
          <p style={{ color: "var(--mist-dim)" }}>
            No mandi prices available right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {prices.map((price) => (
            <div
              key={price._id}
              className="rounded-2xl p-5"
              style={{
                background: "var(--soil-2)",
                border: "1px solid var(--line)",
              }}
            >

              <div className="flex justify-between items-start mb-4">

                <div>
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: "var(--mist)" }}
                  >
                    {price.crop_name}
                  </h3>

                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--mist-dim)" }}
                  >
                    {price.category}
                  </p>
                </div>

                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: "var(--soil)",
                    color: "var(--gold)",
                  }}
                >
                  Mandi
                </span>

              </div>

              <div className="mb-4">

                <p
                  className="text-3xl font-display"
                  style={{ color: "var(--gold)" }}
                >
                  ₹{price.price_per_kg}
                </p>

                <p
                  className="text-xs"
                  style={{ color: "var(--mist-dim)" }}
                >
                  per kg
                </p>

              </div>

              <div
                className="text-xs pt-3"
                style={{
                  borderTop: "1px solid var(--line)",
                  color: "var(--mist-dim)",
                }}
              >
                📍 {price.market_location || "General"}
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Mandi;