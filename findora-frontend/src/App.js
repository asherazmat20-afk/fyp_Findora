import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Search from "./pages/Search";
import ItemDetails from "./pages/ItemDetails";
import UserDashboard from "./pages/UserDashboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import MyLostItems from "./pages/MyLostItems";
import MyFoundItems from "./pages/MyFoundItems";
import Notifications from "./pages/Notifications";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
//import Footer from "./components/Footer";
import "leaflet/dist/leaflet.css";
import PageTransition from "./components/PageTransition";
//import UiLoader from "./components/UiLoader";
//import UiToast from "./components/UiToast";

function App() {
  const withTransition = (component) => <PageTransition>{component}</PageTransition>;
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={withTransition(<Home />)} />
        <Route path="/login" element={withTransition(<Login />)} />
        <Route path="/signup" element={withTransition(<Signup />)} />
        <Route path="/admin-login" element={withTransition(<AdminLogin />)} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {withTransition(<Profile />)}
            </ProtectedRoute>
          }
        />

        {/* USER PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {withTransition(<UserDashboard />)}
              </ProtectedRoute>
            }
          />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              {withTransition(<Search />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/report-lost"
          element={
            <ProtectedRoute>
              {withTransition(<ReportLost />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/report-found"
          element={
            <ProtectedRoute>
              {withTransition(<ReportFound />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/item/:id"
          element={
            <ProtectedRoute>
              {withTransition(<ItemDetails />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-lost-items"
          element={
            <ProtectedRoute>
              {withTransition(<MyLostItems />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-found-items"
          element={
            <ProtectedRoute>
              {withTransition(<MyFoundItems />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              {withTransition(<Notifications />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              {withTransition(<Chat />)}
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTE */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              {withTransition(<AdminDashboard />)}
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              {withTransition(<AdminUsers />)}
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
