import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const cropId = searchParams.get("crop_id");
  const quantityFromUrl =
    Number(searchParams.get("quantity")) || 1;

  const token = localStorage.getItem("token");

  const [crop, setCrop] = useState(null);
  const [cart, setCart] = useState(null);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // DELIVERY ADDRESS
  // ==========================================
  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    house: "",
    area: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  // ==========================================
  // HANDLE ADDRESS CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // LOAD CHECKOUT DATA
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          setError("Please login as a buyer first.");
          return;
        }

        // ======================================
        // BUY NOW
        // ======================================
        if (mode === "buy-now" && cropId) {
          const res = await axios.get(
            `http://localhost:5000/api/crops/${cropId}`
          );

          const cropData = res.data;

          // Check crop availability
          if (cropData.status !== "available") {
            setError(
              "This crop is no longer available."
            );
            return;
          }

          // Check quantity
          if (quantityFromUrl > cropData.quantity) {
            setError(
              `Only ${cropData.quantity} kg available.`
            );
            return;
          }

          setCrop({
            ...cropData,
            checkoutQuantity: quantityFromUrl,
          });

          return;
        }

        // ======================================
        // CART CHECKOUT
        // ======================================
        if (mode === "cart") {
          const res = await axios.get(
            "http://localhost:5000/api/cart",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (
            !res.data ||
            !res.data.items ||
            res.data.items.length === 0
          ) {
            setError("Your cart is empty.");
            return;
          }

          setCart(res.data);

          return;
        }

        // ======================================
        // INVALID CHECKOUT
        // ======================================
        setError("Invalid checkout request.");
      } catch (err) {
        console.error(
          "Checkout loading error:",
          err
        );

        setError(
          err.response?.data?.error ||
            "Failed to load checkout details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mode, cropId, quantityFromUrl, token]);

  // ==========================================
  // VALIDATE ADDRESS
  // ==========================================
  const validateAddress = () => {
    const requiredFields = [
      "full_name",
      "phone",
      "house",
      "area",
      "city",
      "district",
      "state",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (!address[field].trim()) {
        setError(
          `Please enter ${field
            .replace("_", " ")}`
        );

        return false;
      }
    }

    // Phone validation
    if (!/^\d{10}$/.test(address.phone.trim())) {
      setError(
        "Phone number must be exactly 10 digits."
      );

      return false;
    }

    // Pincode validation
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setError(
        "Pincode must be exactly 6 digits."
      );

      return false;
    }

    return true;
  };

  // ==========================================
  // BUY NOW ORDER
  // ==========================================
  const placeBuyNowOrder = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/orders",
      {
        crop_id: crop._id,
        quantity: crop.checkoutQuantity,
        delivery_address: address,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  };

  // ==========================================
  // CART ORDER
  // ==========================================
  const placeCartOrder = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/cart/checkout",
      {
        delivery_address: address,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  };

  // ==========================================
  // PLACE ORDER
  // ==========================================
  const handlePlaceOrder = async () => {
    setError("");

    // Validate address
    if (!validateAddress()) {
      return;
    }

    try {
      setPlacingOrder(true);

      let result;

      // ========================================
      // BUY NOW
      // ========================================
      if (mode === "buy-now") {
        result = await placeBuyNowOrder();
      }

      // ========================================
      // CART
      // ========================================
      else if (mode === "cart") {
        result = await placeCartOrder();
      }

      // ========================================
      // INVALID MODE
      // ========================================
      else {
        setError("Invalid checkout mode.");
        return;
      }

      console.log(
        "Order placed successfully:",
        result
      );

      alert("Order placed successfully!");

      navigate("/my-orders");
    } catch (err) {
      console.error(
        "Place order error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to place order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 px-4">
        <p style={{ color: "var(--mist-dim)" }}>
          Loading checkout...
        </p>
      </div>
    );
  }

  // ==========================================
  // COMPLETE ERROR
  // ==========================================
  if (error && !crop && !cart) {
    return (
      <div className="max-w-4xl mx-auto mt-10 px-4">

        <div
          className="p-5 rounded-xl"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--clay)",
          }}
        >
          <p style={{ color: "var(--clay)" }}>
            {error}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-5 py-2 rounded-full"
            style={{
              border:
                "1px solid var(--line)",
              color: "var(--mist-dim)",
            }}
          >
            ← Go Back
          </button>
        </div>

      </div>
    );
  }

  // ==========================================
  // PREPARE ITEMS
  // ==========================================
  let items = [];

  // ==========================================
  // BUY NOW ITEM
  // ==========================================
  if (mode === "buy-now" && crop) {
    items = [
      {
        id: crop._id,
        crop_name: crop.crop_name,
        quantity: crop.checkoutQuantity,
        price: crop.price,
        image_url: crop.image_url,
      },
    ];
  }

  // ==========================================
  // CART ITEMS
  // ==========================================
  if (mode === "cart" && cart) {
    items = cart.items.map((item) => ({
      id: item.crop_id?._id,
      crop_name: item.crop_id?.crop_name,
      quantity: item.quantity,
      price: item.crop_id?.price || 0,
      image_url: item.crop_id?.image_url,
    }));
  }

  // ==========================================
  // TOTAL
  // ==========================================
  const total = items.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity,
    0
  );

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 pb-16">

      {/* ======================================
          HEADER
      ======================================= */}
      <p className="eyebrow mb-3">
        Buyer
      </p>

      <h2
        className="text-3xl mb-8"
        style={{
          color: "var(--mist)",
        }}
      >
        Checkout
      </h2>

      {/* ======================================
          ERROR MESSAGE
      ======================================= */}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl"
          style={{
            background: "var(--soil-2)",
            border:
              "1px solid var(--clay)",
            color: "var(--clay)",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ====================================
            LEFT SIDE
        ===================================== */}
        <div className="lg:col-span-2 space-y-6">

          {/* ==================================
              DELIVERY ADDRESS
          =================================== */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--soil-2)",
              border:
                "1px solid var(--line)",
            }}
          >

            <h3
              className="text-xl font-semibold mb-5"
              style={{
                color: "var(--mist)",
              }}
            >
              Delivery Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* FULL NAME */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  Full Name *
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={address.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* PHONE */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  maxLength="10"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* HOUSE */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  House / Flat / Building *
                </label>

                <input
                  type="text"
                  name="house"
                  value={address.house}
                  onChange={handleChange}
                  placeholder="House / Flat / Building"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* AREA */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  Street / Area *
                </label>

                <input
                  type="text"
                  name="area"
                  value={address.area}
                  onChange={handleChange}
                  placeholder="Street / Area"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* CITY */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  Village / Town / City *
                </label>

                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="Village / Town / City"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* DISTRICT */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  District *
                </label>

                <input
                  type="text"
                  name="district"
                  value={address.district}
                  onChange={handleChange}
                  placeholder="District"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* STATE */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  State *
                </label>

                <input
                  type="text"
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* PINCODE */}
              <div>
                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  Pincode *
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={address.pincode}
                  onChange={handleChange}
                  placeholder="6 digit pincode"
                  maxLength="6"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />
              </div>

              {/* LANDMARK */}
              <div className="md:col-span-2">

                <label
                  className="text-sm block mb-2"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  Landmark
                </label>

                <input
                  type="text"
                  name="landmark"
                  value={address.landmark}
                  onChange={handleChange}
                  placeholder="Nearby landmark (optional)"
                  className="w-full p-3 rounded-lg"
                  style={{
                    background:
                      "var(--soil)",
                    border:
                      "1px solid var(--line)",
                    color:
                      "var(--mist)",
                  }}
                />

              </div>

            </div>
          </div>

        </div>

        {/* ====================================
            RIGHT SIDE - ORDER SUMMARY
        ===================================== */}
        <div>

          <div
            className="rounded-2xl p-6 sticky top-6"
            style={{
              background: "var(--soil-2)",
              border:
                "1px solid var(--line)",
            }}
          >

            <h3
              className="text-xl font-semibold mb-5"
              style={{
                color: "var(--mist)",
              }}
            >
              Order Summary
            </h3>

            {/* ITEMS */}
            <div className="space-y-4">

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3"
                  style={{
                    borderBottom:
                      "1px solid var(--line)",
                    paddingBottom: "12px",
                  }}
                >

                  {/* IMAGE */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.crop_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{
                        background:
                          "var(--soil)",
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      🌾
                    </div>
                  )}

                  {/* ITEM INFO */}
                  <div className="flex-1">

                    <p
                      className="font-semibold"
                      style={{
                        color:
                          "var(--mist)",
                      }}
                    >
                      {item.crop_name}
                    </p>

                    <p
                      className="text-sm"
                      style={{
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      {item.quantity} kg × ₹
                      {item.price}
                    </p>

                    <p
                      className="text-sm mt-1"
                      style={{
                        color:
                          "var(--gold)",
                      }}
                    >
                      ₹
                      {item.quantity *
                        item.price}
                    </p>

                  </div>

                </div>
              ))}

            </div>

            {/* TOTAL */}
            <div
              className="flex justify-between mt-6 pt-4"
              style={{
                borderTop:
                  "1px solid var(--line)",
              }}
            >

              <span
                className="text-lg"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                Total
              </span>

              <span
                className="text-2xl font-display"
                style={{
                  color:
                    "var(--gold)",
                }}
              >
                ₹{total}
              </span>

            </div>

            {/* PLACE ORDER */}
            <button
              onClick={handlePlaceOrder}
              disabled={
                placingOrder ||
                items.length === 0
              }
              className="w-full mt-6 px-6 py-3 rounded-full font-semibold disabled:opacity-50"
              style={{
                background:
                  "var(--gold)",
                color:
                  "var(--ink)",
              }}
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>

            {/* BACK */}
            <button
              onClick={() => navigate(-1)}
              disabled={placingOrder}
              className="w-full mt-3 px-6 py-3 rounded-full text-sm"
              style={{
                border:
                  "1px solid var(--line)",
                color:
                  "var(--mist-dim)",
              }}
            >
              ← Back
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Checkout;