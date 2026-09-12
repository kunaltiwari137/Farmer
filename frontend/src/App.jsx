import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import CropList from "./CropList";
import CropDetail from "./CropDetail";
import Login from "./Login";
import Signup from "./Signup";
import PlaceOrder from "./PlaceOrder";
import MyOrders from "./MyOrders";
import FarmerDashboard from "./FarmerDashboard";
import ListCrop from "./ListCrop";
import BuyerProfile from "./BuyerProfile";
import AdminDashboard from "./AdminDashboard";
import Profile from "./Profile";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import FarmerLoader from "./FarmerLoader";
import LoadingTruck from "./LoadingTruck";

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (initialLoading) {
    return user && user.role === "farmer" ? <FarmerLoader /> : <LoadingTruck fullScreen />;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--soil)", color: "var(--mist)" }}>
      <Navbar user={user} onLogout={handleLogout} />

      <div className="pt-24 sm:pt-28 px-4 sm:px-8 pb-16 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<CropList />} />
          <Route path="/crop/:id" element={<CropDetail />} />
          <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
          <Route path="/signup" element={<Signup onLoginSuccess={setUser} />} />
          <Route path="/place-order" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/list-crop" element={<ProtectedRoute><ListCrop /></ProtectedRoute>} />
          <Route path="/farmer-dashboard" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/buyer-profile" element={<ProtectedRoute><BuyerProfile /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute user={user}><AdminDashboard /></AdminRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;