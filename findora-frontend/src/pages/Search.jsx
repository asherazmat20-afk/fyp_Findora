import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import UiLoader from "../components/UiLoader";
import UiToast from "../components/UiToast";
import { apiFetch } from "../utils/apiClient";
import ReporterContact from "../components/ReporterContact";

function Search() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedImage, setSelectedImage] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast] = useState("");

  const quickTypeFilters = ["all", "lost", "found"];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await apiFetch(`/api/items`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load items");
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const getConfidence = (item) => {
    let score = 45;
    if (item.image) score += 20;
    if (item.description && item.description.length > 40) score += 15;
    if (item.location) score += 10;
    if (item.date) score += 10;
    if (score >= 85) return { label: "High", color: "bg-emerald-100 text-emerald-700" };
    if (score >= 65) return { label: "Medium", color: "bg-amber-100 text-amber-700" };
    return { label: "Low", color: "bg-rose-100 text-rose-700" };
  };

  const filteredItems = useMemo(() => {
    const base = Array.isArray(items)
      ? items.filter((item) => {
          return (
            (searchTerm === "" ||
              item.title?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (category === "" || item.category === category) &&
            (date === "" || item.date === date) &&
            (type === "" || item.type === type) &&
            (location === "" ||
              item.location?.toLowerCase().includes(location.toLowerCase()))
          );
        })
      : [];

    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sortBy === "a-z") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "z-a") return (b.title || "").localeCompare(a.title || "");
      if (sortBy === "oldest") return new Date(a.date || 0) - new Date(b.date || 0);
      return new Date(b.date || 0) - new Date(a.date || 0); // newest
    });

    return sorted;
  }, [items, searchTerm, category, date, type, location, sortBy]);

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("");
    setDate("");
    setType("");
    setLocation("");
    setSortBy("newest");
  };

  if (loading) return <UiLoader text="Fetching data..." />;

  if (error) {
    return <div className="text-center mt-20 text-red-500 text-lg">{error}</div>;
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-blue-700 mb-6 text-center"
        >
          Smart Search: Lost & Found
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-md mb-6 border border-blue-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="Search item..."
              className="px-4 py-2 border rounded-lg md:col-span-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="px-4 py-2 border rounded-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Mobile">Mobile</option>
              <option value="Wallet">Wallet</option>
              <option value="Documents">Documents</option>
              <option value="Electronics">Electronics</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="date"
              className="px-4 py-2 border rounded-lg"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <input
              type="text"
              placeholder="Location..."
              className="px-4 py-2 border rounded-lg"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <select
              className="px-4 py-2 border rounded-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="a-z">Sort: A-Z</option>
              <option value="z-a">Sort: Z-A</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {quickTypeFilters.map((f) => {
              const active = (f === "all" && type === "") || type === f;
              return (
                <button
                  key={f}
                  onClick={() => setType(f === "all" ? "" : f)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  {f === "all" ? "All Types" : f[0].toUpperCase() + f.slice(1)}
                </button>
              );
            })}

            <button
              onClick={clearFilters}
              className="ml-auto px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{filteredItems.length}</span> items
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const confidence = getConfidence(item);

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden border border-slate-100"
                  >
                    <img
                      src={item.image || "https://dummyimage.com/600x400/e5e7eb/6b7280"}
                      onClick={() => setSelectedImage(item.image)}
                      alt="item"
                      className="w-full h-44 object-cover cursor-pointer"
                    />

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-lg font-bold line-clamp-1">{item.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${
                            item.type === "lost"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">Category: {item.category}</p>
                      <p className="text-sm text-slate-600">Location: {item.location}</p>
                      <p className="text-sm text-slate-500">Date: {item.date}</p>

                      <ReporterContact user={item.user} compact />

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${confidence.color}`}>
                          Match Confidence: {confidence.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => setQuickViewItem(item)}
                          className="text-center bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition"
                        >
                          Quick View
                        </button>

                        <Link
                          to={`/item/${item._id}`}
                          className="text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center col-span-3 mt-10 bg-white border border-dashed rounded-2xl p-10"
              >
                <p className="text-slate-500 text-lg">No items found for current filters</p>
                <p className="text-slate-400 text-sm mt-1">
                  Try removing date/location filters for broader results
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Image Modal */}
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

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewItem && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
            onClick={() => setQuickViewItem(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
            >
              <h3 className="text-xl font-bold mb-2">{quickViewItem.title}</h3>
              <p className="text-sm text-slate-600 mb-1">Category: {quickViewItem.category}</p>
              <p className="text-sm text-slate-600 mb-1">Type: {quickViewItem.type}</p>
              <p className="text-sm text-slate-600 mb-1">Location: {quickViewItem.location}</p>
              <p className="text-sm text-slate-600 mb-3">Date: {quickViewItem.date}</p>
              <div className="mb-3">
                <ReporterContact user={quickViewItem.user} />
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                {quickViewItem.description || "No extra description provided."}
              </p>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setQuickViewItem(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  Close
                </button>
                <Link
                  to={`/item/${quickViewItem._id}`}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Open Details
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <UiToast message={toast} />
    </PageTransition>
  );
}

export default Search;