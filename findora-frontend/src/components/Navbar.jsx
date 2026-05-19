import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaSearch,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaBars,
  FaTimes,
  FaClipboardList,
  FaBell,
} from "react-icons/fa";
import { API_BASE_URL } from "../config/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");
  const userName = sessionStorage.getItem("userName");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token) {
        setNotificationCount(0);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load notification count");

        setNotificationCount(Number(data.count) || 0);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUnreadCount();
  }, [token, location.pathname]);

  const renderNavLabel = (item) => {
    if (item.to !== "/notifications") {
      return (
        <>
          {item.icon} {item.label}
        </>
      );
    }

    return (
      <>
        <span className="relative inline-flex items-center">
          {item.icon}
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </span>
        {item.label}
      </>
    );
  };

  const userLinks =
    role === "admin"
      ? [
          { to: "/admin", label: "Moderation", icon: <FaClipboardList /> },
          { to: "/admin/users", label: "Users", icon: <FaUser /> },
          { to: "/search", label: "Search", icon: <FaSearch /> },
          { to: "/profile", label: "Profile", icon: <FaUser /> },
        ]
      : [
          { to: "/dashboard", label: "Dashboard", icon: <FaUser /> },
          { to: "/search", label: "Search", icon: <FaSearch /> },
          { to: "/my-lost-items", label: "My Lost", icon: <FaClipboardList /> },
          { to: "/my-found-items", label: "My Found", icon: <FaClipboardList /> },
          { to: "/notifications", label: "Notifications", icon: <FaBell /> },
        ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold text-blue-700 tracking-tight">
          Findora
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
              location.pathname === "/"
                ? "bg-blue-100 text-blue-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FaHome /> Home
          </Link>

          {token &&
            userLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  location.pathname === item.to
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {renderNavLabel(item)}
              </Link>
            ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <>
              <span className="text-xs text-slate-500">
                {userName ? `Hi, ${userName}` : "Logged in"}
              </span>
              <button
                onClick={handleLogout}
                className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition flex items-center gap-2"
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FaSignInAlt /> Login
            </button>
          )}
        </div>

        <button
          className="md:hidden text-2xl text-slate-700"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100"
              >
                <FaHome /> Home
              </Link>

              {token &&
                userLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100"
                  >
                    {renderNavLabel(item)}
                  </Link>
                ))}

              {!token ? (
                <button
                  onClick={() => {
                    navigate("/login");
                    closeMobileMenu();
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full bg-rose-500 text-white px-4 py-2 rounded-lg"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;