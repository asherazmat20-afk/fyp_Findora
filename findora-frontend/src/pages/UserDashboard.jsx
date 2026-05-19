import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch } from "../utils/apiClient";
import { getSession } from "../utils/auth";
import OwnerVerificationPanel from "../components/OwnerVerificationPanel";

function UserDashboard() {
  const [items, setItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [toast, setToast] = useState("");

  const { userId } = getSession();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await apiFetch(`/api/items/mine`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [userId]);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) => i.status === "pending").length;
    const verified = items.filter((i) => i.status === "verified").length;
    const rejected = items.filter((i) => i.status === "rejected").length;
    const recoveredRate = total ? Math.round((verified / total) * 100) : 0;

    return { total, pending, verified, rejected, recoveredRate };
  }, [items]);

  const pendingVerifications = useMemo(
    () => items.filter((item) => item.claim?.status === "requested"),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (activeStatus === "all") return items;
    return items.filter((item) => item.status === activeStatus);
  }, [items, activeStatus]);

  const handleVerificationReviewed = (updatedItem, errorMsg) => {
    if (errorMsg) {
      setToast(errorMsg);
      setTimeout(() => setToast(""), 2500);
      return;
    }
    if (updatedItem) {
      setItems((prev) =>
        prev.map((i) => (i._id === updatedItem._id ? updatedItem : i))
      );
      setToast("Ownership review saved");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const statusPill = (status) => {
    if (status === "verified")
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (status === "rejected")
      return "bg-rose-100 text-rose-700 border border-rose-200";
    return "bg-amber-100 text-amber-700 border border-amber-200";
  };

  if (loading) return <UiLoader text="Fetching data..." />;

  return (
    <PageTransition>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-extrabold text-blue-700 text-center">
            Recovery Dashboard
          </h2>
          <p className="text-center text-slate-500 mt-1">
            Track your reported items and recovery progress
          </p>
        </motion.div>

        {/* Top Actions */}
        <div className="flex flex-wrap gap-2 justify-between items-center mb-5">
          <button
            onClick={() => navigate("/profile")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Account Info
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                viewMode === "grid"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                viewMode === "list"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700" },
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
            { label: "Verified", value: stats.verified, color: "text-emerald-600" },
            { label: "Rejected", value: stats.rejected, color: "text-rose-600" },
            {
              label: "Recovery Rate",
              value: `${stats.recoveredRate}%`,
              color: "text-blue-600",
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              whileHover={{ y: -3 }}
              className="bg-white rounded-xl shadow-sm border p-4"
            >
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </motion.div>
          ))}
        </div>

        {pendingVerifications.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-violet-200 shadow-sm p-5">
            <h3 className="text-lg font-bold text-violet-800 mb-1">
              Owner verification requests
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Someone claims to own an item you listed. Review their proof below.
            </p>
            <div className="space-y-4">
              {pendingVerifications.map((item) => (
                <div key={item._id} className="border rounded-xl p-4 bg-slate-50/50">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 capitalize mb-2">
                    {item.type} · {item.category}
                  </p>
                  <OwnerVerificationPanel
                    item={item}
                    onReviewed={handleVerificationReviewed}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "pending", "verified", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize border transition ${
                activeStatus === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredItems.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ y: -3 }}
                  className={`bg-white rounded-2xl shadow-md border overflow-hidden ${
                    viewMode === "list" ? "flex flex-col md:flex-row" : ""
                  }`}
                >
                  <img
                    src={item.image || "https://dummyimage.com/300"}
                    onClick={() => item.image && setSelectedImage(item.image)}
                    alt="item"
                    className={`object-cover cursor-pointer ${
                      viewMode === "list"
                        ? "w-full md:w-56 h-44 md:h-auto"
                        : "w-full h-44"
                    }`}
                  />

                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${statusPill(
                          item.status
                        )}`}
                      >
                        {item.status || "pending"}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-2">{item.description}</p>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold">Type:</span> {item.type}
                      </p>
                      <p>
                        <span className="font-semibold">Category:</span> {item.category}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span> {item.date}
                      </p>
                      <p>
                        <span className="font-semibold">Location:</span> {item.location}
                      </p>
                    </div>

                    {item.status === "pending" && (
                      <p className="mt-3 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                        Waiting for admin verification
                      </p>
                    )}
                    {item.claim?.status === "requested" && (
                      <p className="mt-2 text-xs text-violet-700 bg-violet-50 px-2 py-1 rounded w-fit">
                        Ownership proof awaiting your review
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center bg-white border border-dashed rounded-2xl p-10">
            <p className="text-slate-500 text-lg">No items in this status yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              Try switching status tabs or report a new item.
            </p>
          </div>
        )}
      </div>

      {/* Full image modal */}
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
              alt="full"
              className="max-w-[92%] max-h-[92%] rounded-lg shadow-2xl"
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <UiToast message={toast} />
    </PageTransition>
  );
}

export default UserDashboard;