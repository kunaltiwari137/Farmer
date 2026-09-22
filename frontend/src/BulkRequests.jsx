import { useEffect, useState } from "react";
import axios from "axios";
import TiltCard from "./TiltCard";

function BulkRequests() {
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submittingId, setSubmittingId] =
    useState(null);

  const [offerData, setOfferData] = useState({});

  const token = localStorage.getItem("token");

  // ==========================================
  // FETCH FARMER BULK REQUESTS
  // ==========================================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError(
          "Please log in as a farmer to view bulk requests."
        );
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/bulk-requests/farmer",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : [];

      setRequests(data);

      // ========================================
      // Create initial form state
      // ========================================

      const initialOfferData = {};

      data.forEach((request) => {
        const firstCrop =
          request.matching_crops?.[0];

        initialOfferData[
          request.request_id
        ] = {
          crop_id:
            firstCrop?.crop_id || "",

          quantity: "",

          price:
            request.target_price !== null &&
            request.target_price !== undefined
              ? String(
                  request.target_price
                )
              : "",
        };
      });

      setOfferData(
        initialOfferData
      );
    } catch (err) {
      console.error(
        "Fetch farmer bulk requests error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to fetch bulk requests"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==========================================
  // UPDATE OFFER FORM
  // ==========================================

  const handleOfferChange = (
    requestId,
    field,
    value
  ) => {
    setOfferData((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [field]: value,
      },
    }));
  };

  // ==========================================
  // SUBMIT OFFER
  // ==========================================

  const handleSubmitOffer = async (
    request
  ) => {
    setError("");

    const data =
      offerData[request.request_id] || {};

    // ----------------------------------------
    // Crop validation
    // ----------------------------------------

    if (!data.crop_id) {
      setError(
        "Please select a crop listing."
      );
      return;
    }

    // ----------------------------------------
    // Quantity validation
    // ----------------------------------------

    const quantity =
      Number(data.quantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Offer quantity must be greater than 0."
      );
      return;
    }

    // ----------------------------------------
    // Check against request remaining
    // ----------------------------------------

    if (
      quantity >
      Number(request.remaining_quantity)
    ) {
      setError(
        `You can offer maximum ${request.remaining_quantity} kg for this request.`
      );
      return;
    }

    // ----------------------------------------
    // Check against farmer stock
    // ----------------------------------------

    const selectedCrop =
      request.matching_crops?.find(
        (crop) =>
          String(crop.crop_id) ===
          String(data.crop_id)
      );

    if (!selectedCrop) {
      setError(
        "Selected crop listing was not found."
      );
      return;
    }

    if (
      quantity >
      Number(selectedCrop.quantity)
    ) {
      setError(
        `You only have ${selectedCrop.quantity} kg available in this crop listing.`
      );
      return;
    }

    // ----------------------------------------
    // Price validation
    // ----------------------------------------

    const price =
      Number(data.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Please enter a valid price per kg."
      );
      return;
    }

    try {
      setSubmittingId(
        request.request_id
      );

      await axios.post(
        `http://localhost:5000/api/bulk-requests/${request.request_id}/offers`,
        {
          crop_id:
            data.crop_id,

          quantity,

          price,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      alert(
        "Bulk offer submitted successfully!"
      );

      // ----------------------------------------
      // Refresh requests
      // ----------------------------------------

      await fetchRequests();
    } catch (err) {
      console.error(
        "Submit bulk offer error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to submit bulk offer"
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-16">

        <p className="eyebrow mb-3">
          Farmer
        </p>

        <h2
          className="text-3xl"
          style={{
            color: "var(--mist)",
          }}
        >
          Bulk Requests
        </h2>

        <div
          className="rounded-2xl p-8 text-center mt-8"
          style={{
            background:
              "var(--soil-2)",
            border:
              "1px solid var(--line)",
          }}
        >
          <div className="text-3xl mb-3">
            📦
          </div>

          <p
            className="text-sm"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            Loading bulk requests...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto pb-16">

      {/* ==========================================
          HEADER
      ========================================== */}

      <p className="eyebrow mb-3">
        Farmer
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

        <div>
          <h2
            className="text-3xl"
            style={{
              color: "var(--mist)",
            }}
          >
            Bulk Requests
          </h2>

          <p
            className="text-sm mt-2"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            View bulk requirements from
            buyers and submit your supply
            offer.
          </p>
        </div>

        <div
          className="px-4 py-2 rounded-full text-sm"
          style={{
            background:
              "rgba(124,154,85,0.12)",
            color:
              "var(--crop-solid)",
            border:
              "1px solid var(--crop-solid)",
          }}
        >
          {requests.length} Request
          {requests.length !== 1
            ? "s"
            : ""}
        </div>
      </div>

      {/* ==========================================
          ERROR
      ========================================== */}

      {error && (
        <div
          className="rounded-xl p-4 mb-5 text-sm"
          style={{
            background:
              "rgba(230,57,70,0.1)",
            border:
              "1px solid rgba(230,57,70,0.4)",
            color: "#e63946",
          }}
        >
          {error}
        </div>
      )}

      {/* ==========================================
          NO REQUESTS
      ========================================== */}

      {requests.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background:
              "var(--soil-2)",
            border:
              "1px solid var(--line)",
          }}
        >
          <div className="text-4xl mb-4">
            📦
          </div>

          <h3
            className="text-xl font-display"
            style={{
              color:
                "var(--mist)",
            }}
          >
            No bulk requests yet
          </h3>

          <p
            className="text-sm mt-2 max-w-md mx-auto"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            When a buyer needs a large
            quantity of a crop that you
            have listed, the request will
            appear here.
          </p>
        </div>
      )}

      {/* ==========================================
          REQUESTS
      ========================================== */}

      {requests.length > 0 && (
        <div className="space-y-5">

          {requests.map((request) => {
            const currentOffer =
              offerData[
                request.request_id
              ] || {};

            const hasPendingOffer =
              Boolean(
                request.existing_offer
              );

            return (
              <TiltCard
                key={request.request_id}
              >
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background:
                      "var(--soil-2)",
                    border:
                      "1px solid var(--line)",
                  }}
                >

                  {/* ==================================
                      REQUEST HEADER
                  ================================== */}

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    <div>
                      <p
                        className="text-xl font-display"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        {request.crop_name}
                      </p>

                      <p
                        className="text-sm mt-2"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Buyer needs{" "}
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              "var(--mist)",
                          }}
                        >
                          {
                            request.requested_quantity
                          }{" "}
                          kg
                        </span>
                      </p>

                      <p
                        className="text-sm mt-1"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Still required:{" "}
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              "var(--gold)",
                          }}
                        >
                          {
                            request.remaining_quantity
                          }{" "}
                          kg
                        </span>
                      </p>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-full text-xs font-semibold self-start"
                      style={{
                        background:
                          request.status ===
                          "partially_fulfilled"
                            ? "rgba(217,168,80,0.12)"
                            : "rgba(124,154,85,0.12)",

                        color:
                          request.status ===
                          "partially_fulfilled"
                            ? "var(--gold)"
                            : "var(--crop-solid)",

                        border:
                          "1px solid currentColor",
                      }}
                    >
                      {request.status ===
                      "partially_fulfilled"
                        ? "Partially Fulfilled"
                        : "Open"}
                    </div>

                  </div>

                  {/* ==================================
                      BUYER DETAILS
                  ================================== */}

                  {request.buyer && (
                    <div
                      className="mt-5 rounded-xl p-4"
                      style={{
                        background:
                          "var(--soil)",
                        border:
                          "1px solid var(--line)",
                      }}
                    >
                      <p
                        className="text-xs uppercase tracking-wide"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Buyer
                      </p>

                      <p
                        className="text-sm font-semibold mt-1"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        {request.buyer
                          .company_name ||
                          "Buyer"}
                      </p>

                      {request.buyer
                        .location && (
                        <p
                          className="text-xs mt-1"
                          style={{
                            color:
                              "var(--mist-dim)",
                          }}
                        >
                          📍{" "}
                          {
                            request.buyer
                              .location
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* ==================================
                      REQUEST INFORMATION
                  ================================== */}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">

                    <div
                      className="rounded-xl p-4"
                      style={{
                        background:
                          "var(--soil)",
                        border:
                          "1px solid var(--line)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Your Available
                      </p>

                      <p
                        className="text-lg font-semibold mt-1"
                        style={{
                          color:
                            "var(--gold)",
                        }}
                      >
                        {
                          request.available_quantity
                        }{" "}
                        kg
                      </p>
                    </div>

                    <div
                      className="rounded-xl p-4"
                      style={{
                        background:
                          "var(--soil)",
                        border:
                          "1px solid var(--line)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Buyer Target Price
                      </p>

                      <p
                        className="text-lg font-semibold mt-1"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        {request.target_price !==
                          null &&
                        request.target_price !==
                          undefined
                          ? `₹${request.target_price}/kg`
                          : "Not specified"}
                      </p>
                    </div>

                    <div
                      className="rounded-xl p-4"
                      style={{
                        background:
                          "var(--soil)",
                        border:
                          "1px solid var(--line)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Your Offer
                      </p>

                      <p
                        className="text-lg font-semibold mt-1"
                        style={{
                          color:
                            hasPendingOffer
                              ? "var(--crop-solid)"
                              : "var(--mist)",
                        }}
                      >
                        {hasPendingOffer
                          ? "Submitted"
                          : "Not submitted"}
                      </p>
                    </div>

                  </div>

                  {/* ==================================
                      MATCHING CROP LISTINGS
                  ================================== */}

                  <div className="mt-6">

                    <p
                      className="text-sm font-semibold mb-3"
                      style={{
                        color:
                          "var(--mist)",
                      }}
                    >
                      Your Matching Crop
                      Listings
                    </p>

                    {request.matching_crops
                      ?.length > 0 ? (
                      <div className="space-y-2">

                        {request.matching_crops.map(
                          (crop) => (
                            <label
                              key={
                                crop.crop_id
                              }
                              className="flex items-center justify-between gap-3 rounded-xl p-3 cursor-pointer"
                              style={{
                                background:
                                  currentOffer.crop_id ===
                                  String(
                                    crop.crop_id
                                  )
                                    ? "rgba(217,168,80,0.10)"
                                    : "var(--soil)",
                                border:
                                  currentOffer.crop_id ===
                                  String(
                                    crop.crop_id
                                  )
                                    ? "1px solid var(--gold)"
                                    : "1px solid var(--line)",
                              }}
                            >

                              <div className="flex items-center gap-3">

                                <input
                                  type="radio"
                                  name={`crop-${request.request_id}`}
                                  value={
                                    crop.crop_id
                                  }
                                  checked={
                                    String(
                                      currentOffer.crop_id
                                    ) ===
                                    String(
                                      crop.crop_id
                                    )
                                  }
                                  onChange={() =>
                                    handleOfferChange(
                                      request.request_id,
                                      "crop_id",
                                      crop.crop_id
                                    )
                                  }
                                  disabled={
                                    hasPendingOffer
                                  }
                                />

                                <div>
                                  <p
                                    className="text-sm font-semibold"
                                    style={{
                                      color:
                                        "var(--mist)",
                                    }}
                                  >
                                    {
                                      request.crop_name
                                    }
                                  </p>

                                  <p
                                    className="text-xs mt-1"
                                    style={{
                                      color:
                                        "var(--mist-dim)",
                                    }}
                                  >
                                    Current listing
                                    price: ₹
                                    {
                                      crop.price
                                    }
                                    /kg
                                  </p>
                                </div>

                              </div>

                              <div
                                className="text-sm font-semibold"
                                style={{
                                  color:
                                    "var(--gold)",
                                }}
                              >
                                {
                                  crop.quantity
                                }{" "}
                                kg
                              </div>

                            </label>
                          )
                        )}

                      </div>
                    ) : (
                      <p
                        className="text-sm"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        No matching crop
                        listing is currently
                        available.
                      </p>
                    )}
                  </div>

                  {/* ==================================
                      EXISTING OFFER
                  ================================== */}

                  {hasPendingOffer && (
                    <div
                      className="mt-5 rounded-xl p-4"
                      style={{
                        background:
                          "rgba(124,154,85,0.08)",
                        border:
                          "1px solid rgba(124,154,85,0.3)",
                      }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color:
                            "var(--crop-solid)",
                        }}
                      >
                        ✓ Offer already
                        submitted
                      </p>

                      <p
                        className="text-sm mt-2"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Quantity:{" "}
                        {
                          request
                            .existing_offer
                            .quantity
                        }{" "}
                        kg
                      </p>

                      <p
                        className="text-sm mt-1"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Price: ₹
                        {
                          request
                            .existing_offer
                            .price
                        }
                        /kg
                      </p>

                      <p
                        className="text-xs mt-2"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        The buyer will review
                        your offer.
                      </p>
                    </div>
                  )}

                  {/* ==================================
                      OFFER FORM
                  ================================== */}

                  {!hasPendingOffer && (
                    <div
                      className="mt-6 pt-5"
                      style={{
                        borderTop:
                          "1px solid var(--line)",
                      }}
                    >

                      <p
                        className="text-sm font-semibold mb-4"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        Submit Your Offer
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Quantity */}

                        <div>
                          <label
                            className="text-xs uppercase tracking-wide block mb-2"
                            style={{
                              color:
                                "var(--mist-dim)",
                            }}
                          >
                            Quantity You Can
                            Supply (kg)
                          </label>

                          <input
                            type="number"
                            min="1"
                            max={Math.min(
                              Number(
                                request.remaining_quantity
                              ),
                              Number(
                                request.available_quantity
                              )
                            )}
                            value={
                              currentOffer.quantity ||
                              ""
                            }
                            onChange={(e) =>
                              handleOfferChange(
                                request.request_id,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder={`Max ${
                              Math.min(
                                Number(
                                  request.remaining_quantity
                                ),
                                Number(
                                  request.available_quantity
                                )
                              )
                            } kg`}
                            className="w-full p-3 rounded-xl text-sm"
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

                        {/* Price */}

                        <div>
                          <label
                            className="text-xs uppercase tracking-wide block mb-2"
                            style={{
                              color:
                                "var(--mist-dim)",
                            }}
                          >
                            Your Price (₹/kg)
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              currentOffer.price ||
                              ""
                            }
                            onChange={(e) =>
                              handleOfferChange(
                                request.request_id,
                                "price",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 25"
                            className="w-full p-3 rounded-xl text-sm"
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

                      {/* Total */}

                      {currentOffer.quantity &&
                        currentOffer.price && (
                        <div
                          className="mt-4 rounded-xl p-4"
                          style={{
                            background:
                              "var(--soil)",
                            border:
                              "1px solid var(--line)",
                          }}
                        >
                          <div className="flex justify-between gap-4">

                            <span
                              className="text-sm"
                              style={{
                                color:
                                  "var(--mist-dim)",
                              }}
                            >
                              Offer Total
                            </span>

                            <span
                              className="font-semibold"
                              style={{
                                color:
                                  "var(--gold)",
                              }}
                            >
                              ₹
                              {(
                                Number(
                                  currentOffer.quantity
                                ) *
                                Number(
                                  currentOffer.price
                                )
                              ).toFixed(2)}
                            </span>

                          </div>
                        </div>
                      )}

                      {/* Submit */}

                      <button
                        onClick={() =>
                          handleSubmitOffer(
                            request
                          )
                        }
                        disabled={
                          submittingId ===
                            request.request_id ||
                          !currentOffer.crop_id ||
                          !currentOffer.quantity ||
                          !currentOffer.price
                        }
                        className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                        style={{
                          background:
                            "var(--gold)",
                          color:
                            "var(--soil)",
                        }}
                      >
                        {submittingId ===
                        request.request_id
                          ? "Submitting Offer..."
                          : "Submit Supply Offer"}
                      </button>

                    </div>
                  )}

                </div>
              </TiltCard>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default BulkRequests;