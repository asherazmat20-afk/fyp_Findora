import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";
import ImageCaptureUpload from "../components/ImageCaptureUpload";
import UiToast from "../components/UiToast";
import { API_BASE_URL } from "../config/api";
import { getSession } from "../utils/auth";
import { apiFetch } from "../utils/apiClient";
import OwnerVerificationModal from "../components/OwnerVerificationModal";
import { submitOwnerVerification } from "../utils/ownerVerification";

function ReportLost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [smartText, setSmartText] = useState("");
  const [aiTags, setAiTags] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [claimItem, setClaimItem] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image: null,
  });

  const progress = useMemo(() => (step / 3) * 100, [step]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleAiAutofill = async () => {
    try {
      const { token } = getSession();
      if (!token) return showToast("Please login first");
      if (!smartText.trim()) return showToast("Enter short natural description first");

      const res = await fetch(`${API_BASE_URL}/api/items/ai/parse-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: smartText,
          type: "lost",
        }),
      });

      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Autofill failed");

      setFormData((prev) => ({
        ...prev,
        itemName: data.parsed.itemName || prev.itemName,
        category: data.parsed.category || prev.category,
        description: data.parsed.description || prev.description,
        location: data.parsed.location || prev.location,
        date: data.parsed.date || prev.date,
      }));

      const enrichRes = await apiFetch(`/api/items/ai/enrich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.parsed.itemName || formData.itemName,
          description: data.parsed.description || formData.description,
          category: data.parsed.category || formData.category,
          location: data.parsed.location || formData.location,
        }),
      });
      const enrichData = await enrichRes.json();
      if (enrichRes.ok && enrichData.aiTags) {
        setAiTags(enrichData.aiTags);
      }

      showToast(`Autofill ready (${data.parsed.confidence} confidence)`);
    } catch (e) {
      showToast("Autofill failed");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageSelect = ({ file, preview }) => {
    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(preview);
  };

  const clearImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    setFileInputKey((k) => k + 1);
  };

  const validateStep = () => {
    if (step === 1 && (!formData.itemName || !formData.category || !formData.description)) {
      showToast("Please complete item details first");
      return false;
    }

    if (step === 2 && (!formData.date || !formData.time || !formData.location)) {
      showToast("Please provide date, time and location");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step !== 3) {
      nextStep();
      return;
    }

    setLoading(true);

    let imageBase64 = "";

    try {
      const { token } = getSession();
      if (!token) {
        showToast("Please login first");
        setLoading(false);
        return;
      }

      if (formData.image) {
        const reader = new FileReader();
        reader.readAsDataURL(formData.image);
        await new Promise((resolve) => {
          reader.onloadend = () => {
            imageBase64 = reader.result;
            resolve();
          };
        });
      }
      const response = await apiFetch(`/api/items/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.itemName,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          date: formData.date,
          time: formData.time,
          type: "lost",
          image: imageBase64,
          aiTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Submission failed");
        return;
      }

      showToast(data.message || "Lost item submitted");
      setSubmittedReport({
        title: formData.itemName,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        imagePreview,
      });
      setMatches(Array.isArray(data.matches) ? data.matches : []);

      setFormData({
        itemName: "",
        category: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: null,
      });
      setImagePreview(null);
      setAiTags(null);
      setStep(1);
      setFileInputKey((k) => k + 1);
    } catch (error) {
      console.error(error);
      showToast("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const openClaimModal = (matchItem) => {
    const { token } = getSession();
    if (!token) return showToast("Please login first");
    setClaimItem(matchItem);
  };

  const handleClaimSubmit = async (payload) => {
    if (!claimItem?._id) return;
    setClaimLoading(true);
    try {
      await submitOwnerVerification(claimItem._id, payload);
      showToast("Ownership verification submitted");
      setClaimItem(null);
    } catch (e) {
      showToast(e.message || "Verification failed");
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-blue-100 p-5 sm:p-8"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-700 text-center">
              Report Lost Item
            </h2>
            <p className="text-center text-gray-500 mt-2 mb-5">
              Share details clearly to increase matching chances
            </p>

            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>Step {step} of 3</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border p-3 bg-slate-50">
                      <p className="text-xs text-slate-600 mb-2">
                        Smart Assist: describe item in one sentence
                      </p>
                      <textarea
                        rows="2"
                        value={smartText}
                        onChange={(e) => setSmartText(e.target.value)}
                        placeholder="I lost a black wallet near library gate yesterday evening..."
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAiAutofill}
                        className="mt-2 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm"
                      >
                        Autofill
                      </button>
                    </div>
                    <input
                      type="text"
                      name="itemName"
                      placeholder="Item name (e.g. Grey Backpack)"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.itemName}
                      onChange={handleChange}
                      required
                    />
                    <select
                      name="category"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option>Mobile</option>
                      <option>Wallet</option>
                      <option>Documents</option>
                      <option>Electronics</option>
                      <option>Other</option>
                    </select>
                    <textarea
                      name="description"
                      placeholder="Describe color, brand, unique marks..."
                      rows="4"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="date"
                        name="date"
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="time"
                        name="time"
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <input
                      type="text"
                      name="location"
                      placeholder="Where did you lose it?"
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="space-y-4"
                  >
                    <ImageCaptureUpload
                      accent="blue"
                      inputKey={fileInputKey}
                      preview={imagePreview}
                      onSelect={handleImageSelect}
                      onClear={clearImage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1 || loading}
                  className="px-4 py-2 rounded-lg border disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-lg text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {loading ? "Submitting..." : step < 3 ? "Next" : "Submit Lost Item"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Possible Matches */}
          <div className="mt-6 bg-white rounded-2xl border shadow-sm p-5">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Possible Matches</h3>
            <p className="text-sm text-slate-500 mb-3">Found: {matches.length} match(es)</p>
            {submittedReport && (
              <div className="mb-4 rounded-xl border bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">
                  Matches for your submitted report: {submittedReport.title}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Category: {submittedReport.category} | Location: {submittedReport.location} | Date: {submittedReport.date}
                </p>
              </div>
            )}
            {matches.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {matches.map((m) => (
                  <div key={m.item._id} className="border rounded-xl p-3 bg-slate-50">
                    <img
                      src={m.item.image || "https://dummyimage.com/400x220/e5e7eb/6b7280"}
                      alt={m.item.title}
                      className="w-full h-36 object-cover rounded-lg mb-2"
                    />
                    <h4 className="font-semibold">{m.item.title}</h4>
                    <p className="text-sm text-slate-600">{m.item.location}</p>
                    <p className="text-xs text-slate-500 mb-2">Date: {m.item.date}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        Match {m.matchScore}%
                      </span>
                      <span className="text-xs capitalize text-slate-500">{m.confidence}</span>
                    </div>
                    {Array.isArray(m.reasons) && m.reasons.length > 0 && (
                      <ul className="text-xs text-slate-500 mb-2 list-disc pl-4">
                        {m.reasons.slice(0, 2).map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openClaimModal(m.item)}
                        className="flex-1 bg-violet-700 text-white py-2 rounded-lg text-sm"
                      >
                        Verify ownership
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${m.item.user?._id}`)}
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm"
                        disabled={!m.item.user?._id}
                      >
                        Message Owner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 bg-slate-50 border rounded-xl p-4">
                No high-quality matches yet. Submit more precise details (location, date, image) for better matching.
              </div>
            )}
          </div>
        </div>
      </div>

      <OwnerVerificationModal
        open={Boolean(claimItem)}
        onClose={() => setClaimItem(null)}
        onSubmit={handleClaimSubmit}
        loading={claimLoading}
        itemTitle={claimItem?.title}
      />

      <UiToast message={toast} />
    </PageTransition>
  );
}

export default ReportLost;