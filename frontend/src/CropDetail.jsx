import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import StarRating from "./StarRating";

function CropDetail() {
  const { id } = useParams();

  const [crop, setCrop] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [actionMessage, setActionMessage] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // ==========================================
  // LOAD CROP
  // ==========================================

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/crops/${id}`)
      .then((res) => {
        setCrop(res.data);

        return axios.get(
          `http://localhost:5000/api/reviews/farmer/${res.data.farmer_id}`
        );
      })
      .then((res) => {
        setReviews(res.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Crop not found"
        );
      });
  }, [id]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = async () => {
    setActionMessage("");

    if (!token) {
      setActionMessage("Please login as a buyer first.");
      return;
    }

    if (!qty || qty <= 0) {
      setActionMessage("Please enter a valid quantity.");
      return;
    }

    if (qty > crop.quantity) {
      setActionMessage(
        `Only ${crop.quantity} kg available.`
      );
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/cart/add",
        {
          crop_id: crop._id,
          quantity: qty,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActionMessage("Added to cart!");
    } catch (err) {
      setActionMessage(
        err.response?.data?.error ||
          "Please log in as a buyer to add to cart"
      );
    }
  };

  // ==========================================
  // BUY NOW
  // ==========================================

  const handleBuyNow = () => {
    setActionMessage("");

    if (!token) {
      setActionMessage("Please login as a buyer first.");
      return;
    }

    if (!qty || qty <= 0) {
      setActionMessage("Please enter a valid quantity.");
      return;
    }

    if (qty > crop.quantity) {
      setActionMessage(
        `Only ${crop.quantity} kg available.`
      );
      return;
    }

    navigate(
      `/checkout?mode=buy-now&crop_id=${crop._id}&quantity=${qty}`
    );
  };

  // ==========================================
  // CHANGE IMAGE
  // ==========================================

  const changeImage = (index) => {
    setActiveImageIndex(index);
  };

  // ==========================================
  // PREVIOUS IMAGE
  // ==========================================

  const previousImage = () => {
    setActiveImageIndex((current) => {
      if (current === 0) {
        return gallery.length - 1;
      }

      return current - 1;
    });
  };

  // ==========================================
  // NEXT IMAGE
  // ==========================================

  const nextImage = () => {
    setActiveImageIndex((current) => {
      if (current === gallery.length - 1) {
        return 0;
      }

      return current + 1;
    });
  };

  // ==========================================
  // KEYBOARD CONTROLS
  // ==========================================

  useEffect(() => {
    if (!imageOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) => {
          if (current === 0) {
            return gallery.length - 1;
          }

          return current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) => {
          if (current === gallery.length - 1) {
            return 0;
          }

          return current + 1;
        });
      }

      if (event.key === "Escape") {
        setImageOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageOpen]);

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  if (error) {
    return (
      <p style={{ color: "var(--clay)" }}>
        {error}
      </p>
    );
  }

  if (!crop) {
    return (
      <p style={{ color: "var(--mist-dim)" }}>
        Loading...
      </p>
    );
  }

  // ==========================================
  // IMAGE GALLERY
  // ==========================================

  const gallery =
    crop.image_urls && crop.image_urls.length > 0
      ? crop.image_urls
      : crop.image_url
      ? [crop.image_url]
      : [];

  const currentImage = gallery[activeImageIndex];

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="max-w-5xl mx-auto mt-10">

      {/* ======================================
          BACK
      ======================================= */}

      <Link
        to="/"
        className="text-sm"
        style={{ color: "var(--gold)" }}
      >
        ← Back to Marketplace
      </Link>

      <div
        className="rounded-2xl overflow-hidden mt-4"
        style={{
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >

        {/* ======================================
            IMAGE GALLERY
        ======================================= */}

        {gallery.length > 0 ? (
          <div
            className="p-4 sm:p-6"
            style={{
              background: "var(--soil-2)",
            }}
          >

            <div className="flex flex-col sm:flex-row gap-4">

              {/* ==================================
                  THUMBNAILS
              ================================== */}

              {gallery.length > 1 && (
                <div
                  className="
                    order-2
                    sm:order-1
                    flex
                    sm:flex-col
                    gap-3
                    overflow-x-auto
                    sm:overflow-y-auto
                    sm:max-h-[460px]
                    sm:w-24
                  "
                >
                  {gallery.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        changeImage(index)
                      }
                      className="
                        flex-shrink-0
                        rounded-xl
                        overflow-hidden
                        transition
                      "
                      style={{
                        border:
                          activeImageIndex === index
                            ? "2px solid var(--gold)"
                            : "2px solid var(--line)",
                        opacity:
                          activeImageIndex === index
                            ? 1
                            : 0.65,
                      }}
                    >
                      <img
                        src={url}
                        alt={`${crop.crop_name} ${index + 1}`}
                        className="
                          w-20
                          h-20
                          sm:w-20
                          sm:h-20
                          object-cover
                        "
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* ==================================
                  MAIN IMAGE
              ================================== */}

              <div
                className="
                  order-1
                  sm:order-2
                  flex-1
                  relative
                  rounded-2xl
                  overflow-hidden
                "
                style={{
                  background: "var(--soil)",
                  border: "1px solid var(--line)",
                }}
              >

                <img
                  src={currentImage}
                  alt={crop.crop_name}
                  onClick={() => setImageOpen(true)}
                  className="
                    w-full
                    h-[320px]
                    sm:h-[460px]
                    object-contain
                    cursor-zoom-in
                  "
                />

                {/* ==================================
                    IMAGE COUNTER
                ================================== */}

                {gallery.length > 1 && (
                  <div
                    className="
                      absolute
                      bottom-3
                      left-1/2
                      -translate-x-1/2
                      px-3
                      py-1
                      rounded-full
                      text-xs
                    "
                    style={{
                      background:
                        "rgba(0,0,0,0.7)",
                      color: "white",
                    }}
                  >
                    {activeImageIndex + 1} /{" "}
                    {gallery.length}
                  </div>
                )}

                {/* ==================================
                    PREVIOUS BUTTON
                ================================== */}

                {gallery.length > 1 && (
                  <button
                    type="button"
                    onClick={previousImage}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      w-10
                      h-10
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xl
                    "
                    style={{
                      background:
                        "rgba(0,0,0,0.65)",
                      color: "white",
                    }}
                  >
                    ‹
                  </button>
                )}

                {/* ==================================
                    NEXT BUTTON
                ================================== */}

                {gallery.length > 1 && (
                  <button
                    type="button"
                    onClick={nextImage}
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      w-10
                      h-10
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xl
                    "
                    style={{
                      background:
                        "rgba(0,0,0,0.65)",
                      color: "white",
                    }}
                  >
                    ›
                  </button>
                )}

                {/* ==================================
                    ZOOM MESSAGE
                ================================== */}

                <div
                  className="
                    absolute
                    top-3
                    right-3
                    px-3
                    py-1
                    rounded-full
                    text-xs
                  "
                  style={{
                    background:
                      "rgba(0,0,0,0.65)",
                    color: "white",
                  }}
                >
                  Click to enlarge
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-64 flex items-center justify-center text-sm"
            style={{
              background: "var(--soil)",
              color: "var(--mist-dim)",
            }}
          >
            No image available
          </div>
        )}

        {/* ======================================
            CROP DETAILS
        ======================================= */}

        <div className="p-8">

          <h2
            className="text-3xl font-display"
            style={{ color: "var(--mist)" }}
          >
            {crop.crop_name}
          </h2>

          <p
            className="text-4xl font-display mt-3"
            style={{ color: "var(--gold)" }}
          >
            ₹{crop.price}

            <span
              className="text-sm"
              style={{ color: "var(--mist-dim)" }}
            >
              /kg
            </span>
          </p>

          {/* ======================================
              QUANTITY + ACTIONS
          ======================================= */}

          <div className="flex items-center gap-3 mt-4 flex-wrap">

            <input
              type="number"
              min="1"
              max={crop.quantity}
              value={qty}
              onChange={(e) =>
                setQty(Number(e.target.value))
              }
              className="w-20 p-2 rounded-lg text-center"
              style={{
                background: "var(--soil)",
                border: "1px solid var(--line)",
                color: "var(--mist)",
              }}
            />

            {/* ADD TO CART */}

            <button
              onClick={handleAddToCart}
              disabled={
                crop.status !== "available" ||
                crop.quantity <= 0
              }
              className="px-5 py-2 rounded-full font-semibold text-sm disabled:opacity-50"
              style={{
                border: "1px solid var(--gold)",
                color: "var(--gold)",
              }}
            >
              Add to Cart
            </button>

            {/* BUY NOW */}

            <button
              onClick={handleBuyNow}
              disabled={
                crop.status !== "available" ||
                crop.quantity <= 0
              }
              className="px-5 py-2 rounded-full font-semibold text-sm disabled:opacity-50"
              style={{
                background: "var(--gold)",
                color: "var(--ink)",
              }}
            >
              Buy Now
            </button>

            {/* CHAT */}

            <Link
              to={`/chat?crop=${crop._id}`}
              className="px-5 py-2 rounded-full font-semibold text-sm inline-block"
              style={{
                border: "1px solid var(--mist-dim)",
                color: "var(--mist-dim)",
              }}
            >
              Chat with Farmer
            </Link>
          </div>

          {/* ======================================
              ACTION MESSAGE
          ======================================= */}

          {actionMessage && (
            <p
              className="text-sm mt-3"
              style={{ color: "var(--crop-solid)" }}
            >
              {actionMessage}
            </p>
          )}

          {/* ======================================
              CROP INFORMATION
          ======================================= */}

          <div
            className="grid grid-cols-2 gap-4 mt-6 text-sm"
            style={{ color: "var(--mist-dim)" }}
          >
            <p>
              Available:{" "}
              <span style={{ color: "var(--mist)" }}>
                {crop.quantity} kg
              </span>
            </p>

            <p>
              Status:{" "}
              <span style={{ color: "var(--mist)" }}>
                {crop.status}
              </span>
            </p>

            <p>
              Organic:{" "}
              <span style={{ color: "var(--mist)" }}>
                {crop.organic ? "Yes" : "No"}
              </span>
            </p>

            <p>
              Category:{" "}
              <span style={{ color: "var(--mist)" }}>
                {crop.category}
              </span>
            </p>

            <p>
              Harvest Date:{" "}
              <span style={{ color: "var(--mist)" }}>
                {crop.harvest_date
                  ? new Date(
                      crop.harvest_date
                    ).toLocaleDateString()
                  : "Not specified"}
              </span>
            </p>
          </div>

          {/* ======================================
              FARMER PROFILE
          ======================================= */}

          <Link
            to={`/farmer/${crop.farmer_id}`}
            className="inline-block mt-4 text-sm"
            style={{ color: "var(--gold)" }}
          >
            View Farmer Profile →
          </Link>

          {/* ======================================
              REVIEWS
          ======================================= */}

          {reviews && (
            <div
              className="mt-8 pt-6"
              style={{
                borderTop: "1px solid var(--line)",
              }}
            >
              <div className="flex items-center gap-2">

                <StarRating
                  rating={
                    parseFloat(
                      reviews.average_rating
                    ) || 0
                  }
                />

                <span
                  className="text-sm"
                  style={{
                    color: "var(--mist-dim)",
                  }}
                >
                  {reviews.average_rating > 0
                    ? parseFloat(
                        reviews.average_rating
                      ).toFixed(1)
                    : "No"}{" "}
                  ({reviews.total_reviews} reviews)
                </span>
              </div>

              <div className="mt-4 space-y-3">

                {reviews.reviews.map((r, i) => (
                  <div
                    key={i}
                    className="text-sm p-3 rounded-lg"
                    style={{
                      background: "var(--soil)",
                    }}
                  >
                    <StarRating
                      rating={r.rating}
                    />

                    <p
                      className="mt-1"
                      style={{
                        color: "var(--mist-dim)",
                      }}
                    >
                      {r.comment}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{
                        color: "var(--line)",
                      }}
                    >
                      — {r.company_name}
                    </p>
                  </div>
                ))}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================
          FULLSCREEN IMAGE VIEWER
      ======================================= */}

      {imageOpen && gallery.length > 0 && (
        <div
          onClick={() => setImageOpen(false)}
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-center
            justify-center
            p-6
          "
          style={{
            background: "rgba(0,0,0,0.94)",
          }}
        >

          {/* CLOSE */}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImageOpen(false);
            }}
            className="
              absolute
              top-5
              right-5
              w-10
              h-10
              rounded-full
              text-2xl
              flex
              items-center
              justify-center
            "
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
            }}
          >
            ✕
          </button>

          {/* FULLSCREEN IMAGE */}

          <img
            src={currentImage}
            alt={crop.crop_name}
            onClick={(e) => e.stopPropagation()}
            className="
              max-w-full
              max-h-[85vh]
              object-contain
              rounded-lg
            "
          />

          {/* PREVIOUS */}

          {gallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                previousImage();
              }}
              className="
                absolute
                left-5
                top-1/2
                -translate-y-1/2
                w-12
                h-12
                rounded-full
                text-3xl
              "
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
              }}
            >
              ‹
            </button>
          )}

          {/* NEXT */}

          {gallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="
                absolute
                right-5
                top-1/2
                -translate-y-1/2
                w-12
                h-12
                rounded-full
                text-3xl
              "
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
              }}
            >
              ›
            </button>
          )}

          {/* COUNTER */}

          {gallery.length > 1 && (
            <div
              className="
                absolute
                bottom-6
                left-1/2
                -translate-x-1/2
                px-4
                py-2
                rounded-full
                text-sm
              "
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "white",
              }}
            >
              {activeImageIndex + 1} /{" "}
              {gallery.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CropDetail;