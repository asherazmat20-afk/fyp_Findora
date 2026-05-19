import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiToast from "../components/UiToast";

function Login() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setShowPassword(false);
    setError("");
    formRef.current?.reset();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");

    resetForm();

    if (token) {
      if (role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    // Handles browser back-forward cache restore where inputs may come back filled.
    const handlePageShow = () => resetForm();
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        const message = data?.error || "Invalid credentials";
        setError(message);
        showToast(message);
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userId", data.user._id);
      sessionStorage.setItem("userName", data.user.fullName);
      sessionStorage.setItem("role", data.user.role);

      if (data.user.role === "admin") {
        sessionStorage.setItem("isAdmin", "true");
        showToast("Welcome admin");
        resetForm();
        setTimeout(() => navigate("/admin"), 600);
      } else {
        sessionStorage.removeItem("isAdmin");
        showToast("Login successful");
        resetForm();
        setTimeout(() => navigate("/dashboard"), 600);
      }
    } catch (submitError) {
      console.error(submitError);
      setError("Login failed. Please try again.");
      showToast("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
          {/* Left panel */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-700 to-indigo-700 text-white p-8">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight">
                Welcome back to
                <br />
                Findora
              </h2>
              <p className="mt-3 text-blue-100">
                Continue your recovery journey with smart lost-and-found tools.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-white/10 rounded-lg p-3">
                Track reported items in real-time
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                Secure communication with finders
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                Verification-backed trust system
              </div>
            </div>
          </div>

          {/* Right panel */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8"
          >
            <h3 className="text-2xl font-bold text-slate-800">Login</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Access your dashboard and continue helping the community
            </p>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
            >
              {/* decoy fields to prevent aggressive browser autofill */}
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

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl text-white font-medium transition ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 font-semibold hover:underline"
              >
                Create Account
              </Link>
            </p>

            <p className="mt-2 text-center">
              <Link
                to="/admin-login"
                className="text-xs sm:text-sm text-slate-500 hover:underline"
              >
                Admin Login
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      <UiToast message={toast} />
    </PageTransition>
  );
}

export default Login;