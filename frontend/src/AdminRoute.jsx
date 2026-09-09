import { Navigate } from "react-router-dom";

function AdminRoute({ children, user }) {
  // STEP 1: Not logged in at all -> send to login
  if (!user) {
    return <Navigate to="/login" />;
  }
  // STEP 2: Logged in but not an admin -> send to home, not login (they ARE authenticated, just not authorized)
  if (user.role !== "admin") {
    return <Navigate to="/" />;
  }
  // STEP 3: Passed both checks -> render the actual admin page
  return children;
}

export default AdminRoute;