import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiToast from "../components/UiToast";

function Signup() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
    });
    setShowPassword(false);
    formRef.current?.reset();
  };

  const passwordChecks = useMemo(() => {
    const p = formData.password;
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /\d/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  }, [formData.password]);

  const strength = useMemo(() => {
    const score = Object.values(passwordChecks).filter(Boolean).length;
    if (score <= 2) return { label: "Weak", color: "bg-rose-500", width: "33%" };
    if (score <= 4) return { label: "Medium", color: "bg-amber-500", width: "66%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  }, [passwordChecks]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    resetForm();
  }, []);

  useEffect(() => {
    const handlePageShow = () => resetForm();
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.phone?.trim() || !formData.password) {
      showToast("Name, email, phone, and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data?.error || "Signup failed");
        return;
      }

      showToast("Account created successfully");
      resetForm();
      setTimeout(() => navigate("/login"), 700);
    } catch (error) {
      console.error(error);
      showToast("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const checkItemClass = (ok) =>
    `text-xs px-2 py-1 rounded-full ${
      ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
    }`;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
          {/* Left branding panel */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-700 to-indigo-700 text-white p-8">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight">
                Welcome to
                <br />
                Findora
              </h2>
              <p className="mt-3 text-blue-100">
                Smart lost-and-found platform for faster and safer recoveries.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-white/10 rounded-lg p-3">AI-assisted matching flow</div>
              <div className="bg-white/10 rounded-lg p-3">Secure in-app chat</div>
              <div className="bg-white/10 rounded-lg p-3">Community trust and verification</div>
            </div>
          </div>

          {/* Form panel */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8"
          >
            <h3 className="text-2xl font-bold text-slate-800">Create account</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Start reporting and recovering items in minutes
            </p>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
            >
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
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter Full Name"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+92 300 1234567"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Shown on your reports so others can call you when you are offline.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create secure password"
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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

                <div className="mt-2">
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className={`h-full ${strength.color}`}
                      animate={{ width: strength.width }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-slate-500">
                    Password strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={checkItemClass(passwordChecks.length)}>8+ chars</span>
                  <span className={checkItemClass(passwordChecks.upper)}>Uppercase</span>
                  <span className={checkItemClass(passwordChecks.lower)}>Lowercase</span>
                  <span className={checkItemClass(passwordChecks.number)}>Number</span>
                  <span className={checkItemClass(passwordChecks.special)}>Special</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl text-white font-medium transition ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-slate-600 mt-5 text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Login
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <UiToast message={toast} />
    </PageTransition>
  );
}

export default Signup;