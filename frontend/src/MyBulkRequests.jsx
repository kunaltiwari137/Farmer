import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TiltCard from "./TiltCard";

function MyBulkRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOffers, setSelectedOffers] = useState({});

  const [acceptingRequest, setAcceptingRequest] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ==========================================
  // LOGIN CHECK
  // ==========================================

  useEffect(() => {
    if (!token) {
      alert("Please log in first");
      navigate("/login");
      return;
    }

    fetchRequests();
  }, [token, navigate]);

  // ==========================================
  // FETCH BUYER BULK REQUESTS
  // ==========================================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "http://localhost:5000/api/bulk-requests/my-requests",
        authHeader
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setRequests(data);
    } catch (err) {
      console.error(
        "Fetch bulk requests error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to load bulk requests"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SELECT / UNSELECT OFFER
  // ==========================================

  const toggleOffer = (
    requestId,
    offerId
  ) => {
    setSelectedOffers((prev) => {
      const current =
        prev[requestId] || [];

      const alreadySelected =
        current.includes(offerId);

      return {
        ...prev,
        [requestId]: alreadySelected
          ? current.filter(
              (id) => id !== offerId
            )
          : [...current, offerId],
      };
    });

    setError("");
    setSuccess("");
  };

  // ==========================================
  // GET SELECTED OFFERS
  // ==========================================

  const getSelectedOffers = (
    request,
    offers
  ) => {
    const selectedIds =
      selectedOffers[
        request.request_id
      ] || [];

    return offers.filter((offer) =>
      selectedIds.includes(
        String(offer._id)
      )
    );
  };

  // ==========================================
  // SELECTED QUANTITY
  // ==========================================

  const getSelectedQuantity = (
    request
  ) => {
    const selected =
      selectedOffers[
        request.request_id
      ] || [];

    const offers =
      request.offers || [];

    return offers
      .filter((offer) =>
        selected.includes(
          String(offer._id)
        )
      )
      .reduce(
        (sum, offer) =>
          sum +
          Number(
            offer.quantity || 0
          ),
        0
      );
  };

  // ==========================================
  // SELECTED TOTAL
  // ==========================================

  const getSelectedTotal = (
    request
  ) => {
    const selected =
      selectedOffers[
        request.request_id
      ] || [];

    const offers =
      request.offers || [];

    return offers
      .filter((offer) =>
        selected.includes(
          String(offer._id)
        )
      )
      .reduce(
        (sum, offer) =>
          sum +
          Number(
            offer.total_amount || 0
          ),
        0
      );
  };

  // ==========================================
  // ACCEPT SELECTED OFFERS
  // ==========================================

  const handleAcceptOffers = async (
    request
  ) => {
    setError("");
    setSuccess("");

    const selected =
      selectedOffers[
        request.request_id
      ] || [];

    if (selected.length === 0) {
      setError(
        "Please select at least one farmer offer."
      );
      return;
    }

    const selectedQuantity =
      getSelectedQuantity(request);

    const remainingQuantity =
      Number(
        request.remaining_quantity || 0
      );

    // ==========================================
    // REQUIRE EXACT QUANTITY
    // ==========================================

    if (
      selectedQuantity !==
      remainingQuantity
    ) {
      setError(
        `You need to select offers totaling exactly ${remainingQuantity} kg. Currently selected: ${selectedQuantity} kg.`
      );
      return;
    }

    try {
      setAcceptingRequest(
        request.request_id
      );

      const response =
        await axios.post(
          `http://localhost:5000/api/bulk-requests/${request.request_id}/accept-offers`,
          {
            offer_ids: selected,
          },
          authHeader
        );

      setSuccess(
        response.data?.message ||
          "Bulk offers accepted successfully."
      );

      // Remove selected offers
      setSelectedOffers((prev) => ({
        ...prev,
        [request.request_id]: [],
      }));

      // Refresh data
      await fetchRequests();

      // ==========================================
      // GO TO MY ORDERS
      // ==========================================

      setTimeout(() => {
        navigate("/my-orders");
      }, 1200);
    } catch (err) {
      console.error(
        "Accept bulk offers error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to accept bulk offers"
      );
    } finally {
      setAcceptingRequest(null);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // INPUT / CARD STYLE
  // ==========================================

  const cardStyle = {
    background: "var(--soil-2)",
    border: "1px solid var(--line)",
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-16">
        <p className="eyebrow mb-3">
          Buyer
        </p>

        <h2
          className="text-3xl"
          style={{
            color: "var(--mist)",
          }}
        >
          My Bulk Requests
        </h2>

        <div
          className="rounded-2xl p-8 mt-8 text-center"
          style={cardStyle}
        >
          <p
            style={{
              color: "var(--mist-dim)",
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
    <div className="max-w-5xl mx-auto pb-16">

      {/* ==========================================
          HEADER
      ========================================== */}

      <p className="eyebrow mb-3">
        Buyer
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

        <div>
          <h2
            className="text-3xl"
            style={{
              color: "var(--mist)",
            }}
          >
            My Bulk Requests
          </h2>

          <p
            className="text-sm mt-2"
            style={{
              color: "var(--mist-dim)",
            }}
          >
            Review farmer offers and
            choose the supply you want.
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
          SUCCESS
      ========================================== */}

      {success && (
        <div
          className="rounded-xl p-4 mb-5 text-sm"
          style={{
            background:
              "rgba(124,154,85,0.12)",
            border:
              "1px solid rgba(124,154,85,0.35)",
            color:
              "var(--crop-solid)",
          }}
        >
          {success}
        </div>
      )}

      {/* ==========================================
          NO REQUESTS
      ========================================== */}

      {requests.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={cardStyle}
        >
          <div className="text-4xl mb-4">
            📦
          </div>

          <h3
            className="text-xl font-display"
            style={{
              color: "var(--mist)",
            }}
          >
            No bulk requests
          </h3>

          <p
            className="text-sm mt-2"
            style={{
              color:
                "var(--mist-dim)",
            }}
          >
            Your bulk requests will
            appear here.
          </p>

          <button
            onClick={() =>
              navigate("/bulk-order")
            }
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background:
                "var(--gold)",
              color:
                "var(--soil)",
            }}
          >
            Create Bulk Request
          </button>
        </div>
      )}

      {/* ==========================================
          REQUEST LIST
      ========================================== */}

      {requests.length > 0 && (
        <div className="space-y-6">

          {requests.map((request) => {
            const offers =
              request.offers || [];

            const pendingOffers =
              offers.filter(
                (offer) =>
                  offer.status ===
                  "pending"
              );

            const selectedQuantity =
              getSelectedQuantity(
                request
              );

            const selectedTotal =
              getSelectedTotal(
                request
              );

            const remainingQuantity =
              Number(
                request.remaining_quantity ||
                  0
              );

            const isFulfilled =
              request.status ===
                "fulfilled" ||
              remainingQuantity === 0;

            const exactQuantity =
              selectedQuantity ===
              remainingQuantity;

            return (
              <TiltCard
                key={
                  request.request_id
                }
              >
                <div
                  className="rounded-2xl p-5 sm:p-7"
                  style={cardStyle}
                >

                  {/* ==================================
                      REQUEST HEADER
                  ================================== */}

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    <div>
                      <p
                        className="text-2xl font-display"
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
                        Created{" "}
                        {formatDate(
                          request.created_at
                        )}
                      </p>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wide self-start"
                      style={{
                        background:
                          request.status ===
                          "fulfilled"
                            ? "rgba(124,154,85,0.15)"
                            : "rgba(214,158,46,0.12)",
                        color:
                          request.status ===
                          "fulfilled"
                            ? "var(--crop-solid)"
                            : "var(--gold)",
                      }}
                    >
                      {request.status}
                    </div>

                  </div>

                  {/* ==================================
                      REQUEST DETAILS
                  ================================== */}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

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
                        className="text-xs uppercase tracking-wide"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Required
                      </p>

                      <p
                        className="text-xl font-display mt-1"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        {
                          request.requested_quantity
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
                        className="text-xs uppercase tracking-wide"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Remaining
                      </p>

                      <p
                        className="text-xl font-display mt-1"
                        style={{
                          color:
                            "var(--gold)",
                        }}
                      >
                        {
                          request.remaining_quantity
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
                        className="text-xs uppercase tracking-wide"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Target Price
                      </p>

                      <p
                        className="text-xl font-display mt-1"
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
                          : "Any price"}
                      </p>
                    </div>

                  </div>

                  {/* ==================================
                      OFFERS
                  ================================== */}

                  <div className="mt-7">

                    <div className="flex items-center justify-between gap-3 mb-4">

                      <h3
                        className="text-lg font-display"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        Farmer Offers
                      </h3>

                      <span
                        className="text-sm"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        {
                          pendingOffers.length
                        }{" "}
                        pending
                      </span>

                    </div>

                    {offers.length === 0 && (
                      <div
                        className="rounded-xl p-5 text-center"
                        style={{
                          background:
                            "var(--soil)",
                          border:
                            "1px solid var(--line)",
                        }}
                      >
                        <p
                          style={{
                            color:
                              "var(--mist-dim)",
                          }}
                        >
                          No farmer offers
                          yet.
                        </p>
                      </div>
                    )}

                    {offers.length > 0 && (
                      <div className="space-y-3">

                        {offers.map(
                          (offer) => {
                            const offerId =
                              String(
                                offer._id
                              );

                            const isSelected =
                              (
                                selectedOffers[
                                  request.request_id
                                ] || []
                              ).includes(
                                offerId
                              );

                            const farmer =
                              offer.farmer_id;

                            const farmerUser =
                              farmer?.user_id;

                            const crop =
                              offer.crop_id;

                            return (
                              <div
                                key={
                                  offer._id
                                }
                                className="rounded-xl p-4"
                                style={{
                                  background:
                                    "var(--soil)",
                                  border:
                                    isSelected
                                      ? "1px solid var(--gold)"
                                      : "1px solid var(--line)",
                                }}
                              >

                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                                  {/* Farmer */}

                                  <div className="flex-1">

                                    <div className="flex items-center gap-3">

                                      {offer.status ===
                                        "pending" && (
                                        <input
                                          type="checkbox"
                                          checked={
                                            isSelected
                                          }
                                          onChange={() =>
                                            toggleOffer(
                                              request.request_id,
                                              offerId
                                            )
                                          }
                                          className="w-4 h-4"
                                        />
                                      )}

                                      <div>
                                        <p
                                          className="font-semibold"
                                          style={{
                                            color:
                                              "var(--mist)",
                                          }}
                                        >
                                          {farmerUser?.name ||
                                            "Farmer"}
                                        </p>

                                        <p
                                          className="text-xs mt-1"
                                          style={{
                                            color:
                                              "var(--mist-dim)",
                                          }}
                                        >
                                          {farmer?.village
                                            ? `${farmer.village}, `
                                            : ""}
                                          {farmer?.district ||
                                            ""}
                                          {farmer?.state
                                            ? `, ${farmer.state}`
                                            : ""}
                                        </p>
                                      </div>

                                    </div>

                                  </div>

                                  {/* Quantity */}

                                  <div>
                                    <p
                                      className="text-xs"
                                      style={{
                                        color:
                                          "var(--mist-dim)",
                                      }}
                                    >
                                      Quantity
                                    </p>

                                    <p
                                      className="font-semibold"
                                      style={{
                                        color:
                                          "var(--mist)",
                                      }}
                                    >
                                      {
                                        offer.quantity
                                      }{" "}
                                      kg
                                    </p>
                                  </div>

                                  {/* Price */}

                                  <div>
                                    <p
                                      className="text-xs"
                                      style={{
                                        color:
                                          "var(--mist-dim)",
                                      }}
                                    >
                                      Price
                                    </p>

                                    <p
                                      className="font-semibold"
                                      style={{
                                        color:
                                          "var(--gold)",
                                      }}
                                    >
                                      ₹
                                      {
                                        offer.price
                                      }
                                      /kg
                                    </p>
                                  </div>

                                  {/* Total */}

                                  <div>
                                    <p
                                      className="text-xs"
                                      style={{
                                        color:
                                          "var(--mist-dim)",
                                      }}
                                    >
                                      Total
                                    </p>

                                    <p
                                      className="font-semibold"
                                      style={{
                                        color:
                                          "var(--mist)",
                                      }}
                                    >
                                      ₹
                                      {Number(
                                        offer.total_amount ||
                                          0
                                      ).toLocaleString(
                                        "en-IN"
                                      )}
                                    </p>
                                  </div>

                                  {/* Status */}

                                  <div
                                    className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wide"
                                    style={{
                                      background:
                                        offer.status ===
                                        "accepted"
                                          ? "rgba(124,154,85,0.15)"
                                          : offer.status ===
                                            "rejected"
                                          ? "rgba(230,57,70,0.1)"
                                          : "rgba(214,158,46,0.12)",

                                      color:
                                        offer.status ===
                                        "accepted"
                                          ? "var(--crop-solid)"
                                          : offer.status ===
                                            "rejected"
                                          ? "#e63946"
                                          : "var(--gold)",
                                    }}
                                  >
                                    {
                                      offer.status
                                    }
                                  </div>

                                </div>

                                {crop && (
                                  <p
                                    className="text-xs mt-3"
                                    style={{
                                      color:
                                        "var(--mist-dim)",
                                    }}
                                  >
                                    Farmer listing:
                                    {" "}
                                    {
                                      crop.crop_name
                                    }
                                  </p>
                                )}

                              </div>
                            );
                          }
                        )}

                      </div>
                    )}

                  </div>

                  {/* ==================================
                      SELECTION SUMMARY
                  ================================== */}

                  {!isFulfilled &&
                    pendingOffers.length >
                      0 && (
                      <div
                        className="mt-6 rounded-xl p-5"
                        style={{
                          background:
                            "var(--soil)",
                          border:
                            "1px solid var(--line)",
                        }}
                      >

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                          <div>
                            <p
                              className="text-sm"
                              style={{
                                color:
                                  "var(--mist-dim)",
                              }}
                            >
                              Selected quantity
                            </p>

                            <p
                              className="text-2xl font-display mt-1"
                              style={{
                                color:
                                  exactQuantity
                                    ? "var(--crop-solid)"
                                    : "var(--gold)",
                              }}
                            >
                              {
                                selectedQuantity
                              }{" "}
                              /{" "}
                              {
                                remainingQuantity
                              }{" "}
                              kg
                            </p>
                          </div>

                          <div>
                            <p
                              className="text-sm"
                              style={{
                                color:
                                  "var(--mist-dim)",
                              }}
                            >
                              Selected total
                            </p>

                            <p
                              className="text-2xl font-display mt-1"
                              style={{
                                color:
                                  "var(--mist)",
                              }}
                            >
                              ₹
                              {selectedTotal.toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>

                        </div>

                        <p
                          className="text-sm mt-4"
                          style={{
                            color:
                              exactQuantity
                                ? "var(--crop-solid)"
                                : "var(--mist-dim)",
                          }}
                        >
                          {exactQuantity
                            ? "✓ Required quantity is completely covered."
                            : `Select offers totaling exactly ${remainingQuantity} kg.`}
                        </p>

                        <button
                          onClick={() =>
                            handleAcceptOffers(
                              request
                            )
                          }
                          disabled={
                            acceptingRequest ===
                              request.request_id ||
                            !exactQuantity
                          }
                          className="w-full mt-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                          style={{
                            background:
                              "var(--gold)",
                            color:
                              "var(--soil)",
                          }}
                        >
                          {acceptingRequest ===
                          request.request_id
                            ? "Accepting Offers..."
                            : "Accept Selected Offers"}
                        </button>

                      </div>
                    )}

                  {/* ==================================
                      FULFILLED MESSAGE
                  ================================== */}

                  {isFulfilled && (
                    <div
                      className="mt-6 rounded-xl p-5"
                      style={{
                        background:
                          "rgba(124,154,85,0.1)",
                        border:
                          "1px solid rgba(124,154,85,0.35)",
                      }}
                    >
                      <p
                        className="font-semibold"
                        style={{
                          color:
                            "var(--crop-solid)",
                        }}
                      >
                        ✓ Bulk request fulfilled
                      </p>

                      <p
                        className="text-sm mt-1"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        Your final bulk order
                        has been created.
                      </p>
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

export default MyBulkRequests;