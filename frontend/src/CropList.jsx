import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingTruck from "./LoadingTruck";
import StarRating from "./StarRating";
import TiltCard from "./TiltCard";

function CropList() {
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  // Wishlist state
  const [wishlisted, setWishlisted] = useState({});
  const [wishlistLoading, setWishlistLoading] = useState({});

  // Cart state
  const [cartLoading, setCartLoading] = useState({});

  const token = localStorage.getItem("token");

  // ==========================================
  // GET CURRENT USER ROLE
  // ==========================================

  const storedUser = localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      "Failed to read user from localStorage:",
      error
    );
  }

  const userRole = currentUser?.role?.toLowerCase();

  const isBuyer = userRole === "buyer";

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/crops")
      .then((response) => {
        setCrops(response.data);

        const uniqueFarmerIds = [
          ...new Set(
            response.data.map(
              (crop) => crop.farmer_id
            )
          ),
        ];

        uniqueFarmerIds.forEach((farmerId) => {
          axios
            .get(
              `http://localhost:5000/api/reviews/farmer/${farmerId}`
            )
            .then((res) => {
              setRatings((prev) => ({
                ...prev,
                [farmerId]:
                  res.data.average_rating,
              }));
            })
            .catch(() => {});
        });

        // Check existing wishlist after crops are loaded
        if (token) {
          axios
            .get(
              "http://localhost:5000/api/wishlist",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            .then((wishlistResponse) => {
              const savedCrops = {};

              wishlistResponse.data.forEach(
                (crop) => {
                  if (crop?._id) {
                    savedCrops[crop._id] =
                      true;
                  }
                }
              );

              setWishlisted(savedCrops);
            })
            .catch((err) => {
              console.error(
                "Failed to load wishlist:",
                err
              );
            });
        }
      })
      .catch((error) =>
        console.error(
          "Failed to fetch crops:",
          error
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  // ==========================================
  // TOGGLE WISHLIST
  // ==========================================

  const handleWishlist = async (
    e,
    cropId
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert(
        "Please log in to save crops"
      );
      return;
    }

    if (wishlistLoading[cropId]) {
      return;
    }

    try {
      setWishlistLoading((prev) => ({
        ...prev,
        [cropId]: true,
      }));

      const res = await axios.post(
        "http://localhost:5000/api/wishlist/toggle",
        {
          crop_id: cropId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWishlisted((prev) => ({
        ...prev,
        [cropId]: res.data.wishlisted,
      }));
    } catch (err) {
      console.error(
        "Wishlist error:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Failed to update wishlist"
      );
    } finally {
      setWishlistLoading((prev) => ({
        ...prev,
        [cropId]: false,
      }));
    }
  };

  // ==========================================
  // BUY NOW
  // ==========================================

  const handleBuyNow = (
    e,
    cropId
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert(
        "Please log in to buy crops"
      );
      return;
    }

    navigate(
      `/checkout?mode=buy-now&crop_id=${cropId}&quantity=1`
    );
  };

  // ==========================================
  // BUY IN BULK
  // ==========================================

  const handleBulkOrder = (
    e,
    cropName
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert(
        "Please log in to place a bulk order"
      );
      return;
    }

    navigate(
      `/bulk-order?crop_name=${encodeURIComponent(
        cropName
      )}`
    );
  };

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = async (
    e,
    cropId,
    availableQuantity
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert(
        "Please log in to add crops to cart"
      );
      return;
    }

    if (availableQuantity <= 0) {
      alert("This crop is sold out");
      return;
    }

    if (cartLoading[cropId]) {
      return;
    }

    try {
      setCartLoading((prev) => ({
        ...prev,
        [cropId]: true,
      }));

      await axios.post(
        "http://localhost:5000/api/cart/add",
        {
          crop_id: cropId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Crop added to cart successfully"
      );
    } catch (err) {
      console.error(
        "Add to cart error:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Failed to add crop to cart"
      );
    } finally {
      setCartLoading((prev) => ({
        ...prev,
        [cropId]: false,
      }));
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <LoadingTruck />;
  }

  let visibleCrops = [...crops];

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  if (searchTerm.trim() !== "") {
    visibleCrops =
      visibleCrops.filter((crop) =>
        crop.crop_name
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )
      );
  }

  // ==========================================
  // ORGANIC FILTER
  // ==========================================

  if (organicOnly) {
    visibleCrops =
      visibleCrops.filter(
        (crop) => crop.organic === true
      );
  }

  // ==========================================
  // MAXIMUM PRICE FILTER
  // ==========================================

  if (maxPrice !== "") {
    visibleCrops =
      visibleCrops.filter(
        (crop) =>
          crop.price <=
          Number(maxPrice)
      );
  }

  // ==========================================
  // SORTING
  // ==========================================

  visibleCrops.sort((a, b) => {
    if (sortBy === "price-low") {
      return a.price - b.price;
    }

    if (sortBy === "price-high") {
      return b.price - a.price;
    }

    if (sortBy === "newest") {
      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    }

    return 0;
  });

  const inputStyle = {
    background: "var(--soil-2)",
    border: "1px solid var(--line)",
    color: "var(--mist)",
  };

  return (
    <div>
      <p className="eyebrow mb-3">
        Marketplace
      </p>

      <h2
        className="text-2xl sm:text-3xl mb-6"
        style={{
          color: "var(--mist)",
        }}
      >
        Available Crops
      </h2>

      {/* ==========================================
          FILTERS
      ========================================== */}

      <div
        className="rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end"
        style={{
          background:
            "var(--soil-2)",
          border:
            "1px solid var(--line)",
        }}
      >
        {/* Search */}

        <div className="w-full sm:w-auto">
          <label
            className="text-xs uppercase tracking-wide block mb-1"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            Search
          </label>

          <input
            type="text"
            placeholder="e.g. Rice, Tomato..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="p-2 rounded-lg text-sm w-full sm:w-48"
            style={inputStyle}
          />
        </div>

        {/* Maximum price */}

        <div className="w-full sm:w-auto">
          <label
            className="text-xs uppercase tracking-wide block mb-1"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            Max Price (₹/kg)
          </label>

          <input
            type="number"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(
                e.target.value
              )
            }
            className="p-2 rounded-lg text-sm w-full sm:w-28"
            style={inputStyle}
          />
        </div>

        {/* Organic */}

        <label
          className="flex items-center gap-2 text-sm pb-2"
          style={{
            color: "var(--mist)",
          }}
        >
          <input
            type="checkbox"
            checked={organicOnly}
            onChange={(e) =>
              setOrganicOnly(
                e.target.checked
              )
            }
          />

          Organic only
        </label>

        {/* Sort */}

        <div className="w-full sm:w-auto">
          <label
            className="text-xs uppercase tracking-wide block mb-1"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            Sort by
          </label>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
            className="p-2 rounded-lg text-sm w-full sm:w-auto"
            style={inputStyle}
          >
            <option value="newest">
              Newest First
            </option>

            <option value="price-low">
              Price: Low to High
            </option>

            <option value="price-high">
              Price: High to Low
            </option>
          </select>
        </div>

        {/* Clear filters */}

        {(searchTerm ||
          organicOnly ||
          maxPrice) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setOrganicOnly(false);
              setMaxPrice("");
            }}
            className="text-sm pb-2 text-left"
            style={{
              color:
                "var(--gold)",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ==========================================
          BULK ORDER BANNER
          ONLY BUYER CAN SEE THIS
      ========================================== */}

      {isBuyer && (
        <div
          className="rounded-2xl p-5 sm:p-6 mb-8"
          style={{
            background:
              "var(--soil-2)",
            border:
              "1px solid var(--line)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p
                className="text-lg font-display"
                style={{
                  color:
                    "var(--mist)",
                }}
              >
                Need a large quantity?
              </p>

              <p
                className="text-sm mt-1"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                Send a request to
                multiple farmers to
                fulfill one large order.
              </p>
            </div>

            <button
              onClick={() => {
                if (!token) {
                  alert(
                    "Please log in to place a bulk order"
                  );
                  return;
                }

                navigate("/bulk-order");
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap"
              style={{
                background:
                  "var(--gold)",
                color:
                  "var(--soil)",
              }}
            >
              Bulk Order
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          CROP COUNT
      ========================================== */}

      <p
        className="text-sm mb-4"
        style={{
          color:
            "var(--mist-dim)",
        }}
      >
        {visibleCrops.length} crop
        {visibleCrops.length !== 1
          ? "s"
          : ""}{" "}
        found
      </p>

      {/* ==========================================
          CROP CARDS
      ========================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCrops.map((crop) => (
          <TiltCard
            key={crop._id}
          >
            <Link
              to={`/crop/${crop._id}`}
              className="block"
            >
              <div
                className="rounded-2xl overflow-hidden h-full flex flex-col justify-between"
                style={{
                  background:
                    "var(--soil-2)",
                  border:
                    "1px solid var(--line)",
                  position:
                    "relative",
                }}
              >
                {/* ==========================================
                    CROP IMAGE
                ========================================== */}

                <div className="relative">
                  {crop.image_url ? (
                    <img
                      src={
                        crop.image_url
                      }
                      alt={
                        crop.crop_name
                      }
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-40 flex items-center justify-center text-xs"
                      style={{
                        background:
                          "var(--soil)",
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      No image
                    </div>
                  )}

                  {/* Wishlist Heart */}

                  <button
                    onClick={(e) =>
                      handleWishlist(
                        e,
                        crop._id
                      )
                    }
                    disabled={
                      wishlistLoading[
                        crop._id
                      ]
                    }
                    aria-label={
                      wishlisted[
                        crop._id
                      ]
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition"
                    style={{
                      background:
                        wishlisted[
                          crop._id
                        ]
                          ? "rgba(255, 255, 255, 0.95)"
                          : "rgba(0, 0, 0, 0.65)",

                      color:
                        wishlisted[
                          crop._id
                        ]
                          ? "#e63946"
                          : "#ffffff",

                      border:
                        wishlisted[
                          crop._id
                        ]
                          ? "1px solid #ffffff"
                          : "1px solid var(--line)",

                      opacity:
                        wishlistLoading[
                          crop._id
                        ]
                          ? 0.5
                          : 1,

                      cursor:
                        wishlistLoading[
                          crop._id
                        ]
                          ? "not-allowed"
                          : "pointer",

                      boxShadow:
                        wishlisted[
                          crop._id
                        ]
                          ? "0 0 12px rgba(255, 255, 255, 0.5)"
                          : "none",
                    }}
                  >
                    {wishlisted[
                      crop._id
                    ]
                      ? "♥"
                      : "♡"}
                  </button>
                </div>

                {/* ==========================================
                    CROP INFORMATION
                ========================================== */}

                <div className="p-5 sm:p-6">
                  {/* Crop name */}

                  <p
                    className="text-lg font-display"
                    style={{
                      color:
                        "var(--mist)",
                    }}
                  >
                    {crop.crop_name}
                  </p>

                  {/* Crop ID */}

                  <p
                    className="text-xs mt-1"
                    style={{
                      color:
                        "var(--mist-dim)",
                    }}
                  >
                    Crop ID:{" "}
                    {crop._id}
                  </p>

                  {/* Available quantity */}

                  <p
                    className="text-sm mt-2"
                    style={{
                      color:
                        crop.quantity ===
                        0
                          ? "#e63946"
                          : crop.quantity <=
                            10
                          ? "var(--gold)"
                          : "var(--mist-dim)",
                    }}
                  >
                    {crop.quantity ===
                    0
                      ? "Sold out"
                      : crop.quantity <=
                        10
                      ? `⚠️ Only ${crop.quantity} kg left`
                      : `${crop.quantity} kg available`}
                  </p>

                  {/* Organic */}

                  {crop.organic && (
                    <span
                      className="inline-block text-xs mt-2 px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          "rgba(124,154,85,0.15)",
                        color:
                          "var(--crop-solid)",
                      }}
                    >
                      Organic
                    </span>
                  )}

                  {/* Price + Rating */}

                  <div className="flex items-center justify-between mt-6 flex-wrap gap-2">
                    <span
                      className="text-xl sm:text-2xl font-display"
                      style={{
                        color:
                          "var(--gold)",
                      }}
                    >
                      ₹{crop.price}

                      <span
                        className="text-xs"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        /kg
                      </span>
                    </span>

                    {ratings[
                      crop.farmer_id
                    ] > 0 && (
                      <StarRating
                        rating={parseFloat(
                          ratings[
                            crop.farmer_id
                          ]
                        )}
                      />
                    )}
                  </div>

                  {/* ==========================================
                      BUY NOW
                  ========================================== */}

                  <button
                    onClick={(e) =>
                      handleBuyNow(
                        e,
                        crop._id
                      )
                    }
                    disabled={
                      crop.quantity <=
                      0
                    }
                    className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    style={{
                      background:
                        "var(--gold)",
                      color:
                        "var(--soil)",
                    }}
                  >
                    {crop.quantity <=
                    0
                      ? "Sold Out"
                      : "Buy Now"}
                  </button>

                  {/* ==========================================
                      ADD TO CART
                  ========================================== */}

                  <button
                    onClick={(e) =>
                      handleAddToCart(
                        e,
                        crop._id,
                        crop.quantity
                      )
                    }
                    disabled={
                      crop.quantity <=
                        0 ||
                      cartLoading[
                        crop._id
                      ]
                    }
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    style={{
                      background:
                        "transparent",
                      color:
                        "var(--gold)",
                      border:
                        "1px solid var(--gold)",
                    }}
                  >
                    {cartLoading[
                      crop._id
                    ]
                      ? "Adding..."
                      : crop.quantity <=
                        0
                      ? "Sold Out"
                      : "Add to Cart"}
                  </button>

                  {/* ==========================================
                      BUY IN BULK
                      ONLY BUYER CAN SEE THIS
                  ========================================== */}

                  {isBuyer && (
                    <button
                      onClick={(e) =>
                        handleBulkOrder(
                          e,
                          crop.crop_name
                        )
                      }
                      disabled={
                        crop.quantity <=
                        0
                      }
                      className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      style={{
                        background:
                          "rgba(124,154,85,0.12)",
                        color:
                          "var(--crop-solid)",
                        border:
                          "1px solid var(--crop-solid)",
                      }}
                    >
                      {crop.quantity <=
                      0
                        ? "Sold Out"
                        : "Buy in Bulk"}
                    </button>
                  )}
                </div>
              </div>
            </Link>
          </TiltCard>
        ))}
      </div>

      {/* ==========================================
          NO CROPS
      ========================================== */}

      {visibleCrops.length === 0 && (
        <p
          className="text-center mt-10"
          style={{
            color:
              "var(--mist-dim)",
          }}
        >
          No crops match your
          filters.
        </p>
      )}
    </div>
  );
}

export default CropList;