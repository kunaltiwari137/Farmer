import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

function PlaceOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get crop ID automatically from URL
  const cropId = searchParams.get("crop_id");

  const [crop, setCrop] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH SELECTED CROP
  // ==========================================
  useEffect(() => {
    if (!cropId) {
      setError("No crop selected.");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:5000/api/crops/${cropId}`)
      .then((response) => {
        setCrop(response.data);

        // Check crop availability
        if (response.data.status !== "available") {
          setError("This crop is no longer available.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch crop:", err);

        setError(
          err.response?.data?.error ||
            "Failed to load crop details"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cropId]);

  // ==========================================
  // HANDLE QUANTITY CHANGE
  // ==========================================
  const handleQuantityChange = (e) => {
    const value = e.target.value;

    setQuantity(value);
    setError("");

    // Empty input
    if (value === "") {
      return;
    }

    const enteredQuantity = Number(value);

    // Invalid quantity
    if (!Number.isFinite(enteredQuantity) || enteredQuantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    // More than available
    if (
      crop &&
      enteredQuantity > Number(crop.quantity)
    ) {
      setError(
        `Only ${crop.quantity} kg is available. Please enter a smaller quantity.`
      );
      return;
    }
  };

  // ==========================================
  // CONTINUE TO CHECKOUT
  // ==========================================
  const handleContinue = (e) => {
    e.preventDefault();

    setError("");

    // Crop check
    if (!cropId || !crop) {
      setError("No crop selected.");
      return;
    }

    // Availability check
    if (crop.status !== "available") {
      setError("This crop is no longer available.");
      return;
    }

    // Quantity check
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (Number(quantity) > Number(crop.quantity)) {
      setError(
        `Only ${crop.quantity} kg is available. Please enter a smaller quantity.`
      );
      return;
    }

    // Login check
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in before placing an order.");
      return;
    }

    // ==========================================
    // GO TO NEW CHECKOUT FLOW
    // ==========================================
    navigate(
      `/checkout?mode=buy-now&crop_id=${cropId}&quantity=${Number(
        quantity
      )}`
    );
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="max-w-sm mx-auto mt-10">
        <p
          className="text-center"
          style={{
            color: "var(--mist-dim)",
          }}
        >
          Loading crop...
        </p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">
        Buyer
      </p>

      <h2
        className="text-3xl mb-6"
        style={{
          color: "var(--mist)",
        }}
      >
        Place an Order
      </h2>

      <form
        onSubmit={handleContinue}
        className="rounded-2xl p-7"
        style={{
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >
        {/* ======================================
            SELECTED CROP
        ======================================= */}
        {crop && (
          <div
            className="rounded-xl p-4 mb-5"
            style={{
              background: "var(--soil)",
              border: "1px solid var(--line)",
            }}
          >
            <p
              className="text-lg font-semibold"
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
              ₹{crop.price}/kg
            </p>

            <p
              className="text-sm mt-1"
              style={{
                color: "var(--mist-dim)",
              }}
            >
              {crop.quantity} kg available
            </p>
          </div>
        )}

        {/* ======================================
            QUANTITY
        ======================================= */}
        <label
          className="text-xs uppercase tracking-wide"
          style={{
            color: "var(--mist-dim)",
          }}
        >
          Quantity (kg)
        </label>

        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={handleQuantityChange}
          placeholder="Enter quantity"
          className="w-full p-3 mt-1 mb-2 rounded-lg outline-none transition-colors"
          style={{
            background: "var(--soil)",
            border:
              crop &&
              quantity &&
              Number(quantity) > Number(crop.quantity)
                ? "1px solid var(--clay)"
                : "1px solid var(--line)",
            color: "var(--mist)",
          }}
        />

        {/* ======================================
            AVAILABILITY
        ======================================= */}
        {crop && (
          <p
            className="text-xs mb-4"
            style={{
              color: "var(--mist-dim)",
            }}
          >
            Maximum available: {crop.quantity} kg
          </p>
        )}

        {/* ======================================
            ESTIMATED TOTAL
        ======================================= */}
        {crop &&
          quantity &&
          Number(quantity) > 0 &&
          Number(quantity) <= Number(crop.quantity) && (
            <div
              className="flex justify-between items-center mb-5"
              style={{
                color: "var(--mist)",
              }}
            >
              <span>
                Estimated Total
              </span>

              <span
                className="text-xl font-semibold"
                style={{
                  color: "var(--gold)",
                }}
              >
                ₹
                {(
                  Number(quantity) *
                  Number(crop.price)
                ).toLocaleString("en-IN")}
              </span>
            </div>
          )}

        {/* ======================================
            ERROR
        ======================================= */}
        {error && (
          <p
            className="text-sm mb-4"
            style={{
              color: "var(--clay)",
            }}
          >
            ⚠ {error}
          </p>
        )}

        {/* ======================================
            CONTINUE BUTTON
        ======================================= */}
        <button
          type="submit"
          disabled={
            !crop ||
            crop.status !== "available" ||
            !quantity ||
            Number(quantity) <= 0 ||
            Number(quantity) > Number(crop?.quantity || 0)
          }
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{
            background:
              !crop ||
              crop.status !== "available" ||
              !quantity ||
              Number(quantity) <= 0 ||
              Number(quantity) > Number(crop?.quantity || 0)
                ? "var(--mist-dim)"
                : "var(--gold)",

            color: "var(--ink)",

            cursor:
              !crop ||
              crop.status !== "available" ||
              !quantity ||
              Number(quantity) <= 0 ||
              Number(quantity) > Number(crop?.quantity || 0)
                ? "not-allowed"
                : "pointer",
          }}
        >
          Continue to Checkout →
        </button>
      </form>
    </div>
  );
}

export default PlaceOrder;