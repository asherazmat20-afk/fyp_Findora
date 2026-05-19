import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch } from "../utils/apiClient";
import ReporterContact from "../components/ReporterContact";
import { ClaimProofSummary } from "../components/OwnerVerificationPanel";

function AdminDashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [busyItemId, setBusyItemId] = useState(null);
  const [toast, setToast] = useState("");

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const requestHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const handleUnauthorized = useCallback(() => {
    sessionStorage.clear();
    navigate("/login");
  }, [navigate]);

  const priorityScore = (item) => {
    // Simple moderation priority: missing details, no image, pending state
    let score = 0;
    if (item.status === "pending") score += 50;
    if (!item.image) score += 20;
    if (!item.description || item.description.length < 20) score += 20;
    if (!item.location) score += 10;
    return score;
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token || role !== "admin") {
        navigate("/login");
        return;
      }

      const res = await apiFetch(`/api/items/admin`, {
        headers: requestHeaders,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch items");
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [requestHeaders, handleUnauthorized, navigate, role, token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteItem = async (id) => {
    const confirmDelete = window.confirm("Delete this report permanently?");
    if (!confirmDelete) return;

    const previousItems = items;
    setBusyItemId(id);
    setItems((prev) => prev.filter((item) => item._id !== id));

    try {
      const res = await apiFetch(`/api/items/${id}`, {
        method: "DELETE",
        headers: requestHeaders,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      showToast("Item deleted");
    } catch (err) {
      setItems(previousItems);
      showToast(err.message || "Delete failed");
    } finally {
      setBusyItemId(null);
    }
  };

  const updateStatus = async (id, status) => {
    const previousItems = items;
    setBusyItemId(id);

    setItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, status } : item))
    );

    try {
      const res = await apiFetch(`/api/items/status/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({ status }),
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      showToast(`Marked as ${status}`);
    } catch (err) {
      setItems(previousItems);
      showToast(err.message || "Update failed");
    } finally {
      setBusyItemId(null);
    }
  };

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      verified: items.filter((i) => i.status === "verified").length,
      rejected: items.filter((i) => i.status === "rejected").length,
      highPriority: items.filter((i) => priorityScore(i) >= 60).length,
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    let list = [...items];

    if (filter !== "all") {
      list = list.filter((item) => item.status === filter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.user?.fullName?.toLowerCase().includes(q) ||
          item.user?.phone?.toLowerCase().includes(q)
      );
    }

    if (priorityOnly) {
      list = list.filter((item) => priorityScore(item) >= 60);
    }

    // Queue sorting: high priority first
    list.sort((a, b) => priorityScore(b) - priorityScore(a));
    return list;
  }, [items, filter, searchTerm, priorityOnly]);

  const statusColor = (status) => {
    if (status === "verified") return "text-emerald-600";
    if (status === "rejected") return "text-rose-600";
    return "text-amber-600";
  };

  const resolveClaim = async (id, action) => {
    try {
      const res = await apiFetch(`/api/items/${id}/claim-resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim update failed");
      showToast(`Claim ${action}d`);
      fetchItems();
    } catch (err) {
      showToast(err.message);
    }
  };

  if (loading) return <UiLoader text="Fetching data..." />;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-3xl font-extrabold text-red-600 text-center">
              Admin Moderation Console
            </h2>
            <p className="text-center text-slate-500 mt-1">
              Review, verify, and prioritize reports efficiently
            </p>
            <motion.div className="flex justify-center mt-4">
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
              >
                Manage users
              </Link>
            </motion.div>
          </motion.div>

          {/* Error */}
          {error ? (
            <div className="max-w-3xl mx-auto mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : null}

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Total Reports", value: counts.total, color: "text-slate-700" },
              { label: "Pending", value: counts.pending, color: "text-amber-600" },
              { label: "Verified", value: counts.verified, color: "text-emerald-600" },
              { label: "Rejected", value: counts.rejected, color: "text-rose-600" },
              {
                label: "High Priority Queue",
                value: counts.highPriority,
                color: "text-violet-600",
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                whileHover={{ y: -3 }}
                className="bg-white border rounded-xl shadow-sm p-4"
              >
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, user, location..."
                className="px-4 py-2 border rounded-lg md:col-span-2"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={() => setPriorityOnly((p) => !p)}
                className={`px-4 py-2 rounded-lg border transition ${priorityOnly
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-700 border-slate-300"
                  }`}
              >
                {priorityOnly ? "Priority: ON" : "Priority: OFF"}
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isBusy = busyItemId === item._id;
                  const pScore = priorityScore(item);

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-xl shadow-md border overflow-hidden"
                    >
                      <img
                        src={item.image || "https://dummyimage.com/600x400/e5e7eb/6b7280"}
                        alt={item.title || "Item"}
                        onClick={() => item.image && setSelectedImage(item.image)}
                        className="w-full h-44 object-cover cursor-pointer"
                      />

                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${pScore >= 60
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            P{pScore}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>

                        <ReporterContact user={item.user} />

                        <div className="text-sm text-slate-600 space-y-1">
                          <p>
                            <b>Email:</b> {item.user?.email || "N/A"}
                          </p>
                          <p>
                            <b>Type:</b> {item.type}
                          </p>
                          <p>
                            <b>Location:</b> {item.location}
                          </p>
                        </div>
                        <p>
                          <b>AI Risk:</b>{" "}
                          <span
                            className={
                              item.aiSignals?.riskLevel === "high"
                                ? "text-rose-600"
                                : item.aiSignals?.riskLevel === "medium"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }
                          >
                            {item.aiSignals?.riskLevel || "low"} ({item.aiSignals?.riskScore || 0})
                          </span>
                        </p>
                        <p>
                          <b>Owner verification:</b> {item.claim?.status || "none"}
                          {item.claim?.reporterDecision && item.claim.reporterDecision !== "none"
                            ? ` · Reporter ${item.claim.reporterDecision}`
                            : ""}
                        </p>

                        {item.claim?.status === "requested" ? (
                          <ClaimProofSummary claim={item.claim} compact />
                        ) : null}

                        <p className={`font-semibold ${statusColor(item.status)}`}>
                          Status: {item.status}
                        </p>

                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <button
                            onClick={() => updateStatus(item._id, "verified")}
                            disabled={isBusy}
                            className={`px-2 py-2 rounded text-sm text-white ${isBusy
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                          >
                            Verify
                          </button>

                          <button
                            onClick={() => updateStatus(item._id, "rejected")}
                            disabled={isBusy}
                            className={`px-2 py-2 rounded text-sm text-white ${isBusy
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-600"
                              }`}
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => deleteItem(item._id)}
                            disabled={isBusy}
                            className={`px-2 py-2 rounded text-sm text-white ${isBusy
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-rose-600 hover:bg-rose-700"
                              }`}
                          >
                            Delete
                          </button>
                        </div>
                        {item.claim?.status === "requested" && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              onClick={() => resolveClaim(item._id, "approve")}
                              className="px-2 py-2 rounded text-sm text-white bg-emerald-600"
                            >
                              Approve owner
                            </button>
                            <button
                              onClick={() => resolveClaim(item._id, "reject")}
                              className="px-2 py-2 rounded text-sm text-white bg-rose-600"
                            >
                              Reject owner
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })

              ) : (
                <div className="text-center col-span-3 bg-white border border-dashed rounded-2xl p-10">
                  <p className="text-slate-500 text-lg">No reports found</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Try clearing filters or disabling priority mode.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* image modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.img
                src={selectedImage}
                alt="Full view"
                className="max-w-[92%] max-h-[92%] rounded-lg shadow-2xl"
                initial={{ scale: 0.96 }}
                animate={{ scale: 1 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg z-[60]"
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

export default AdminDashboard;