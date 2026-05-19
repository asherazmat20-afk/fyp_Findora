import { Navigate } from "react-router-dom";

function AdminLogin() {
  return <Navigate to="/login?as=admin" replace />;
}

export default AdminLogin;
