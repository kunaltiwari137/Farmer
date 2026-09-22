import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
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

  // ==========================================
  // FETCH ORDERS
  // ==========================================
  const fetchOrders = async () => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:5000/api/orders/my-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setOrders(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to load orders"
      );
    }
  };

  // ==========================================
  // FETCH DATA
  // ==========================================
  useEffect(() => {
    fetchOrders();

    if (!token) {
      return;
    }

    axios
      .get(
        "http://localhost:5000/api/dashboard/buyer-spending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      .then((res) => {
        setSpending(res.data);
      })
      .catch((err) => {
        console.error(
          "Failed to load spending:",
          err
        );
      });
  }, []);

  // ==========================================
  // PAYMENT
  // ==========================================
  const handlePay = async (orderId) => {
    setPayingId(orderId);

    try {
      await axios.post(
        "http://localhost:5000/api/payments",
        {
          order_id: orderId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Payment successful!");

      await fetchOrders();

    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Payment failed"
      );
    } finally {
      setPayingId(null);
    }
  };

  // ==========================================
  // REVIEW
  // ==========================================
  const handleSubmitReview = async (orderId) => {
    if (!comment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/reviews",
        {
          order_id: orderId,
          rating,
          comment: comment.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReviewedOrders((prev) => [
        ...prev,
        orderId
      ]);

      setReviewingId(null);
      setRating(5);
      setComment("");

      alert("Review submitted successfully!");

    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Failed to submit review"
      );
    }
  };

  const inputStyle = {
    background: "var(--soil)",
    border: "1px solid var(--line)",
    color: "var(--mist)"
  };

  // ==========================================
  // SAFE SPENDING DATA
  // ==========================================
  const spendingByCrop = Array.isArray(
    spending?.by_crop
  )
    ? spending.by_crop
    : [];

  return (
    <div className="max-w-2xl mx-auto mt-10 pb-16">

      <p className="eyebrow mb-3">
        Buyer
      </p>

      <h2
        className="text-3xl mb-8"
        style={{ color: "var(--mist)" }}
      >
        My Orders
      </h2>

      {/* ======================================
          SPENDING CHART
      ======================================= */}
      {spendingByCrop.length > 0 && (
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--line)"
          }}
        >
          <h3
            className="text-lg font-display mb-1"
            style={{ color: "var(--mist)" }}
          >
            Spending by Crop
          </h3>

          <p
            className="text-2xl font-display mb-4"
            style={{ color: "var(--gold)" }}
          >
            ₹
            {Number(
              spending?.total_spent || 0
            ).toLocaleString("en-IN")}{" "}
            total
          </p>

          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <BarChart data={spendingByCrop}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--line)"
              />

              <XAxis
                dataKey="crop_name"
                stroke="var(--mist-dim)"
                fontSize={12}
              />

              <YAxis
                stroke="var(--mist-dim)"
                fontSize={12}
              />

              <Tooltip
                contentStyle={{
                  background: "var(--soil)",
                  border:
                    "1px solid var(--line)",
                  borderRadius: "8px"
                }}
              />

              <Bar
                dataKey="spent"
                fill="var(--gold)"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ======================================
          ERROR
      ======================================= */}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--clay)",
            color: "var(--clay)"
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================
          NO ORDERS
      ======================================= */}
      {orders.length === 0 && !error && (
        <p
          style={{
            color: "var(--mist-dim)"
          }}
        >
          You haven't placed any orders yet.
        </p>
      )}

      {/* ======================================
          ORDERS
      ======================================= */}
      <div className="space-y-4">

        {orders.map((order) => {

          const address = order.delivery_address;

          return (
            <TiltCard key={order.order_id}>

              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--soil-2)",
                  border: "1px solid var(--line)"
                }}
              >

                {/* =================================
                    ORDER INFORMATION
                ================================== */}

                <p
                  className="text-lg font-display"
                  style={{
                    color: "var(--mist)"
                  }}
                >
                  {order.crop_name || "Crop"}
                </p>

                <p
                  className="text-sm mt-1"
                  style={{
                    color: "var(--mist-dim)"
                  }}
                >
                  Quantity: {order.quantity} kg
                </p>

                <p
                  className="text-sm"
                  style={{
                    color: "var(--mist-dim)"
                  }}
                >
                  Total:{" "}
                  <span
                    style={{
                      color: "var(--gold)"
                    }}
                  >
                    ₹
                    {Number(
                      order.total_amount || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </p>

                {/* =================================
                    DELIVERY ADDRESS
                ================================== */}

                {address && (
                  <div
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: "var(--soil)",
                      border:
                        "1px solid var(--line)"
                    }}
                  >
                    <p
                      className="text-xs uppercase tracking-wide mb-2"
                      style={{
                        color:
                          "var(--mist-dim)"
                      }}
                    >
                      Delivery Address
                    </p>

                    <p
                      className="text-sm"
                      style={{
                        color: "var(--mist)"
                      }}
                    >
                      {address.full_name}
                    </p>

                    <p
                      className="text-sm"
                      style={{
                        color:
                          "var(--mist-dim)"
                      }}
                    >
                      {address.house},{" "}
                      {address.area}
                    </p>

                    <p
                      className="text-sm"
                      style={{
                        color:
                          "var(--mist-dim)"
                      }}
                    >
                      {address.city},{" "}
                      {address.district},{" "}
                      {address.state} -{" "}
                      {address.pincode}
                    </p>

                    <p
                      className="text-sm"
                      style={{
                        color:
                          "var(--mist-dim)"
                      }}
                    >
                      Phone: {address.phone}
                    </p>

                    {address.landmark && (
                      <p
                        className="text-sm mt-1"
                        style={{
                          color:
                            "var(--mist-dim)"
                        }}
                      >
                        Landmark:{" "}
                        {address.landmark}
                      </p>
                    )}
                  </div>
                )}

                {/* =================================
                    ORDER TIMELINE
                ================================== */}

                <OrderTimeline
                  status={order.status}
                />

                {/* =================================
                    PAYMENT
                ================================== */}

                {order.status === "pending" && (
                  <button
                    onClick={() =>
                      handlePay(
                        order.order_id
                      )
                    }
                    disabled={
                      payingId ===
                      order.order_id
                    }
                    className="mt-4 px-5 py-2 rounded-full font-semibold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                    style={{
                      background:
                        "var(--gold)",
                      color: "var(--ink)"
                    }}
                  >
                    {payingId ===
                    order.order_id
                      ? "Processing..."
                      : "Pay Now"}
                  </button>
                )}

                {/* =================================
                    REVIEW
                ================================== */}

                {order.status === "delivered" &&
                  !reviewedOrders.includes(
                    order.order_id
                  ) && (

                    <div className="mt-4">

                      {reviewingId ===
                      order.order_id ? (

                        <div
                          className="rounded-xl p-4"
                          style={{
                            background:
                              "var(--soil)",
                            border:
                              "1px solid var(--line)"
                          }}
                        >

                          {/* Rating */}

                          <label
                            className="text-xs uppercase tracking-wide"
                            style={{
                              color:
                                "var(--mist-dim)"
                            }}
                          >
                            Rating
                          </label>

                          <select
                            value={rating}
                            onChange={(e) =>
                              setRating(
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="block w-full p-2 mt-1 mb-3 rounded-lg"
                            style={inputStyle}
                          >
                            {[5, 4, 3, 2, 1].map(
                              (n) => (
                                <option
                                  key={n}
                                  value={n}
                                >
                                  {n} Star
                                  {n > 1
                                    ? "s"
                                    : ""}
                                </option>
                              )
                            )}
                          </select>

                          {/* Comment */}

                          <label
                            className="text-xs uppercase tracking-wide"
                            style={{
                              color:
                                "var(--mist-dim)"
                            }}
                          >
                            Comment
                          </label>

                          <textarea
                            value={comment}
                            onChange={(e) =>
                              setComment(
                                e.target.value
                              )
                            }
                            placeholder="Write your review..."
                            rows="3"
                            className="w-full p-2 mt-1 mb-3 rounded-lg"
                            style={inputStyle}
                          />

                          {/* Review Buttons */}

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                handleSubmitReview(
                                  order.order_id
                                )
                              }
                              className="px-4 py-1.5 rounded-full text-sm font-semibold"
                              style={{
                                background:
                                  "var(--gold)",
                                color:
                                  "var(--ink)"
                              }}
                            >
                              Submit Review
                            </button>

                            <button
                              onClick={() => {
                                setReviewingId(
                                  null
                                );
                                setRating(5);
                                setComment("");
                              }}
                              className="px-4 py-1.5 rounded-full text-sm"
                              style={{
                                border:
                                  "1px solid var(--mist-dim)",
                                color:
                                  "var(--mist-dim)"
                              }}
                            >
                              Cancel
                            </button>

                          </div>

                        </div>

                      ) : (

                        <button
                          onClick={() =>
                            setReviewingId(
                              order.order_id
                            )
                          }
                          className="px-5 py-2 rounded-full text-sm font-semibold"
                          style={{
                            border:
                              "1px solid var(--gold)",
                            color:
                              "var(--gold)"
                          }}
                        >
                          Leave a Review
                        </button>

                      )}

                    </div>
                  )}

              </div>

            </TiltCard>
          );
        })}

      </div>

    </div>
  );
}

export default MyOrders;