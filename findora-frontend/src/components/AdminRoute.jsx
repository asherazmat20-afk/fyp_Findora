import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const isAdmin =
    sessionStorage.getItem("isAdmin") === "true" ||
    sessionStorage.getItem("role") === "admin";

  if (!isAdmin) {
    return <Navigate to="/login?as=admin" replace />;
  }

  return children;
}

export default AdminRoute;