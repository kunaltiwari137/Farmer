import { useState, useEffect } from "react";
import axios from "axios";
import TiltCard from "./TiltCard";

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const [farmers, setFarmers] = useState([]);
  const [buyers, setBuyers] = useState([]);

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  const [pendingUsers, setPendingUsers] = useState([]);

  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiCropName, setMandiCropName] = useState("");
  const [mandiCategory, setMandiCategory] =
    useState("Vegetables");
  const [mandiPrice, setMandiPrice] = useState("");

  const [activeTab, setActiveTab] =
    useState("overview");

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const token = localStorage.getItem("token");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // ==========================================
  // FETCH STATS
  // ==========================================
  const fetchStats = () => {
    axios
      .get(
        "http://localhost:5000/api/admin/stats",
        authHeader
      )
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("Stats error:", err);
      });
  };

  // ==========================================
  // FETCH FARMERS
  // ==========================================
  const fetchFarmers = () => {
    axios
      .get(
        "http://localhost:5000/api/admin/farmers",
        authHeader
      )
      .then((res) => {
        console.log("FARMERS:", res.data);
        setFarmers(res.data);
      })
      .catch((err) => {
        console.error("Farmers error:", err);
      });
  };

  // ==========================================
  // FETCH BUYERS
  // ==========================================
  const fetchBuyers = () => {
    axios
      .get(
        "http://localhost:5000/api/admin/buyers",
        authHeader
      )
      .then((res) => {
        console.log("BUYERS:", res.data);
        setBuyers(res.data);
      })
      .catch((err) => {
        console.error("Buyers error:", err);
      });
  };

  // ==========================================
  // FETCH PENDING USERS
  // ==========================================
  const fetchPendingUsers = () => {
    axios
      .get(
        "http://localhost:5000/api/admin/pending-users",
        authHeader
      )
      .then((res) => {
        console.log(
          "PENDING USERS:",
          res.data
        );

        setPendingUsers(res.data);
      })
      .catch((err) => {
        console.error(
          "Pending users error:",
          err
        );
      });
  };

  // ==========================================
  // FETCH MANDI PRICES
  // ==========================================
  const fetchMandiPrices = () => {
    axios
      .get(
        "http://localhost:5000/api/mandi"
      )
      .then((res) => {
        setMandiPrices(res.data);
      })
      .catch((err) => {
        console.error(
          "Mandi error:",
          err
        );
      });
  };

  // ==========================================
  // FETCH SINGLE FARMER DETAILS
  // ==========================================
  const fetchFarmerDetails = async (
    farmerId
  ) => {
    try {
      setDetailsLoading(true);
      setSelectedFarmer(null);

      const res = await axios.get(
        `http://localhost:5000/api/admin/farmers/${farmerId}`,
        authHeader
      );

      console.log(
        "FARMER DETAILS:",
        res.data
      );

      setSelectedFarmer(res.data);
    } catch (err) {
      console.error(
        "Farmer details error:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Failed to fetch farmer details"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // FETCH SINGLE BUYER DETAILS
  // ==========================================
  const fetchBuyerDetails = async (
    buyerId
  ) => {
    try {
      setDetailsLoading(true);
      setSelectedBuyer(null);

      const res = await axios.get(
        `http://localhost:5000/api/admin/buyers/${buyerId}`,
        authHeader
      );

      console.log(
        "BUYER DETAILS:",
        res.data
      );

      setSelectedBuyer(res.data);
    } catch (err) {
      console.error(
        "Buyer details error:",
        err
      );

      alert(
        err.response?.data?.error ||
          "Failed to fetch buyer details"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    fetchStats();
    fetchFarmers();
    fetchBuyers();
    fetchPendingUsers();
    fetchMandiPrices();
  }, []);

  // ==========================================
  // VERIFY / UNVERIFY FARMER
  // ==========================================
  const handleToggleVerify = async (
    farmerId,
    currentStatus
  ) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/farmers/${farmerId}/verify`,
        {
          verified: !currentStatus,
        },
        authHeader
      );

      fetchFarmers();

      // Refresh selected farmer details
      if (selectedFarmer) {
        fetchFarmerDetails(farmerId);
      }
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Failed to update"
      );
    }
  };

  // ==========================================
  // APPROVE / REJECT USER
  // ==========================================
  const handleReviewUser = async (
    userId,
    decision
  ) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/review`,
        {
          decision,
        },
        authHeader
      );

      fetchPendingUsers();
      fetchFarmers();
      fetchBuyers();
      fetchStats();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Failed to review user"
      );
    }
  };

  // ==========================================
  // SET MANDI PRICE
  // ==========================================
  const handleSetMandiPrice = async (
    e
  ) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/mandi",
        {
          crop_name: mandiCropName,
          category: mandiCategory,
          price_per_kg: Number(mandiPrice),
        },
        authHeader
      );

      setMandiCropName("");
      setMandiPrice("");

      fetchMandiPrices();
    } catch (err) {
      alert("Failed to set price");
    }
  };

  // ==========================================
  // STAT CARD
  // ==========================================
  const StatCard = ({
    label,
    value,
  }) => (
    <TiltCard>
      <div
        className="rounded-2xl p-5 text-center"
        style={{
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >
        <p
          className="text-2xl font-display"
          style={{
            color: "var(--gold)",
          }}
        >
          {value}
        </p>

        <p
          className="text-xs uppercase tracking-wide mt-1"
          style={{
            color: "var(--mist-dim)",
          }}
        >
          {label}
        </p>
      </div>
    </TiltCard>
  );

  // ==========================================
  // COUNT USERS BY ROLE
  // ==========================================
  const countFor = (role) => {
    if (!stats) return 0;

    const found =
      stats.users_by_role?.find(
        (r) => r.role === role
      );

    return found
      ? found.count
      : 0;
  };

  // ==========================================
  // DETAIL ROW
  // ==========================================
  const DetailRow = ({
    label,
    value,
  }) => {
    return (
      <div
        className="flex justify-between gap-4 py-2"
        style={{
          borderBottom:
            "1px solid var(--line)",
        }}
      >
        <span
          className="text-xs"
          style={{
            color: "var(--mist-dim)",
          }}
        >
          {label}
        </span>

        <span
          className="text-sm text-right"
          style={{
            color: "var(--mist)",
          }}
        >
          {value !== undefined &&
          value !== null &&
          value !== ""
            ? String(value)
            : "Not provided"}
        </span>
      </div>
    );
  };

  // ==========================================
  // FARMER DETAILS PANEL
  // ==========================================
  const FarmerDetails = () => {
    if (detailsLoading) {
      return (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--line)",
          }}
        >
          <p
            style={{
              color: "var(--mist-dim)",
            }}
          >
            Loading farmer details...
          </p>
        </div>
      );
    }

    if (!selectedFarmer) {
      return null;
    }

    const user =
      selectedFarmer.user_id || {};

    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <p
              className="text-xs uppercase tracking-wide"
              style={{
                color: "var(--gold)",
              }}
            >
              Farmer Details
            </p>

            <h3
              className="text-2xl font-display mt-1"
              style={{
                color: "var(--mist)",
              }}
            >
              {user.name || "Unknown Farmer"}
            </h3>
          </div>

          <button
            onClick={() =>
              setSelectedFarmer(null)
            }
            className="text-sm px-3 py-1 rounded-full"
            style={{
              border:
                "1px solid var(--line)",
              color: "var(--mist-dim)",
            }}
          >
            Close
          </button>
        </div>

        <div className="mb-6">
          <p
            className="text-sm font-semibold mb-2"
            style={{
              color: "var(--gold)",
            }}
          >
            Account Information
          </p>

          <DetailRow
            label="Name"
            value={user.name}
          />

          <DetailRow
            label="Email"
            value={user.email}
          />

          <DetailRow
            label="Phone"
            value={user.phone}
          />

          <DetailRow
            label="Role"
            value={user.role}
          />

          <DetailRow
            label="Account Status"
            value={user.status}
          />

          <DetailRow
            label="Account Created"
            value={
              user.createdAt
                ? new Date(
                    user.createdAt
                  ).toLocaleString()
                : null
            }
          />
        </div>

        <div>
          <p
            className="text-sm font-semibold mb-2"
            style={{
              color: "var(--gold)",
            }}
          >
            Farmer Profile
          </p>

          <DetailRow
            label="Village"
            value={selectedFarmer.village}
          />

          <DetailRow
            label="District"
            value={
              selectedFarmer.district
            }
          />

          <DetailRow
            label="State"
            value={
              selectedFarmer.state
            }
          />

          <DetailRow
            label="Verification"
            value={
              selectedFarmer.verified
                ? "Verified"
                : "Not Verified"
            }
          />

          <DetailRow
            label="Profile Created"
            value={
              selectedFarmer.createdAt
                ? new Date(
                    selectedFarmer.createdAt
                  ).toLocaleString()
                : null
            }
          />
        </div>

        <button
          onClick={() =>
            handleToggleVerify(
              selectedFarmer._id,
              selectedFarmer.verified
            )
          }
          className="mt-5 px-5 py-2 rounded-full text-sm"
          style={{
            background:
              selectedFarmer.verified
                ? "transparent"
                : "var(--gold)",
            color:
              selectedFarmer.verified
                ? "var(--crop-solid)"
                : "var(--ink)",
            border:
              selectedFarmer.verified
                ? "1px solid var(--crop-solid)"
                : "none",
          }}
        >
          {selectedFarmer.verified
            ? "✓ Verified — Unverify"
            : "Verify Farmer"}
        </button>
      </div>
    );
  };

  // ==========================================
  // BUYER DETAILS PANEL
  // ==========================================
  const BuyerDetails = () => {
    if (detailsLoading) {
      return (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--soil-2)",
            border: "1px solid var(--line)",
          }}
        >
          <p
            style={{
              color: "var(--mist-dim)",
            }}
          >
            Loading buyer details...
          </p>
        </div>
      );
    }

    if (!selectedBuyer) {
      return null;
    }

    const user =
      selectedBuyer.user_id || {};

    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--soil-2)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <p
              className="text-xs uppercase tracking-wide"
              style={{
                color: "var(--gold)",
              }}
            >
              Buyer Details
            </p>

            <h3
              className="text-2xl font-display mt-1"
              style={{
                color: "var(--mist)",
              }}
            >
              {user.name || "Unknown Buyer"}
            </h3>
          </div>

          <button
            onClick={() =>
              setSelectedBuyer(null)
            }
            className="text-sm px-3 py-1 rounded-full"
            style={{
              border:
                "1px solid var(--line)",
              color: "var(--mist-dim)",
            }}
          >
            Close
          </button>
        </div>

        <div className="mb-6">
          <p
            className="text-sm font-semibold mb-2"
            style={{
              color: "var(--gold)",
            }}
          >
            Account Information
          </p>

          <DetailRow
            label="Name"
            value={user.name}
          />

          <DetailRow
            label="Email"
            value={user.email}
          />

          <DetailRow
            label="Phone"
            value={user.phone}
          />

          <DetailRow
            label="Role"
            value={user.role}
          />

          <DetailRow
            label="Account Status"
            value={user.status}
          />

          <DetailRow
            label="Account Created"
            value={
              user.createdAt
                ? new Date(
                    user.createdAt
                  ).toLocaleString()
                : null
            }
          />
        </div>

        <div>
          <p
            className="text-sm font-semibold mb-2"
            style={{
              color: "var(--gold)",
            }}
          >
            Buyer Profile
          </p>

          <DetailRow
            label="Company Name"
            value={
              selectedBuyer.company_name
            }
          />

          <DetailRow
            label="Location"
            value={
              selectedBuyer.location
            }
          />

          <DetailRow
            label="Profile Created"
            value={
              selectedBuyer.createdAt
                ? new Date(
                    selectedBuyer.createdAt
                  ).toLocaleString()
                : null
            }
          />
        </div>
      </div>
    );
  };

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 pb-10">
      <p className="eyebrow mb-3">
        Admin
      </p>

      <h2
        className="text-3xl mb-8"
        style={{
          color: "var(--mist)",
        }}
      >
        Platform Dashboard
      </h2>

      {/* ======================================
          TABS
      ====================================== */}

      <div className="flex gap-4 mb-8 text-sm flex-wrap">
        <button
          onClick={() => {
            setActiveTab("overview");
            setSelectedFarmer(null);
            setSelectedBuyer(null);
          }}
          style={{
            color:
              activeTab === "overview"
                ? "var(--gold)"
                : "var(--mist-dim)",
          }}
        >
          Overview
        </button>

        <button
          onClick={() => {
            setActiveTab("farmers");
            setSelectedBuyer(null);
          }}
          style={{
            color:
              activeTab === "farmers"
                ? "var(--gold)"
                : "var(--mist-dim)",
          }}
        >
          Farmers
        </button>

        <button
          onClick={() => {
            setActiveTab("buyers");
            setSelectedFarmer(null);
          }}
          style={{
            color:
              activeTab === "buyers"
                ? "var(--gold)"
                : "var(--mist-dim)",
          }}
        >
          Buyers
        </button>

        <button
          onClick={() => {
            setActiveTab("pending");
            setSelectedFarmer(null);
            setSelectedBuyer(null);
          }}
          style={{
            color:
              activeTab === "pending"
                ? "var(--gold)"
                : "var(--mist-dim)",
          }}
        >
          Pending Approvals{" "}
          {pendingUsers.length > 0 &&
            `(${pendingUsers.length})`}
        </button>

        <button
          onClick={() => {
            setActiveTab("mandi");
            setSelectedFarmer(null);
            setSelectedBuyer(null);
          }}
          style={{
            color:
              activeTab === "mandi"
                ? "var(--gold)"
                : "var(--mist-dim)",
          }}
        >
          Mandi Prices
        </button>
      </div>

      {/* ======================================
          OVERVIEW
      ====================================== */}

      {activeTab === "overview" &&
        stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Farmers"
              value={countFor("farmer")}
            />

            <StatCard
              label="Buyers"
              value={countFor("buyer")}
            />

            <StatCard
              label="Total Crops"
              value={stats.total_crops}
            />

            <StatCard
              label="Total Orders"
              value={stats.total_orders}
            />

            <StatCard
              label="Platform Revenue"
              value={`₹${stats.total_platform_revenue}`}
            />
          </div>
        )}

      {/* ======================================
          FARMERS
      ====================================== */}

      {activeTab === "farmers" && (
        <div className="space-y-5">
          {farmers.length === 0 && (
            <p
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              No farmers found.
            </p>
          )}

          {!selectedFarmer && (
            <div className="space-y-3">
              {farmers.map((farmer) => (
                <div
                  key={farmer.farmer_id}
                  onClick={() =>
                    fetchFarmerDetails(
                      farmer.farmer_id
                    )
                  }
                  className="rounded-xl p-4 flex justify-between items-center flex-wrap gap-3 cursor-pointer transition"
                  style={{
                    background:
                      "var(--soil-2)",
                    border:
                      "1px solid var(--line)",
                  }}
                >
                  <div>
                    <p
                      className="font-display"
                      style={{
                        color:
                          "var(--mist)",
                      }}
                    >
                      {farmer.name}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      {farmer.email}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      {farmer.village},{" "}
                      {farmer.district},{" "}
                      {farmer.state}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        border:
                          farmer.verified
                            ? "1px solid var(--crop-solid)"
                            : "1px solid var(--line)",
                        color:
                          farmer.verified
                            ? "var(--crop-solid)"
                            : "var(--mist-dim)",
                      }}
                    >
                      {farmer.verified
                        ? "✓ Verified"
                        : "Not Verified"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        handleToggleVerify(
                          farmer.farmer_id,
                          farmer.verified
                        );
                      }}
                      className="text-xs px-4 py-1.5 rounded-full"
                      style={{
                        background:
                          farmer.verified
                            ? "transparent"
                            : "var(--gold)",
                        color:
                          farmer.verified
                            ? "var(--crop-solid)"
                            : "var(--ink)",
                        border:
                          farmer.verified
                            ? "1px solid var(--crop-solid)"
                            : "none",
                      }}
                    >
                      {farmer.verified
                        ? "Unverify"
                        : "Verify"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFarmer && (
            <FarmerDetails />
          )}
        </div>
      )}

      {/* ======================================
          BUYERS
      ====================================== */}

      {activeTab === "buyers" && (
        <div className="space-y-5">
          {buyers.length === 0 && (
            <p
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              No buyers found.
            </p>
          )}

          {!selectedBuyer && (
            <div className="space-y-3">
              {buyers.map((buyer) => {
                const user =
                  buyer.user_id || {};

                return (
                  <div
                    key={buyer._id}
                    onClick={() =>
                      fetchBuyerDetails(
                        buyer._id
                      )
                    }
                    className="rounded-xl p-4 flex justify-between items-center flex-wrap gap-3 cursor-pointer"
                    style={{
                      background:
                        "var(--soil-2)",
                      border:
                        "1px solid var(--line)",
                    }}
                  >
                    <div>
                      <p
                        className="font-display"
                        style={{
                          color:
                            "var(--mist)",
                        }}
                      >
                        {user.name ||
                          "Unknown Buyer"}
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        {user.email ||
                          "No email"}
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color:
                            "var(--mist-dim)",
                        }}
                      >
                        {buyer.company_name ||
                          "No company name"}
                        {" — "}
                        {buyer.location ||
                          "No location"}
                      </p>
                    </div>

                    <span
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        border:
                          "1px solid var(--line)",
                        color:
                          "var(--mist-dim)",
                      }}
                    >
                      View Details →
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {selectedBuyer && (
            <BuyerDetails />
          )}
        </div>
      )}

      {/* ======================================
          PENDING APPROVALS
      ====================================== */}

      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingUsers.length === 0 && (
            <p
              style={{
                color:
                  "var(--mist-dim)",
              }}
            >
              No pending sign-ups right now.
            </p>
          )}

          {pendingUsers.map((u) => (
            <div
              key={u._id}
              className="rounded-xl p-4 flex justify-between items-center flex-wrap gap-2"
              style={{
                background:
                  "var(--soil-2)",
                border:
                  "1px solid var(--line)",
              }}
            >
              <div>
                <p
                  className="font-display"
                  style={{
                    color: "var(--mist)",
                  }}
                >
                  {u.name}
                </p>

                <p
                  className="text-xs"
                  style={{
                    color:
                      "var(--mist-dim)",
                  }}
                >
                  {u.email} — {u.role}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleReviewUser(
                      u._id,
                      "approved"
                    )
                  }
                  className="text-xs px-4 py-1.5 rounded-full"
                  style={{
                    background:
                      "var(--gold)",
                    color: "var(--ink)",
                  }}
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    handleReviewUser(
                      u._id,
                      "rejected"
                    )
                  }
                  className="text-xs px-4 py-1.5 rounded-full"
                  style={{
                    border:
                      "1px solid var(--clay)",
                    color:
                      "var(--clay)",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================
          MANDI
      ====================================== */}

      {activeTab === "mandi" && (
        <div>
          <form
            onSubmit={
              handleSetMandiPrice
            }
            className="rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-end"
            style={{
              background:
                "var(--soil-2)",
              border:
                "1px solid var(--line)",
            }}
          >
            <input
              type="text"
              placeholder="Crop name"
              value={mandiCropName}
              onChange={(e) =>
                setMandiCropName(
                  e.target.value
                )
              }
              className="p-2 rounded-lg text-sm"
              style={{
                background:
                  "var(--soil)",
                border:
                  "1px solid var(--line)",
                color: "var(--mist)",
              }}
            />

            <select
              value={mandiCategory}
              onChange={(e) =>
                setMandiCategory(
                  e.target.value
                )
              }
              className="p-2 rounded-lg text-sm"
              style={{
                background:
                  "var(--soil)",
                border:
                  "1px solid var(--line)",
                color: "var(--mist)",
              }}
            >
              <option>
                Vegetables
              </option>

              <option>
                Fruits
              </option>

              <option>
                Grains
              </option>

              <option>
                Dairy
              </option>

              <option>
                Spices
              </option>

              <option>
                Other
              </option>
            </select>

            <input
              type="number"
              placeholder="Price/kg"
              value={mandiPrice}
              onChange={(e) =>
                setMandiPrice(
                  e.target.value
                )
              }
              className="p-2 rounded-lg text-sm w-28"
              style={{
                background:
                  "var(--soil)",
                border:
                  "1px solid var(--line)",
                color: "var(--mist)",
              }}
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                background:
                  "var(--gold)",
                color: "var(--ink)",
              }}
            >
              Set Price
            </button>
          </form>

          <div className="space-y-2">
            {mandiPrices.map((p) => (
              <div
                key={p._id}
                className="flex justify-between p-3 rounded-lg text-sm"
                style={{
                  background:
                    "var(--soil-2)",
                }}
              >
                <span
                  style={{
                    color:
                      "var(--mist)",
                  }}
                >
                  {p.crop_name} (
                  {p.category})
                </span>

                <span
                  style={{
                    color:
                      "var(--gold)",
                  }}
                >
                  ₹{p.price_per_kg}/kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;