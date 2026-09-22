import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Cart() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const [updatingCrop, setUpdatingCrop] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // ==========================================
  // FETCH CART
  // ==========================================
  const fetchCart = async () => {
    try {
      setError("");

      const res = await axios.get(
        "http://localhost:5000/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCart(res.data);
    } catch (err) {
      console.error("Fetch cart error:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load cart"
      );
    }
  };

  // ==========================================
  // LOAD CART
  // ==========================================
  useEffect(() => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    fetchCart();
  }, []);

  // ==========================================
  // UPDATE QUANTITY
  // ==========================================
  const updateQuantity = async (crop_id, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    try {
      setError("");
      setUpdatingCrop(crop_id);

      const res = await axios.put(
        `http://localhost:5000/api/cart/${crop_id}`,
        {
          quantity: newQuantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update quantity directly in UI
      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.map((item) =>
          item.crop_id?._id === crop_id
            ? {
                ...item,
                quantity: res.data.quantity,
              }
            : item
        ),
      }));
    } catch (err) {
      console.error(
        "Update cart quantity error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to update quantity"
      );
    } finally {
      setUpdatingCrop(null);
    }
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================
  const increaseQuantity = (item) => {
    const cropId = item.crop_id?._id;

    if (!cropId) return;

    updateQuantity(
      cropId,
      item.quantity + 1
    );
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================
  const decreaseQuantity = (item) => {
    const cropId = item.crop_id?._id;

    if (!cropId) return;

    if (item.quantity <= 1) {
      return;
    }

    updateQuantity(
      cropId,
      item.quantity - 1
    );
  };

  // ==========================================
  // REMOVE ITEM
  // ==========================================
  const handleRemove = async (crop_id) => {
    try {
      setError("");
      setUpdatingCrop(crop_id);

      await axios.delete(
        `http://localhost:5000/api/cart/${crop_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchCart();
    } catch (err) {
      console.error(
        "Remove cart item error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to remove item"
      );
    } finally {
      setUpdatingCrop(null);
    }
  };

  // ==========================================
  // CHECKOUT
  // ==========================================
  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    navigate("/checkout?mode=cart");
  };

  // ==========================================
  // NOT LOGGED IN / ERROR
  // ==========================================
  if (error && !cart) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <p style={{ color: "var(--clay)" }}>
          {error}
        </p>
      </div>
    );
  }

  // ==========================================
  // LOADING
  // ==========================================
  if (!cart) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <p style={{ color: "var(--mist-dim)" }}>
          Loading...
        </p>
      </div>
    );
  }

  // ==========================================
  // CALCULATE TOTAL
  // ==========================================
  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      (item.crop_id?.price || 0) *
        item.quantity,
    0
  );

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <p className="eyebrow mb-3">
        Buyer
      </p>

      <h2
        className="text-3xl mb-8"
        style={{ color: "var(--mist)" }}
      >
        My Cart
      </h2>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}
      {error && (
        <div
          className="mb-5 p-3 rounded-lg"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--clay)",
            color: "var(--clay)",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================
          EMPTY CART
      ====================================== */}
      {cart.items.length === 0 && (
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--line)",
          }}
        >
          <p style={{ color: "var(--mist-dim)" }}>
            Your cart is empty.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-4 px-5 py-2 rounded-full font-semibold"
            style={{
              background: "var(--gold)",
              color: "var(--ink)",
            }}
          >
            Browse Crops
          </button>
        </div>
      )}

      {/* ======================================
          CART ITEMS
      ====================================== */}
      {cart.items.length > 0 && (
        <>
          <div className="space-y-4">
            {cart.items.map((item) => {
              const cropId = item.crop_id?._id;

              const itemTotal =
                (item.crop_id?.price || 0) *
                item.quantity;

              const isUpdating =
                updatingCrop === cropId;

              return (
                <div
                  key={cropId}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--soil-2)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                    {/* =================================
                        PRODUCT INFORMATION
                    ================================= */}
                    <div className="flex items-center gap-4">
                      {item.crop_id?.image_url ? (
                        <img
                          src={item.crop_id.image_url}
                          alt={
                            item.crop_id?.crop_name
                          }
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center"
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

                      <div>
                        <p
                          className="font-semibold text-lg"
                          style={{
                            color: "var(--mist)",
                          }}
                        >
                          {item.crop_id?.crop_name}
                        </p>

                        <p
                          className="text-sm mt-1"
                          style={{
                            color:
                              "var(--mist-dim)",
                          }}
                        >
                          ₹
                          {item.crop_id?.price ||
                            0}
                          /kg
                        </p>

                        <p
                          className="text-sm mt-1"
                          style={{
                            color:
                              "var(--gold)",
                          }}
                        >
                          ₹{itemTotal}
                        </p>
                      </div>
                    </div>

                    {/* =================================
                        QUANTITY CONTROLS
                    ================================= */}
                    <div className="flex items-center gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(item)
                        }
                        disabled={
                          item.quantity <= 1 ||
                          isUpdating
                        }
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold disabled:opacity-40"
                        style={{
                          border:
                            "1px solid var(--line)",
                          color:
                            "var(--mist)",
                          background:
                            "var(--soil)",
                        }}
                      >
                        −
                      </button>

                      <div
                        className="min-w-[80px] text-center"
                      >
                        <p
                          className="font-semibold"
                          style={{
                            color:
                              "var(--mist)",
                          }}
                        >
                          {item.quantity} kg
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(item)
                        }
                        disabled={isUpdating}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold disabled:opacity-40"
                        style={{
                          border:
                            "1px solid var(--gold)",
                          color:
                            "var(--gold)",
                          background:
                            "var(--soil)",
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* =================================
                        REMOVE BUTTON
                    ================================= */}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(cropId)
                      }
                      disabled={isUpdating}
                      className="text-xs px-3 py-2 rounded-full disabled:opacity-40"
                      style={{
                        border:
                          "1px solid var(--clay)",
                        color:
                          "var(--clay)",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================
              CART TOTAL
          ====================================== */}
          <div
            className="mt-6 p-5 rounded-xl"
            style={{
              background: "var(--soil-2)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="flex justify-between items-center">
              <p
                className="text-lg"
                style={{
                  color: "var(--mist-dim)",
                }}
              >
                Total
              </p>

              <p
                className="text-2xl font-display"
                style={{
                  color: "var(--gold)",
                }}
              >
                ₹{total}
              </p>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full mt-5 px-6 py-3 rounded-full font-semibold"
              style={{
                background: "var(--gold)",
                color: "var(--ink)",
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;