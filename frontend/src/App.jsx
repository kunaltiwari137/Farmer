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
import Cart from "./Cart";
import Wishlist from "./Wishlist";
import Chat from "./Chat";
import FarmerProfile from "./FarmerProfile";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import FarmerLoader from "./FarmerLoader";
import LoadingTruck from "./LoadingTruck";
import socket from "./socket";
import Mandi from "./Mandi";
import Checkout from "./Checkout";
import BulkOrder from "./BulkOrder";
import BulkRequests from "./BulkRequests";
import MyBulkRequests from "./MyBulkRequests";
import ChangePassword from "./ChangePassword";

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");

    return stored
      ? JSON.parse(stored)
      : null;
  });

  const [initialLoading, setInitialLoading] =
    useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => setInitialLoading(false),
      2600
    );

    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (user) {
      socket.connect();

      socket.emit(
        "register",
        user.user_id
      );
    }

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    socket.disconnect();
  };

  // ==========================================
  // INITIAL LOADING
  // ==========================================

  if (initialLoading) {
    return user &&
      user.role === "farmer" ? (
      <FarmerLoader />
    ) : (
      <LoadingTruck fullScreen />
    );
  }

  // ==========================================
  // APP
  // ==========================================

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "var(--soil)",
        color: "var(--mist)",
      }}
    >
      <Navbar
        user={user}
        onLogout={handleLogout}
      />

      <div className="pt-24 sm:pt-28 px-4 sm:px-8 pb-16 max-w-6xl mx-auto">

        <Routes>

          {/* ======================================
              PUBLIC ROUTES
          ====================================== */}

          <Route
            path="/"
            element={<CropList />}
          />

          <Route
            path="/crop/:id"
            element={<CropDetail />}
          />

          <Route
            path="/login"
            element={
              <Login
                onLoginSuccess={setUser}
              />
            }
          />

          <Route
            path="/signup"
            element={
              <Signup
                onLoginSuccess={setUser}
              />
            }
          />

          <Route
            path="/farmer/:id"
            element={<FarmerProfile />}
          />

          {/* ======================================
              MANDI
          ====================================== */}

          <Route
            path="/mandi"
            element={
              <ProtectedRoute>
                <Mandi />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              OLD PLACE ORDER
              Kept temporarily
          ====================================== */}

          <Route
            path="/place-order"
            element={
              <ProtectedRoute>
                <PlaceOrder />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              BUYER ORDERS
          ====================================== */}

          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              FARMER
          ====================================== */}

          <Route
            path="/list-crop"
            element={
              <ProtectedRoute>
                <ListCrop />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              FARMER BULK REQUESTS
          ====================================== */}

          <Route
            path="/bulk-requests"
            element={
              <ProtectedRoute>
                <BulkRequests />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              BUYER BULK REQUESTS
          ====================================== */}

          <Route
            path="/my-bulk-requests"
            element={
              <ProtectedRoute>
                <MyBulkRequests />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              BUYER PROFILE
          ====================================== */}

          <Route
            path="/buyer-profile"
            element={
              <ProtectedRoute>
                <BuyerProfile />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              USER PROFILE
          ====================================== */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile user={user} />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              CHANGE PASSWORD
          ====================================== */}

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              CART
          ====================================== */}

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              WISHLIST
          ====================================== */}

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              CHECKOUT
          ====================================== */}

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              BULK ORDER
          ====================================== */}

          <Route
            path="/bulk-order"
            element={
              <ProtectedRoute>
                <BulkOrder />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              CHAT
          ====================================== */}

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* ======================================
              ADMIN
          ====================================== */}

          <Route
            path="/admin"
            element={
              <AdminRoute user={user}>
                <AdminDashboard />
              </AdminRoute>
            }
          />

        </Routes>

      </div>
    </div>
  );
}

export default App;