import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config/api";
import PageTransition from "../components/PageTransition";
import UiToast from "../components/UiToast";

function AdminLogin() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    formRef.current?.reset();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    resetForm();
  }, []);

  useEffect(() => {
    // Handles browser back-forward cache restoring stale input values.
    const handlePageShow = () => resetForm();
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        showToast(data?.error || "Login failed");
        return;
      }

      if (data.user?.role !== "admin") {
        showToast("Access denied: admin only");
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userId", data.user._id);
      sessionStorage.setItem("userName", data.user.fullName);
      sessionStorage.setItem("role", data.user.role);
      sessionStorage.setItem("isAdmin", "true");

      showToast("Admin login successful");
      resetForm();
      setTimeout(() => navigate("/admin"), 500);
    } catch (error) {
      console.error(error);
      showToast("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex justify-center items-center p-4">
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          autoComplete="off"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-rose-100"
        >
          {/* Decoy fields to reduce aggressive browser autofill */}
          <input
            type="text"
            name="fake-username"
            autoComplete="username"
            className="hidden"
            tabIndex={-1}
          />
          <input
            type="password"
            name="fake-password"
            autoComplete="new-password"
            className="hidden"
            tabIndex={-1}
          />

          <h2 className="text-2xl font-bold mb-1 text-center text-rose-700">Admin Login</h2>
          <p className="text-center text-sm text-slate-500 mb-5">
            Access moderation console securely
          </p>

          <input
            type="email"
            placeholder="Admin Email"
            className="w-full mb-3 px-3 py-2.5 border rounded-xl"
            value={email}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 px-3 py-2.5 border rounded-xl"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className={`w-full text-white py-2.5 rounded-xl transition ${
              loading ? "bg-slate-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </motion.form>
      </div>

      <UiToast message={toast} />
    </PageTransition>
  );
}

export default AdminLogin;