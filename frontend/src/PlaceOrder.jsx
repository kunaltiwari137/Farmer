import { useState } from "react";
import axios from "axios";

function PlaceOrder() {
  const [cropId, setCropId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/orders",
        { crop_id: Number(cropId), quantity: Number(quantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`Order placed! Total: ₹${response.data.total_amount}`);
      setCropId("");
      setQuantity("");

    } catch (err) {
      setError(err.response?.data?.error || "Failed to place order");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Buyer</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>Place an Order</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Crop ID</label>
        <input
          type="number"
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none transition-colors"
          style={{ background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" }}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Quantity (kg)</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full p-3 mt-1 mb-5 rounded-lg outline-none transition-colors"
          style={{ background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" }}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        {error && <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>{error}</p>}
        {message && <p className="text-sm mb-4" style={{ color: "var(--crop-solid)" }}>{message}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Place Order
        </button>
      </form>
    </div>
  );
}

export default PlaceOrder;