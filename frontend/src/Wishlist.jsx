import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ==========================================
  // FETCH WISHLIST
  // ==========================================

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        "http://localhost:5000/api/wishlist",
        authHeader
      );

      setWishlist(res.data);
    } catch (err) {
      console.error("Wishlist error:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load wishlist"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // ==========================================
  // REMOVE FROM WISHLIST
  // ==========================================

  const handleRemove = async (cropId) => {
    try {
      setRemoving(cropId);

      await axios.post(
        "http://localhost:5000/api/wishlist/toggle",
        {
          crop_id: cropId,
        },
        authHeader
      );

      setWishlist((current) =>
        current.filter(
          (crop) => crop._id !== cropId
        )
      );
    } catch (err) {
      console.error(
        "Remove wishlist error:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Failed to remove from wishlist"
      );
    } finally {
      setRemoving(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10">

        <p
          style={{
            color: "var(--mist-dim)",
          }}
        >
          Loading wishlist...
        </p>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">

        <p
          style={{
            color: "var(--clay)",
          }}
        >
          {error}
        </p>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto mt-10">

      {/* HEADER */}

      <div className="mb-8">

        <p className="eyebrow mb-3">
          Buyer
        </p>

        <h2
          className="text-3xl"
          style={{
            color: "var(--mist)",
          }}
        >
          ❤️ My Wishlist
        </h2>

        <p
          className="text-sm mt-2"
          style={{
            color: "var(--mist-dim)",
          }}
        >
          Save crops here and buy them later.
        </p>

      </div>

      {/* EMPTY WISHLIST */}

      {wishlist.length === 0 && (

        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--line)",
          }}
        >

          <div className="text-5xl mb-4">
            ❤️
          </div>

          <h3
            className="text-xl font-display mb-2"
            style={{
              color: "var(--mist)",
            }}
          >
            Your wishlist is empty
          </h3>

          <p
            className="text-sm mb-6"
            style={{
              color: "var(--mist-dim)",
            }}
          >
            Save your favorite crops here
            and come back to them later.
          </p>

          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-full font-semibold"
            style={{
              background: "var(--gold)",
              color: "var(--ink)",
            }}
          >
            Browse Crops
          </Link>

        </div>

      )}

      {/* WISHLIST ITEMS */}

      {wishlist.length > 0 && (

        <div className="space-y-4">

          {wishlist.map((crop) => (

            <div
              key={crop._id}
              className="rounded-2xl p-5 flex justify-between items-center gap-4 flex-wrap"
              style={{
                background: "var(--soil-2)",
                border: "1px solid var(--line)",
              }}
            >

              {/* CROP INFO */}

              <div className="flex-1">

                <p
                  className="text-lg font-display"
                  style={{
                    color: "var(--mist)",
                  }}
                >
                  {crop.crop_name}
                </p>

                <p
                  className="text-sm mt-1"
                  style={{
                    color: "var(--mist-dim)",
                  }}
                >
                  ₹{crop.price} / kg
                </p>

                {crop.quantity && (

                  <p
                    className="text-xs mt-1"
                    style={{
                      color: "var(--mist-dim)",
                    }}
                  >
                    Available: {crop.quantity} kg
                  </p>

                )}

                {crop.location && (

                  <p
                    className="text-xs mt-1"
                    style={{
                      color: "var(--mist-dim)",
                    }}
                  >
                    📍 {crop.location}
                  </p>

                )}

              </div>

              {/* ACTIONS */}

              <div className="flex items-center gap-2 flex-wrap">

                <Link
                  to={`/crop/${crop._id}`}
                  className="text-xs px-4 py-2 rounded-full"
                  style={{
                    border:
                      "1px solid var(--mist-dim)",
                    color: "var(--mist)",
                  }}
                >
                  View Crop
                </Link>

                <button
                  onClick={() =>
                    handleRemove(crop._id)
                  }
                  disabled={
                    removing === crop._id
                  }
                  className="text-xs px-4 py-2 rounded-full disabled:opacity-50"
                  style={{
                    border:
                      "1px solid var(--clay)",
                    color: "var(--clay)",
                  }}
                >
                  {removing === crop._id
                    ? "Removing..."
                    : "Remove"}
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default Wishlist;
