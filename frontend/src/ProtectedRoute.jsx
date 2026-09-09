import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  // Check if user is logged in
  const token = localStorage.getItem("token");

  // No token → user is not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Get the logged-in user
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);

  // Get user's role
  const userRole = user.role;

  // Check whether this page requires a specific role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Buyer trying to access farmer page
    if (userRole === "buyer") {
      return <Navigate to="/marketplace" replace />;
    }

    // Farmer trying to access buyer page
    if (userRole === "farmer") {
      return <Navigate to="/farmer-dashboard" replace />;
    }

    // Unknown role
    return <Navigate to="/" replace />;
  }

  // User has permission
  return children;
}

export default ProtectedRoute;