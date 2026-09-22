import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

function BulkOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cropNameFromUrl =
    searchParams.get("crop_name") || "";

  const [cropName, setCropName] =
    useState(cropNameFromUrl);

  const [quantity, setQuantity] =
    useState("");

  const [targetPrice, setTargetPrice] =
    useState("");

  const [availableQuantity, setAvailableQuantity] =
    useState(null);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [creatingRequest, setCreatingRequest] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const token = localStorage.getItem("token");

  // ==========================================
  // LOGIN CHECK
  // ==========================================

  useEffect(() => {
    if (!token) {
      alert(
        "Please log in to create a bulk request"
      );

      navigate("/login");
    }
  }, [token, navigate]);

  // ==========================================
  // ADDRESS CHANGE
  // ==========================================

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // CHECK CURRENT AVAILABILITY
  // ==========================================
  // This is informational only.
  //
  // A buyer can create a bulk request even when
  // current available stock is less than the
  // requested quantity.
  // ==========================================

  const checkAvailability = async () => {
    setError("");
    setSuccess("");
    setAvailableQuantity(null);

    const name = cropName.trim();

    if (!name) {
      setError("Please enter a crop name");
      return;
    }

    const requestedQuantity =
      Number(quantity);

    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      setError(
        "Please enter a valid quantity"
      );
      return;
    }

    try {
      setLoadingAvailability(true);

      const response = await axios.get(
        "http://localhost:5000/api/crops"
      );

      const crops = Array.isArray(
        response.data
      )
        ? response.data
        : [];

      const matchingCrops =
        crops.filter(
          (crop) =>
            crop.status === "available" &&
            Number(crop.quantity) > 0 &&
            String(
              crop.crop_name
            ).toLowerCase() ===
              name.toLowerCase()
        );

      const totalAvailable =
        matchingCrops.reduce(
          (sum, crop) =>
            sum +
            Number(crop.quantity || 0),
          0
        );

      setAvailableQuantity(
        totalAvailable
      );

      // ----------------------------------------
      // No current stock
      // ----------------------------------------

      if (totalAvailable === 0) {
        setSuccess(
          `No current ${name} stock was found. You can still create the request and farmers can respond when they have supply.`
        );

        return;
      }

      // ----------------------------------------
      // Current stock is less than requirement
      // ----------------------------------------

      if (
        requestedQuantity >
        totalAvailable
      ) {
        setSuccess(
          `${totalAvailable} kg is currently available across ${matchingCrops.length} farmer listing${
            matchingCrops.length !== 1
              ? "s"
              : ""
          }. Your request can still be created for ${requestedQuantity} kg.`
        );

        return;
      }

      // ----------------------------------------
      // Current stock can fulfill request
      // ----------------------------------------

      setSuccess(
        `${totalAvailable} kg of ${name} is currently available across ${matchingCrops.length} farmer listing${
          matchingCrops.length !== 1
            ? "s"
            : ""
        }.`
      );
    } catch (err) {
      console.error(
        "Check bulk availability error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to check crop availability"
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

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
      if (
        !address[field] ||
        !address[field].trim()
      ) {
        return `${field.replace(
          "_",
          " "
        )} is required`;
      }
    }

    const phone =
      address.phone.replace(
        /\D/g,
        ""
      );

    if (phone.length !== 10) {
      return "Phone number must be 10 digits";
    }

    if (
      !/^\d{6}$/.test(
        address.pincode.trim()
      )
    ) {
      return "Pincode must be 6 digits";
    }

    return null;
  };

  // ==========================================
  // CREATE BULK REQUEST
  // ==========================================

  const handleCreateRequest = async () => {
    setError("");
    setSuccess("");

    // ----------------------------------------
    // Login check
    // ----------------------------------------

    if (!token) {
      alert("Please log in first");
      navigate("/login");
      return;
    }

    // ----------------------------------------
    // Crop validation
    // ----------------------------------------

    const name = cropName.trim();

    if (!name) {
      setError(
        "Please enter a crop name"
      );
      return;
    }

    // ----------------------------------------
    // Quantity validation
    // ----------------------------------------

    const requestedQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        requestedQuantity
      ) ||
      requestedQuantity <= 0
    ) {
      setError(
        "Quantity must be greater than 0"
      );
      return;
    }

    // ----------------------------------------
    // Target price validation
    // ----------------------------------------

    let price = null;

    if (
      targetPrice !== "" &&
      targetPrice !== null
    ) {
      price = Number(targetPrice);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        setError(
          "Target price must be a valid number"
        );
        return;
      }
    }

    // ----------------------------------------
    // Address validation
    // ----------------------------------------

    const addressError =
      validateAddress();

    if (addressError) {
      setError(addressError);
      return;
    }

    // ----------------------------------------
    // Create request
    // ----------------------------------------

    try {
      setCreatingRequest(true);

      const cleanedAddress = {
        full_name:
          address.full_name.trim(),

        phone:
          address.phone.trim(),

        house:
          address.house.trim(),

        area:
          address.area.trim(),

        city:
          address.city.trim(),

        district:
          address.district.trim(),

        state:
          address.state.trim(),

        pincode:
          address.pincode.trim(),

        landmark:
          address.landmark.trim(),
      };

      const response =
        await axios.post(
          "http://localhost:5000/api/bulk-requests",
          {
            crop_name: name,

            quantity:
              requestedQuantity,

            target_price:
              price,

            delivery_address:
              cleanedAddress,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const farmersNotified =
        response.data
          ?.farmers_notified || 0;

      setSuccess(
        farmersNotified > 0
          ? `Bulk request created successfully. ${farmersNotified} matching farmer${
              farmersNotified !== 1
                ? "s"
                : ""
            } have been notified.`
          : "Bulk request created successfully. Farmers can submit offers for your requirement."
      );

      alert(
        "Bulk request created successfully!"
      );

      // ----------------------------------------
      // Go to buyer's bulk requests page
      // ----------------------------------------

      navigate(
        "/my-bulk-requests"
      );
    } catch (err) {
      console.error(
        "Create bulk request error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to create bulk request"
      );
    } finally {
      setCreatingRequest(false);
    }
  };

  // ==========================================
  // INPUT STYLE
  // ==========================================

  const inputStyle = {
    background: "var(--soil-2)",
    border: "1px solid var(--line)",
    color: "var(--mist)",
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto">

      {/* ==========================================
          HEADER
      ========================================== */}

      <p className="eyebrow mb-3">
        Multi-Farmer Marketplace
      </p>

      <h2
        className="text-2xl sm:text-3xl mb-2"
        style={{
          color: "var(--mist)",
        }}
      >
        Create Bulk Request
      </h2>

      <p
        className="text-sm mb-8"
        style={{
          color: "var(--mist-dim)",
        }}
      >
        Need a large quantity? Tell farmers
        what you need. Multiple farmers can
        submit offers to fulfill your requirement.
      </p>

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
            color: "var(--crop-solid)",
          }}
        >
          {success}
        </div>
      )}

      {/* ==========================================
          BULK REQUEST DETAILS
      ========================================== */}

      <div
        className="rounded-2xl p-5 sm:p-7 mb-6"
        style={{
          background:
            "var(--soil-2)",
          border:
            "1px solid var(--line)",
        }}
      >
        <h3
          className="text-lg font-display mb-5"
          style={{
            color: "var(--mist)",
          }}
        >
          What do you need?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* ======================================
              CROP NAME
          ====================================== */}

          <div>
            <label
              className="text-xs uppercase tracking-wide block mb-2"
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Crop Name
            </label>

            <input
              type="text"
              value={cropName}
              onChange={(e) => {
                setCropName(
                  e.target.value
                );

                setAvailableQuantity(
                  null
                );

                setError("");
                setSuccess("");
              }}
              placeholder="e.g. Wheat"
              className="w-full p-3 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          {/* ======================================
              QUANTITY
          ====================================== */}

          <div>
            <label
              className="text-xs uppercase tracking-wide block mb-2"
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Required Quantity (kg)
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(
                  e.target.value
                );

                setAvailableQuantity(
                  null
                );

                setError("");
                setSuccess("");
              }}
              placeholder="e.g. 5000"
              className="w-full p-3 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          {/* ======================================
              TARGET PRICE
          ====================================== */}

          <div>
            <label
              className="text-xs uppercase tracking-wide block mb-2"
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Target Price (₹/kg)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={targetPrice}
              onChange={(e) => {
                setTargetPrice(
                  e.target.value
                );

                setError("");
              }}
              placeholder="Optional e.g. 25"
              className="w-full p-3 rounded-xl text-sm"
              style={inputStyle}
            />

            <p
              className="text-xs mt-2"
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Optional. Farmers can submit
              their own price.
            </p>
          </div>
        </div>

        {/* ========================================
            CHECK AVAILABILITY
        ======================================== */}

        <button
          onClick={checkAvailability}
          disabled={
            loadingAvailability
          }
          className="w-full mt-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          style={{
            background:
              "var(--gold)",
            color:
              "var(--soil)",
          }}
        >
          {loadingAvailability
            ? "Checking..."
            : "Check Current Availability"}
        </button>

        {/* ========================================
            AVAILABILITY
        ======================================== */}

        {availableQuantity !== null && (
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
              className="text-sm"
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Current available
              supply
            </p>

            <p
              className="text-2xl font-display mt-1"
              style={{
                color:
                  "var(--gold)",
              }}
            >
              {availableQuantity} kg
            </p>

            {Number(quantity) >
              availableQuantity && (
              <p
                className="text-sm mt-2"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                Current supply is less
                than your requirement.
                Don't worry — your bulk
                request can still be
                created and more farmers
                can respond.
              </p>
            )}

            {Number(quantity) <=
              availableQuantity && (
              <p
                className="text-sm mt-2"
                style={{
                  color:
                    "var(--crop-solid)",
                }}
              >
                ✓ Current supply can
                cover your requirement,
                subject to farmer offers.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
          DELIVERY ADDRESS
      ========================================== */}

      <div
        className="rounded-2xl p-5 sm:p-7 mb-6"
        style={{
          background:
            "var(--soil-2)",
          border:
            "1px solid var(--line)",
        }}
      >
        <h3
          className="text-lg font-display mb-5"
          style={{
            color:
              "var(--mist)",
          }}
        >
          Delivery Address
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {[
            {
              name: "full_name",
              label: "Full Name",
              placeholder:
                "Full name",
            },
            {
              name: "phone",
              label: "Phone",
              placeholder:
                "10 digit phone number",
            },
            {
              name: "house",
              label: "House",
              placeholder:
                "House / building",
            },
            {
              name: "area",
              label: "Area",
              placeholder:
                "Area / locality",
            },
            {
              name: "city",
              label: "City",
              placeholder:
                "City",
            },
            {
              name: "district",
              label: "District",
              placeholder:
                "District",
            },
            {
              name: "state",
              label: "State",
              placeholder:
                "State",
            },
            {
              name: "pincode",
              label: "Pincode",
              placeholder:
                "6 digit pincode",
            },
          ].map((field) => (
            <div
              key={field.name}
            >
              <label
                className="text-xs uppercase tracking-wide block mb-2"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                {field.label}
              </label>

              <input
                type={
                  field.name ===
                    "phone" ||
                  field.name ===
                    "pincode"
                    ? "tel"
                    : "text"
                }
                name={
                  field.name
                }
                value={
                  address[
                    field.name
                  ]
                }
                onChange={
                  handleAddressChange
                }
                placeholder={
                  field.placeholder
                }
                className="w-full p-3 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
          ))}

          {/* ======================================
              LANDMARK
          ====================================== */}

          <div className="sm:col-span-2">
            <label
              className="text-xs uppercase tracking-wide block mb-2"
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
              value={
                address.landmark
              }
              onChange={
                handleAddressChange
              }
              placeholder="Optional landmark"
              className="w-full p-3 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ==========================================
          SUMMARY
      ========================================== */}

      <div
        className="rounded-2xl p-5 sm:p-7 mb-6"
        style={{
          background:
            "var(--soil-2)",
          border:
            "1px solid var(--line)",
        }}
      >
        <h3
          className="text-lg font-display mb-5"
          style={{
            color:
              "var(--mist)",
          }}
        >
          Bulk Request Summary
        </h3>

        <div className="space-y-3">

          {/* Crop */}

          <div className="flex justify-between gap-4">
            <span
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Crop
            </span>

            <span
              className="font-semibold text-right"
              style={{
                color:
                  "var(--mist)",
              }}
            >
              {cropName || "-"}
            </span>
          </div>

          {/* Quantity */}

          <div className="flex justify-between gap-4">
            <span
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Required Quantity
            </span>

            <span
              className="font-semibold"
              style={{
                color:
                  "var(--mist)",
              }}
            >
              {quantity || 0} kg
            </span>
          </div>

          {/* Target Price */}

          <div className="flex justify-between gap-4">
            <span
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              Target Price
            </span>

            <span
              className="font-semibold"
              style={{
                color:
                  "var(--mist)",
              }}
            >
              {targetPrice
                ? `₹${targetPrice}/kg`
                : "Not specified"}
            </span>
          </div>

          {/* Current availability */}

          {availableQuantity !== null && (
            <div
              className="pt-3 mt-3 border-t"
              style={{
                borderColor:
                  "var(--line)",
              }}
            >
              <p
                className="text-sm"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                Current marketplace
                availability:{" "}
                <span
                  style={{
                    color:
                      "var(--gold)",
                  }}
                >
                  {availableQuantity} kg
                </span>
              </p>

              <p
                className="text-xs mt-2"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                Final order quantity will
                be fulfilled through accepted
                farmer offers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          INFORMATION
      ========================================== */}

      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background:
            "rgba(124,154,85,0.08)",
          border:
            "1px solid rgba(124,154,85,0.25)",
        }}
      >
        <div className="flex gap-3">
          <div className="text-xl">
            📦
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{
                color:
                  "var(--mist)",
              }}
            >
              How bulk ordering works
            </p>

            <ol
              className="text-sm mt-2 space-y-1"
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              <li>
                1. Create your bulk
                requirement.
              </li>

              <li>
                2. Matching farmers receive
                a notification.
              </li>

              <li>
                3. Farmers submit their
                quantity and price offers.
              </li>

              <li>
                4. You select offers from
                multiple farmers.
              </li>

              <li>
                5. Once your requirement is
                fulfilled, one bulk order is
                created.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* ==========================================
          ACTIONS
      ========================================== */}

      <div className="flex flex-col sm:flex-row gap-3">

        <button
          onClick={() =>
            navigate("/")
          }
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{
            background:
              "transparent",
            color:
              "var(--gold)",
            border:
              "1px solid var(--gold)",
          }}
        >
          Back to Marketplace
        </button>

        <button
          onClick={
            handleCreateRequest
          }
          disabled={
            creatingRequest ||
            !cropName.trim() ||
            !quantity ||
            Number(quantity) <= 0
          }
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          style={{
            background:
              "var(--gold)",
            color:
              "var(--soil)",
          }}
        >
          {creatingRequest
            ? "Creating Request..."
            : "Create Bulk Request"}
        </button>

      </div>
    </div>
  );
}

export default BulkOrder;