import { useState } from "react";
import axios from "axios";

function ListCrop() {
  const [cropName, setCropName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [organic, setOrganic] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/crops",
        {
          crop_name: cropName,
          quantity: Number(quantity),
          price: Number(price),
          harvest_date: harvestDate,
          organic,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`Crop listed! ID: ${response.data.crop_id}`);
      setCropName("");
      setQuantity("");
      setPrice("");
      setHarvestDate("");
      setOrganic(false);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to list crop");
    }
  };

  const inputStyle = {
    background: "var(--soil)",
    border: "1px solid var(--line)",
    color: "var(--mist)",
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Farmer</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>List a Crop</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Crop Name</label>
        <input
          type="text"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Quantity (kg)</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Price per kg</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Harvest Date</label>
        <input
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="flex items-center gap-2 mb-5 text-sm" style={{ color: "var(--mist)" }}>
          <input
            type="checkbox"
            checked={organic}
            onChange={(e) => setOrganic(e.target.checked)}
          />
          Organic
        </label>

        {error && <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>{error}</p>}
        {message && <p className="text-sm mb-4" style={{ color: "var(--crop-solid)" }}>{message}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          List Crop
        </button>
      </form>
    </div>
  );
}

export default ListCrop;