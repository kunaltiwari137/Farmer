import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import TiltCard from "./TiltCard";
import OrderTimeline from "./OrderTimeline";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [spending, setSpending] = useState(null);
  const token = localStorage.getItem("token");

  const fetchOrders = () => {
    axios.get("http://localhost:5000/api/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => setOrders(response.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"));
  };

  // STEP 1: Fetch spending analytics when the page loads
  useEffect(() => {
    fetchOrders();

    axios.get("http://localhost:5000/api/dashboard/buyer-spending", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setSpending(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handlePay = async (orderId) => {
    setPayingId(orderId);
    try {
      await axios.post(
        "http://localhost:5000/api/payments",
        { order_id: orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  const handleSubmitReview = async (orderId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/reviews",
        { order_id: orderId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewedOrders((prev) => [...prev, orderId]);
      setReviewingId(null);
      setRating(5);
      setComment("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit review");
    }
  };

  const inputStyle = { background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <p className="eyebrow mb-3">Buyer</p>
      <h2 className="text-3xl mb-8" style={{ color: "var(--mist)" }}>My Orders</h2>

      {/* STEP 2: Spending chart — only render if there's actual spending data */}
      {spending && spending.by_crop.length > 0 && (
        <div className="rounded-2xl p-6 mb-8" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
          <h3 className="text-lg font-display mb-1" style={{ color: "var(--mist)" }}>Spending by Crop</h3>
          <p className="text-2xl font-display mb-4" style={{ color: "var(--gold)" }}>₹{spending.total_spent} total</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spending.by_crop}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="crop_name" stroke="var(--mist-dim)" fontSize={12} />
              <YAxis stroke="var(--mist-dim)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--soil)", border: "1px solid var(--line)", borderRadius: "8px" }} />
              <Bar dataKey="spent" fill="var(--gold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {error && <p style={{ color: "var(--clay)" }}>{error}</p>}
      {orders.length === 0 && !error && (
        <p style={{ color: "var(--mist-dim)" }}>You haven't placed any orders yet.</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <TiltCard key={order.order_id}>
            <div className="rounded-2xl p-6" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
              <p className="text-lg font-display" style={{ color: "var(--mist)" }}>{order.crop_name}</p>
              <p className="text-sm mt-1" style={{ color: "var(--mist-dim)" }}>Quantity: {order.quantity} kg</p>
              <p className="text-sm" style={{ color: "var(--mist-dim)" }}>Total: <span style={{ color: "var(--gold)" }}>₹{order.total_amount}</span></p>

              <OrderTimeline status={order.status} />

              {order.status === "pending" && (
                <button
                  onClick={() => handlePay(order.order_id)}
                  disabled={payingId === order.order_id}
                  className="mt-4 px-5 py-2 rounded-full font-semibold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "var(--gold)", color: "var(--ink)" }}
                >
                  {payingId === order.order_id ? "Processing..." : "Pay Now"}
                </button>
              )}

              {order.status === "delivered" && !reviewedOrders.includes(order.order_id) && (
                <div className="mt-4">
                  {reviewingId === order.order_id ? (
                    <div className="rounded-xl p-4" style={{ background: "var(--soil)", border: "1px solid var(--line)" }}>
                      <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Rating</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="block w-full p-2 mt-1 mb-3 rounded-lg"
                        style={inputStyle}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>
                        ))}
                      </select>

                      <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Comment</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-2 mt-1 mb-3 rounded-lg"
                        style={inputStyle}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitReview(order.order_id)}
                          className="px-4 py-1.5 rounded-full text-sm font-semibold"
                          style={{ background: "var(--gold)", color: "var(--ink)" }}
                        >
                          Submit Review
                        </button>
                        <button
                          onClick={() => setReviewingId(null)}
                          className="px-4 py-1.5 rounded-full text-sm"
                          style={{ border: "1px solid var(--mist-dim)", color: "var(--mist-dim)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(order.order_id)}
                      className="px-5 py-2 rounded-full text-sm font-semibold"
                      style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
                    >
                      Leave a Review
                    </button>
                  )}
                </div>
              )}
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

export default MyOrders;