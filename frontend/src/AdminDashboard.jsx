import { useState, useEffect } from "react";
import axios from "axios";
import TiltCard from "./TiltCard";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchStats = () => {
    axios.get("http://localhost:5000/api/admin/stats", authHeader)
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  };

  const fetchFarmers = () => {
    axios.get("http://localhost:5000/api/admin/farmers", authHeader)
      .then((res) => setFarmers(res.data))
      .catch((err) => console.error(err));
  };

  // STEP 1: Load both on mount — they're independent, so both fire in parallel
  useEffect(() => {
    fetchStats();
    fetchFarmers();
  }, []);

  const handleToggleVerify = async (farmerId, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/farmers/${farmerId}/verify`,
        { verified: !currentStatus },
        authHeader
      );
      fetchFarmers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update");
    }
  };

  const StatCard = ({ label, value }) => (
    <TiltCard>
      <div className="rounded-2xl p-5 text-center" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
        <p className="text-2xl font-display" style={{ color: "var(--gold)" }}>{value}</p>
        <p className="text-xs uppercase tracking-wide mt-1" style={{ color: "var(--mist-dim)" }}>{label}</p>
      </div>
    </TiltCard>
  );

  // STEP 2: Helper to pull a specific role's count out of the users_by_role array
  const countFor = (role) => {
    if (!stats) return 0;
    const found = stats.users_by_role.find((r) => r.role === role);
    return found ? found.count : 0;
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <p className="eyebrow mb-3">Admin</p>
      <h2 className="text-3xl mb-8" style={{ color: "var(--mist)" }}>Platform Dashboard</h2>

      {/* STEP 3: Simple tab switcher */}
      <div className="flex gap-4 mb-8 text-sm">
        <button
          onClick={() => setActiveTab("overview")}
          style={{ color: activeTab === "overview" ? "var(--gold)" : "var(--mist-dim)" }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("farmers")}
          style={{ color: activeTab === "farmers" ? "var(--gold)" : "var(--mist-dim)" }}
        >
          Farmer Verification
        </button>
      </div>

      {activeTab === "overview" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Farmers" value={countFor("farmer")} />
          <StatCard label="Buyers" value={countFor("buyer")} />
          <StatCard label="Total Crops" value={stats.total_crops} />
          <StatCard label="Total Orders" value={stats.total_orders} />
          <StatCard label="Platform Revenue" value={`₹${stats.total_platform_revenue}`} />
        </div>
      )}

      {activeTab === "farmers" && (
        <div className="space-y-3">
          {farmers.map((farmer) => (
            <div
              key={farmer.farmer_id}
              className="rounded-xl p-4 flex justify-between items-center"
              style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
            >
              <div>
                <p className="font-display" style={{ color: "var(--mist)" }}>{farmer.name}</p>
                <p className="text-xs" style={{ color: "var(--mist-dim)" }}>
                  {farmer.email} — {farmer.village}, {farmer.district}
                </p>
              </div>
              <button
                onClick={() => handleToggleVerify(farmer.farmer_id, farmer.verified)}
                className="text-xs px-4 py-1.5 rounded-full"
                style={{
                  border: farmer.verified ? "1px solid var(--crop-solid)" : "1px solid var(--gold)",
                  color: farmer.verified ? "var(--crop-solid)" : "var(--gold)",
                }}
              >
                {farmer.verified ? "✓ Verified" : "Verify"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;