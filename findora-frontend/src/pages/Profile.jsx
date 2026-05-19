import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { API_BASE_URL } from "../config/api";
import { apiFetch } from "../utils/apiClient";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "" });

  const userId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  const initials = useMemo(() => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "Recently joined";
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return "Recently joined";
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");

        if (!userId) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load profile");
        }

        setUser(data);
        setEditForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, token, navigate]);

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim() || !editForm.phone.trim()) {
      showToast("Name and phone are required");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          phone: editForm.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setUser(data.user);
      sessionStorage.setItem("userName", data.user.fullName);
      setEditing(false);
      showToast("Profile updated");
    } catch (err) {
      showToast(err.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    showToast("Logged out");
    setTimeout(() => navigate("/login"), 500);
  };

  if (loading) return <UiLoader text="Fetching data..." />;

  if (error) {
    return <div className="text-center mt-20 text-red-500 text-lg">{error}</div>;
  }

  return (
    <PageTransition> 
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-slate-800">
                {user?.fullName || "User"}
              </h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-1">Member since {memberSince}</p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                role === "admin"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {role === "admin" ? "Admin Account" : "Verified Member"}
            </span>
          </div>
        </motion.div>

        {/* Main cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-md border border-slate-100 p-5"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">Account Information</h3>

            <div className="space-y-3 text-sm">
              {editing ? (
                <>
                  <div>
                    <label className="text-slate-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, fullName: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Phone number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="+92 300 1234567"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Used on your item cards so people can call you when you are offline.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500">Full Name</p>
                    <p className="font-semibold text-slate-800">{user?.fullName || "-"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500">Phone number</p>
                    <p className="font-semibold text-slate-800">
                      {user?.phone?.trim() || "Not set — add one so others can call you"}
                    </p>
                  </div>
                </>
              )}

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500">Email Address</p>
                <p className="font-semibold text-slate-800">{user?.email || "-"}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500">Role</p>
                <p className="font-semibold text-slate-800 capitalize">{role || "user"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
              {editing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditForm({
                        fullName: user?.fullName || "",
                        phone: user?.phone || "",
                      });
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md border border-slate-100 p-5"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-3">Activity Snapshot</h3>

            <div className="space-y-2 text-sm text-slate-600">
              <p className="bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
                Smart match profile: Active
              </p>
              <p className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2">
                Trust level: Good standing
              </p>
              <p className="bg-amber-50 text-amber-700 rounded-lg px-3 py-2">
                Keep reports detailed for better matches
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="mt-5 w-full px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              Logout
            </button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <UiToast message={toast} />
    </PageTransition>
  );
}

export default Profile;