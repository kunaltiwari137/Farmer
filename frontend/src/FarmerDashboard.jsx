import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import TiltCard from "./TiltCard";
import OrderTimeline from "./OrderTimeline";

function FarmerDashboard() {
  const [stats, setStats] = useState(null);
  const [myCrops, setMyCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topCrops, setTopCrops] = useState([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:5000/api/dashboard/farmer-stats", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load stats"));

    axios.get("http://localhost:5000/api/dashboard/my-crops", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setMyCrops(res.data))
      .catch((err) => console.error(err));

    axios.get("http://localhost:5000/api/dashboard/farmer-revenue", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setRevenueData(res.data))
      .catch((err) => console.error(err));

    axios.get("http://localhost:5000/api/dashboard/farmer-top-crops", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setTopCrops(res.data))
      .catch((err) => console.error(err));

    fetchOrders();
  }, []);

  const fetchOrders = () => {
    axios.get("http://localhost:5000/api/orders/farmer-orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => setOrders(response.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"));
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.put(
        `http://localhost:5000/api/payments/order/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm("Delete this crop listing?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/crops/${cropId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCrops((prev) => prev.filter((c) => c.crop_id !== cropId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete crop");
    }
  };

  const StatCard = ({ label, value }) => (
    <TiltCard>
      <div className="rounded-2xl p-5 text-center" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
        <p className="text-2xl font-display" style={{ color: "var(--gold)" }}>{value}</p>
        <p className="text-xs uppercase tracking-wide mt-1" style={{ color: "var(--mist-dim)" }}>{label}</p>
      </div>
    </TiltCard>
  );

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <p className="eyebrow mb-3">Farmer</p>
      <h2 className="text-3xl mb-8" style={{ color: "var(--mist)" }}>Dashboard</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          <StatCard label="Crops Listed" value={stats.total_crops} />
          <StatCard label="Total Orders" value={stats.total_orders} />
          <StatCard label="Revenue" value={`₹${stats.total_revenue}`} />
          <StatCard label="Avg Rating" value={stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : "—"} />
          <StatCard label="Reviews" value={stats.total_reviews} />
        </div>
      )}

      {revenueData.length > 0 && (
        <div className="rounded-2xl p-6 mb-10" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
          <h3 className="text-lg font-display mb-4" style={{ color: "var(--mist)" }}>Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="month" stroke="var(--mist-dim)" fontSize={12} />
              <YAxis stroke="var(--mist-dim)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "var(--soil)", border: "1px solid var(--line)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--mist)" }}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2} dot={{ fill: "var(--gold)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {topCrops.length > 0 && (
        <div className="rounded-2xl p-6 mb-10" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
          <h3 className="text-lg font-display mb-4" style={{ color: "var(--mist)" }}>Top Selling Crops</h3>
          <div className="space-y-2">
            {topCrops.map((crop, i) => (
              <div key={i} className="flex justify-between text-sm flex-wrap gap-1">
                <span style={{ color: "var(--mist)" }}>{crop.crop_name}</span>
                <span style={{ color: "var(--mist-dim)" }}>
                  {crop.total_sold} kg — <span style={{ color: "var(--gold)" }}>₹{crop.total_earned}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-xl font-display mb-4" style={{ color: "var(--mist)" }}>My Crop Listings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {myCrops.map((crop) => (
          <div
            key={crop.crop_id}
            className="rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
            style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
          >
            <div>
              <p className="font-display" style={{ color: "var(--mist)" }}>{crop.crop_name}</p>
              <p className="text-xs" style={{ color: "var(--mist-dim)" }}>
                {crop.quantity} kg — ₹{crop.price}/kg
              </p>
              <p className="text-xs uppercase mt-1" style={{ color: crop.status === "available" ? "var(--crop-solid)" : "var(--clay)" }}>
                {crop.status}
              </p>
            </div>
            <button
              onClick={() => handleDeleteCrop(crop.crop_id)}
              className="text-xs px-3 py-1.5 rounded-full w-fit"
              style={{ border: "1px solid var(--clay)", color: "var(--clay)" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-display mb-4" style={{ color: "var(--mist)" }}>Orders on My Crops</h3>
      {error && <p style={{ color: "var(--clay)" }}>{error}</p>}
      {orders.length === 0 && !error && (
        <p style={{ color: "var(--mist-dim)" }}>No orders yet.</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <TiltCard key={order.order_id}>
            <div className="rounded-2xl p-6" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
              <p className="text-lg font-display" style={{ color: "var(--mist)" }}>{order.crop_name}</p>
              <p className="text-sm mt-1" style={{ color: "var(--mist-dim)" }}>Ordered by: {order.company_name}</p>
              <p className="text-sm" style={{ color: "var(--mist-dim)" }}>Quantity: {order.quantity} kg</p>
              <p className="text-sm" style={{ color: "var(--mist-dim)" }}>Total: <span style={{ color: "var(--gold)" }}>₹{order.total_amount}</span></p>

              <OrderTimeline status={order.status} />

              {order.status === "confirmed" && (
                <button
                  onClick={() => handleUpdateStatus(order.order_id, "shipped")}
                  disabled={updatingId === order.order_id}
                  className="mt-4 px-5 py-2 rounded-full font-semibold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "var(--crop-solid)", color: "var(--ink)" }}
                >
                  {updatingId === order.order_id ? "Updating..." : "Mark as Shipped"}
                </button>
              )}

              {order.status === "shipped" && (
                <button
                  onClick={() => handleUpdateStatus(order.order_id, "delivered")}
                  disabled={updatingId === order.order_id}
                  className="mt-4 px-5 py-2 rounded-full font-semibold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "var(--gold)", color: "var(--ink)" }}
                >
                  {updatingId === order.order_id ? "Updating..." : "Mark as Delivered"}
                </button>
              )}
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

export default FarmerDashboard;